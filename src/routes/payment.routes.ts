import { Router } from 'express';
import { body } from 'express-validator';
import { paymentController } from '../controllers/payment.controller';
import { protect, validate } from '../middleware';

// Create router
const router = Router();

/**
 * @route   POST /api/payments/create-intent
 * @desc    Create a payment intent
 * @access  Private
 */
router.post(
  '/create-intent',
  [
    protect,
    validate([
      body('amount').isNumeric().withMessage('Amount must be a number'),
      body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code')
    ])
  ],
  paymentController.createPaymentIntent
);

/**
 * @route   POST /api/payments/confirm
 * @desc    Confirm a payment
 * @access  Private
 */
router.post(
  '/confirm',
  [
    protect,
    validate([
      body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required')
    ])
  ],
  paymentController.confirmPayment
);

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Stripe webhook events
 * @access  Public (with Stripe signature verification)
 */
router.post(
  '/webhook',
  // Webhook handling requires raw body, so no express.json() middleware
  // This is handled in the controller itself with the Stripe SDK
  paymentController.handleWebhook
);

export default router; 