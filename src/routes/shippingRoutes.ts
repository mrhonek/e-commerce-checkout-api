import { Router } from 'express';
import { getShippingOptions, calculateShipping, validateAddress } from '../controllers/shippingController';

const router = Router();

// Get available shipping options
router.get('/options', getShippingOptions);

// Calculate shipping cost based on address and items
router.post('/calculate', calculateShipping);

// Validate shipping address
router.post('/validate-address', validateAddress);

export default router; 