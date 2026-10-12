import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { GoogleAuthFlow } from '../../models/GoogleAuthFlow.js';
import { User, type IUser } from '../../models/User.js';
import { Subscription } from '../../models/Subscription.js';
import { AuthService } from './auth.service.js';

const google = new OAuth2Client();
const hash = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
const invalidFlow = () => ({ statusCode: 401, code: 'GOOGLE_FLOW_INVALID', message: 'Phiên Google không hợp lệ hoặc đã hết hạn. Vui lòng bắt đầu lại.' });
const conflict = () => ({ statusCode: 409, code: 'GOOGLE_LINK_CONFLICT', message: 'Không thể liên kết tài khoản Google này. Vui lòng đăng nhập bằng phương thức hiện có.' });

export class GoogleAuthService {
  static config() {
    if (!env.GOOGLE_CLIENT_ID) throw { statusCode: 503, code: 'GOOGLE_NOT_CONFIGURED', message: 'Đăng nhập Google chưa được cấu hình. Bạn vẫn có thể dùng email và mật khẩu.' };
    return { clientId: env.GOOGLE_CLIENT_ID };
  }

  static async start(previousToken?: string) {
    const config = this.config();
    await this.assertIdentityIndex();
    if (previousToken) await GoogleAuthFlow.deleteOne({ tokenHash: hash(previousToken) });
    const token = crypto.randomBytes(32).toString('hex');
    const nonce = crypto.randomBytes(32).toString('hex');
    await GoogleAuthFlow.create({ tokenHash: hash(token), nonce, expiresAt: new Date(Date.now() + 5 * 60_000) });
    return { ...config, token, nonce };
  }

  static async cancel(token: string | undefined, nonce: string) {
    if (token) await GoogleAuthFlow.deleteOne({ tokenHash: hash(token), nonce });
  }

  private static async assertIdentityIndex() {
    try {
      await Promise.all([User.init(), GoogleAuthFlow.init()]);
      const indexes = await User.collection.indexes();
      if (indexes.some(index => index.name === 'google_identity_unique' && index.unique === true && index.key.googleId === 1)) return;
    } catch { /* A failed/missing unique index must never allow duplicate Google identities. */ }
    throw { statusCode: 503, code: 'GOOGLE_STORAGE_NOT_READY', message: 'Đăng nhập Google đang chờ chuẩn bị cơ sở dữ liệu. Vui lòng dùng email và mật khẩu.' };
  }

  private static filter(token: string | undefined, nonce: string) {
    if (!token || token.length !== 64) throw invalidFlow();
    return { tokenHash: hash(token), nonce, expiresAt: { $gt: new Date() } };
  }

  private static async transaction<T>(work: (session: mongoose.ClientSession) => Promise<T>) {
    try {
      return await mongoose.connection.transaction(work);
    } catch (error) {
      if (typeof error === 'object' && error && 'statusCode' in error) throw error;
      if (typeof error === 'object' && error && 'code' in error && error.code === 11000) throw conflict();
      throw { statusCode: 503, code: 'DATABASE_UNAVAILABLE', message: 'Chưa thể hoàn tất đăng nhập. Vui lòng thử lại.' };
    }
  }

  private static async session(user: IUser) {
    const tokens = await AuthService.generateTokens(user);
    return { user: { id: user._id, email: user.email, displayName: user.displayName, role: user.role }, ...tokens };
  }

  static async signIn(token: string | undefined, nonce: string, credential: string) {
    this.config();
    const filter = { ...this.filter(token, nonce), state: 'fresh' };
    if (!await GoogleAuthFlow.exists(filter)) throw invalidFlow();
    const payload = await (async () => {
      try {
        const ticket = await google.verifyIdToken({ idToken: credential, audience: env.GOOGLE_CLIENT_ID });
        return ticket.getPayload();
      } catch {
        throw { statusCode: 401, code: 'GOOGLE_TOKEN_INVALID', message: 'Không xác minh được tài khoản Google. Vui lòng thử lại.' };
      }
    })();
    const tokenNonce = (payload as (typeof payload & { nonce?: string }))?.nonce;
    if (!payload || !payload.sub || payload.sub.length > 255 || payload.email_verified !== true ||
      !z.string().email().max(254).safeParse(payload.email).success || payload.aud !== env.GOOGLE_CLIENT_ID ||
      !['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss) ||
      !Number.isFinite(payload.exp) || payload.exp <= Date.now() / 1000 || tokenNonce !== nonce) throw invalidFlow();
    const email = payload.email!.trim().toLowerCase();
    // Preserve the required password schema without inventing a usable password for Google-only users.
    const passwordHash = await bcrypt.hash(crypto.randomBytes(48).toString('base64url'), 10);
    const result = await this.transaction(async session => {
      const flow = await GoogleAuthFlow.findOneAndDelete(filter, { session });
      if (!flow) throw invalidFlow();
      const linked = await User.findOne({ googleId: payload.sub }).session(session);
      if (linked) return { user: linked };
      const existing = await User.findOne({ email }).session(session);
      if (existing) {
        if (existing.googleId) throw conflict();
        await GoogleAuthFlow.create([{
          tokenHash: flow.tokenHash, nonce, expiresAt: flow.expiresAt, state: 'link',
          googleId: payload.sub, userId: existing._id,
        }], { session });
        return { linkRequired: true as const, email };
      }
      const [user] = await User.create([{
        email, googleId: payload.sub, passwordHash, role: 'parent',
        displayName: payload.name?.trim().slice(0, 50) || 'Phụ huynh',
      }], { session });
      await Subscription.create([{ userId: user._id, plan: 'free', maxChildren: 1, startedAt: new Date() }], { session });
      return { user };
    });
    return result.user ? this.session(result.user) : { linkRequired: true as const, email };
  }

  static async link(token: string | undefined, nonce: string, password: string) {
    this.config();
    const filter = { ...this.filter(token, nonce), state: 'link' };
    // Reserve an attempt atomically, including failed passwords and concurrent requests.
    const flow = await GoogleAuthFlow.findOneAndUpdate({ ...filter, attempts: { $lt: 5 } }, { $inc: { attempts: 1 } }, { new: true });
    if (!flow) throw invalidFlow();
    const candidate = await User.findById(flow.userId);
    if (!candidate || !await bcrypt.compare(password, candidate.passwordHash)) {
      throw { statusCode: 401, code: 'GOOGLE_LINK_PASSWORD_INVALID', message: 'Mật khẩu Vietverse chưa đúng. Tối đa 5 lần thử trong phiên này.' };
    }
    const user = await this.transaction(async session => {
      if (!await GoogleAuthFlow.findOneAndDelete({ ...filter, _id: flow._id }, { session })) throw invalidFlow();
      const linked = await User.findOneAndUpdate({
        _id: candidate._id, passwordHash: candidate.passwordHash, googleId: { $exists: false },
      }, { $set: { googleId: flow.googleId } }, { session, new: true });
      if (!linked) throw conflict();
      return linked;
    });
    return this.session(user);
  }
}
