import { Router } from 'express';
import { createPaymentIntent, confirmPayment, getPaymentMethods } from '../controllers/paymentController';

const router = Router();

// Get available payment methods
router.get('/methods', getPaymentMethods);

// Create payment intent
router.post('/create-intent', createPaymentIntent);

// Confirm payment
router.post('/confirm', confirmPayment);

export default router; 