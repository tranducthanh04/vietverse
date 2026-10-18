import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose, { type ClientSession } from 'mongoose';
import { User, IUser } from '../../models/User.js';
import { Subscription } from '../../models/Subscription.js';
import { RefreshToken } from '../../models/RefreshToken.js';
import { env } from '../../config/env.js';
import { ROLES } from '../../constants/roles.js';
import { mapTransactionError } from '../../utils/dbErrors.js';

const sessionTransactionOptions = { maxCommitTimeMS: 5000, timeoutMS: 15000 };
const invalidRefresh = () => ({ statusCode: 401, message: 'Mã làm mới (refresh token) không hợp lệ hoặc đã bị thu hồi' });
const sessionUnavailable = () => ({ statusCode: 503, code: 'DATABASE_UNAVAILABLE', message: 'Không thể cập nhật phiên lúc này. Vui lòng thử lại.' });

export interface TokenPayload {
  id: string;
  role: string;
  email: string;
  family?: string;
}

export class AuthService {
  static async generateTokens(user: IUser, existingFamily?: string, session?: ClientSession) {
    const family = existingFamily || crypto.randomUUID();

    const payload = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      family,
      jti: crypto.randomUUID(),
    };

    const accessToken = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        email: user.email,
      },
      env.JWT_SECRET,
      {
        expiresIn: '15m',
      }
    );

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: '7d',
    });

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const record = {
      userId: user._id,
      tokenHash,
      family,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
    if (session) await RefreshToken.create([record], { session });
    else await RefreshToken.create(record);

    return { accessToken, refreshToken };
  }

  static async register(data: { email: string; password: string; displayName: string }) {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw { statusCode: 409, message: 'Email này đã được đăng ký tài khoản' };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await User.create({
      email: data.email.toLowerCase(),
      passwordHash,
      displayName: data.displayName,
      role: ROLES.PARENT,
    });

    // Create default free subscription
    await Subscription.create({
      userId: user._id,
      plan: 'free',
      maxChildren: 1,
      startedAt: new Date(),
    });

    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
      ...tokens,
    };
  }

  static async login(data: { email: string; password: string }) {
    const user = await User.findOne({ email: data.email.toLowerCase() });
    if (!user) {
      throw { statusCode: 401, message: 'Email hoặc mật khẩu không chính xác' };
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw { statusCode: 401, message: 'Email hoặc mật khẩu không chính xác' };
    }

    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
      ...tokens,
    };
  }

  static async refresh(refreshToken: string) {
    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as TokenPayload;
    } catch {
      throw { statusCode: 401, message: 'Mã làm mới (refresh token) không hợp lệ hoặc đã hết hạn' };
    }
    try {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const locator = await RefreshToken.findOne({ tokenHash });
      if (!locator) throw invalidRefresh();
      const result = await mongoose.connection.transaction(async session => {
        // A real shared write serializes rotation, ancestor reuse and logout;
        // a transaction on separate token documents alone misses new descendants.
        await User.updateOne({ _id: decoded.id }, { $inc: { __v: 1 } }, { session, timestamps: false });
        const tokenRecord = await RefreshToken.findOne({ tokenHash }).session(session);
        if (!tokenRecord) return null;
        if (tokenRecord.isRevoked) {
          await RefreshToken.updateMany({ family: tokenRecord.family }, { $set: { isRevoked: true } }, { session });
          // Returning commits the family revocation; throwing here would undo it.
          return null;
        }
        const user = await User.findById(decoded.id).session(session);
        if (!user) throw { statusCode: 401, message: 'Người dùng không tồn tại' };
        tokenRecord.isRevoked = true;
        await tokenRecord.save({ session });
        const tokens = await this.generateTokens(user, tokenRecord.family, session);
        return { ...tokens, ...(await this.profile(user, session)) };
      }, sessionTransactionOptions);
      if (!result) throw invalidRefresh();
      return result;
    } catch (error) {
      throw mapTransactionError(error, sessionUnavailable);
    }
  }

  static async logout(refreshToken?: string, userId?: string) {
    try {
      const tokenRecord = refreshToken
        ? await RefreshToken.findOne({ tokenHash: crypto.createHash('sha256').update(refreshToken).digest('hex') })
        : null;
      const owners = [...new Set([tokenRecord?.userId.toString(), userId].filter((id): id is string => Boolean(id)))].sort();
      if (!owners.length) return;
      await mongoose.connection.transaction(async session => {
        // Stable ordering also covers service callers revoking two account scopes.
        for (const owner of owners) {
          await User.updateOne({ _id: owner }, { $inc: { __v: 1 } }, { session, timestamps: false });
        }
        if (tokenRecord) {
          await RefreshToken.updateMany({ family: tokenRecord.family }, { $set: { isRevoked: true } }, { session });
        }
        if (userId) {
          await RefreshToken.updateMany({ userId }, { $set: { isRevoked: true } }, { session });
        }
      }, sessionTransactionOptions);
    } catch (error) {
      throw mapTransactionError(error, sessionUnavailable);
    }
  }

  static async getMe(userId: string) {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      throw { statusCode: 404, message: 'Không tìm thấy người dùng' };
    }
    return this.profile(user);
  }

  /** Public account shape shared by GET /auth/me and POST /auth/refresh. */
  private static async profile(user: IUser, session?: ClientSession) {
    const subscription = await Subscription.findOne({ userId: user._id }).session(session ?? null);

    return {
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
      subscription: subscription
        ? {
            plan: subscription.plan,
            maxChildren: subscription.maxChildren,
            startedAt: subscription.startedAt,
            expiresAt: subscription.expiresAt,
          }
        : {
            plan: 'free',
            maxChildren: 1,
          },
    };
  }
}
