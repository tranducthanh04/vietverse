import { Router } from 'express';
import { createHmac } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../../../config/env.js';
import { ContentDraft } from '../../../models/ContentDraft.js';
import { User } from '../../../models/User.js';
import { contentImageStorage } from '../../../services/contentImageStorage.js';
import { sendSuccess } from '../../../utils/apiResponse.js';

const router = Router();
const inputSchema = z.object({
  kind: z.enum(['story', 'culture']), contentId: z.string().regex(/^[a-f0-9]{24}$/),
  draftVersion: z.number().int().positive(), bytes: z.number().int().min(1).max(5242880),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']), requestId: z.string().uuid(),
}).strict();
const ticketSchema = inputSchema.extend({ adminId: z.string(), publicId: z.string().regex(/^vietverse\/content-images\/[a-f0-9]{64}$/), purpose: z.literal('cms-cover-image') }).strip();
async function assertContext(adminId: string, input: z.infer<typeof inputSchema>) {
  if (!await User.exists({ _id: adminId, role: 'admin' })) throw { statusCode: 403, code: 'FORBIDDEN', message: 'Chỉ quản trị viên được tải ảnh.' };
  const draft = await ContentDraft.findOne({ kind: input.kind, contentId: input.contentId }).select('state draftVersion');
  if (!draft) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Không tìm thấy bản nháp.' };
  if (draft.state !== 'editing' || draft.draftVersion !== input.draftVersion) throw { statusCode: 409, code: 'IMAGE_DRAFT_CHANGED', message: 'Bản nháp đã thay đổi. Tải lại bản nháp trước khi gửi ảnh.' };
}
router.post('/intent', async (req, res, next) => {
  try {
    const input = inputSchema.parse(req.body);
    const adminId = req.user!.id;
    await assertContext(adminId, input);
    // Retry IDs are scoped to the actor, draft and declaration without persisting upload sessions.
    const digest = createHmac('sha256', env.JWT_SECRET).update(JSON.stringify([adminId, input])).digest('hex');
    const publicId = `vietverse/content-images/${digest}`;
    const upload = contentImageStorage.sign(publicId, Math.floor(Date.now() / 1000));
    const ticket = jwt.sign({ ...input, adminId, publicId, purpose: 'cms-cover-image' }, env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '10m', audience: 'cms-cover-image' });
    res.setHeader('Cache-Control', 'no-store');
    sendSuccess(res, { ticket, upload }, 201);
  } catch (error) { next(error); }
});
router.post('/finalize', async (req, res, next) => {
  try {
    const { ticket } = z.object({ ticket: z.string().max(4096) }).strict().parse(req.body);
    let claims;
    try { claims = ticketSchema.parse(jwt.verify(ticket, env.JWT_SECRET, { algorithms: ['HS256'], audience: 'cms-cover-image' })); }
    catch { throw { statusCode: 401, code: 'IMAGE_TICKET_INVALID', message: 'Lượt tải ảnh hết hạn hoặc không hợp lệ. Chọn gửi lại ảnh.' }; }
    if (claims.adminId !== req.user!.id) throw { statusCode: 403, code: 'FORBIDDEN', message: 'Lượt tải ảnh không thuộc tài khoản này.' };
    await assertContext(req.user!.id, claims);
    const image = await contentImageStorage.inspect(claims.publicId);
    await assertContext(req.user!.id, claims);
    res.setHeader('Cache-Control', 'no-store');
    sendSuccess(res, image);
  } catch (error) { next(error); }
});
export default router;
