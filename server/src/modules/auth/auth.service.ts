import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser } from '../../models/User.js';
import { Subscription } from '../../models/Subscription.js';
import { RefreshToken } from '../../models/RefreshToken.js';
import { env } from '../../config/env.js';
import { ROLES } from '../../constants/roles.js';

export interface TokenPayload {
  id: string;
  role: string;
  email: string;
  family?: string;
}

export class AuthService {
  static async generateTokens(user: IUser, existingFamily?: string) {
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
    await RefreshToken.create({
      userId: user._id,
      tokenHash,
      family,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

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
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as TokenPayload;
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      const tokenRecord = await RefreshToken.findOne({ tokenHash });
      if (!tokenRecord || tokenRecord.isRevoked) {
        // Reuse detection: if token is already revoked, compromise detected, revoke whole family!
        if (tokenRecord?.family) {
          await RefreshToken.updateMany({ family: tokenRecord.family }, { $set: { isRevoked: true } });
        }
        throw { statusCode: 401, message: 'Mã làm mới (refresh token) không hợp lệ hoặc đã bị thu hồi' };
      }

      // Mark current token as revoked (used)
      tokenRecord.isRevoked = true;
      await tokenRecord.save();

      const user = await User.findById(decoded.id);
      if (!user) {
        throw { statusCode: 401, message: 'Người dùng không tồn tại' };
      }

      // Rotate with a new refresh token within the same family
      const tokens = await this.generateTokens(user, tokenRecord.family);
      return tokens;
    } catch (err: any) {
      if (err.statusCode) throw err;
      throw { statusCode: 401, message: 'Mã làm mới (refresh token) không hợp lệ hoặc đã hết hạn' };
    }
  }

  static async logout(refreshToken?: string, userId?: string) {
    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const tokenRecord = await RefreshToken.findOne({ tokenHash });
      if (tokenRecord) {
        await RefreshToken.updateMany({ family: tokenRecord.family }, { $set: { isRevoked: true } });
      }
    }
    if (userId) {
      await RefreshToken.updateMany({ userId }, { $set: { isRevoked: true } });
    }
  }

  static async getMe(userId: string) {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      throw { statusCode: 404, message: 'Không tìm thấy người dùng' };
    }

    const subscription = await Subscription.findOne({ userId: user._id });

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
