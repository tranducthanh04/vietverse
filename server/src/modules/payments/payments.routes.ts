import { Router } from 'express';
import { PaymentsController } from './payments.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { ROLES } from '../../constants/roles.js';

const router = Router();

router.post('/test-checkout', authMiddleware, requireRole(ROLES.ADMIN), PaymentsController.createTestCheckout);
router.get('/test-orders/:orderCode', authMiddleware, requireRole(ROLES.ADMIN), PaymentsController.getTestOrderDetails);

/**
 * @route   POST /api/v1/payments/create-checkout
 * @desc    Khởi tạo đơn hàng thanh toán (gói monthly / yearly)
 * @access  Private (Parent / Authenticated user)
 */
router.post('/create-checkout', authMiddleware, PaymentsController.createCheckout);

/**
 * @route   POST /api/v1/payments/webhook
 * @desc    Webhook xử lý kết quả thanh toán tự động từ Cổng thanh toán (PayOS / VietQR)
 * @access  Public (Payment Gateway Webhook Callback)
 */
router.post('/webhook', PaymentsController.handleWebhook);

/**
 * @route   GET /api/v1/payments/history
 * @desc    Xem lịch sử giao dịch thanh toán của phụ huynh
 * @access  Private (Parent)
 */
router.get('/history', authMiddleware, PaymentsController.getPaymentHistory);

/**
 * @route   GET /api/v1/payments/orders/:orderCode
 * @desc    Xem chi tiết đơn hàng thanh toán theo mã orderCode
 * @access  Private (Parent)
 */
router.get('/orders/:orderCode', authMiddleware, PaymentsController.getOrderDetails);

export default router;
