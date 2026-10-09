import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../constants/roles.js';
import { POINT_RULES, POINT_RULE_KEYS, PointRuleKey } from '../../constants/points.js';
import { PointRule, POINT_RULE_MAX_AMOUNT } from '../../models/PointRule.js';
import { AdminAuditLog } from '../../models/AdminAuditLog.js';
import { clearPointRulesCache, listPointRules } from '../../services/pointRules.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

/**
 * D3: admins may only change amount/active of the built-in rules; no new rule keys.
 * Mounted at /admin/point-rules. Guards are repeated here so the router stays safe even
 * if it is mounted outside the admin router.
 */
export const updatePointRuleSchema = z
  .object({
    amount: z.number().int().min(0).max(POINT_RULE_MAX_AMOUNT).optional(),
    active: z.boolean().optional(),
  })
  .strict()
  .refine((data) => data.amount !== undefined || data.active !== undefined, {
    message: 'Cần gửi ít nhất amount hoặc active để cập nhật quy tắc điểm',
  });

const pointRuleKeySchema = z.enum(POINT_RULE_KEYS as [PointRuleKey, ...PointRuleKey[]]);

async function getRules(_req: Request, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, await listPointRules());
  } catch (error) {
    next(error);
  }
}

async function updateRule(req: Request, res: Response, next: NextFunction) {
  try {
    const parsedKey = pointRuleKeySchema.safeParse(req.params.key);
    if (!parsedKey.success) {
      throw { statusCode: 404, code: 'POINT_RULE_NOT_FOUND', message: 'Không tìm thấy quy tắc điểm' };
    }
    const key = parsedKey.data;
    const changes = updatePointRuleSchema.parse(req.body);

    const previous = (await listPointRules()).find((rule) => rule.key === key)!;
    // First edit materialises the rule; untouched fields keep the effective defaults.
    const setOnInsert: Partial<{ amount: number; active: boolean }> = {};
    if (changes.amount === undefined) setOnInsert.amount = POINT_RULES[key];
    if (changes.active === undefined) setOnInsert.active = true;
    await PointRule.findOneAndUpdate(
      { key },
      { $set: changes, $setOnInsert: { key, ...setOnInsert } },
      { upsert: true, new: true, runValidators: true }
    );
    clearPointRulesCache();

    const updated = (await listPointRules()).find((rule) => rule.key === key)!;
    if (req.user?.id) {
      await AdminAuditLog.create({
        adminId: req.user.id,
        action: 'update_point_rule',
        targetType: 'PointRule',
        targetId: key,
        details: {
          previous: { amount: previous.amount, active: previous.active },
          next: { amount: updated.amount, active: updated.active },
        },
      }).catch(() => {});
    }
    return sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
}

const router = Router();
router.use(authMiddleware);
router.use(requireRole(ROLES.ADMIN));
router.get('/', getRules);
router.patch('/:key', updateRule);

export default router;
