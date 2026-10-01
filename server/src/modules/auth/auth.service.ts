import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../../models/User.js';
import { Subscription } from '../../models/Subscription.js';
import { env } from '../../config/env.js';
import { ROLES } from '../../constants/roles.js';

export interface TokenPayload {
  id: string;
  role: string;
  email: string;
}

export class AuthService {
  static generateTokens(user: IUser) {
    const payload: TokenPayload = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: '15m',
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: '7d',
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

    const tokens = this.generateTokens(user);

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

    const tokens = this.generateTokens(user);

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
      const user = await User.findById(decoded.id);
      if (!user) {
        throw { statusCode: 401, message: 'Người dùng không tồn tại' };
      }

      const tokens = this.generateTokens(user);
      return tokens;
    } catch (err: any) {
      throw { statusCode: 401, message: 'Mã làm mới (refresh token) không hợp lệ hoặc đã hết hạn' };
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
        parentGatePin: user.parentGatePin,
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
