import express from 'express';
import { createOrder, getOrder, getOrders } from '../controllers/orderController';

const router = express.Router();

// Get all orders
router.get('/', getOrders);

// Get order by ID
router.get('/:orderId', getOrder);

// Create a new order
router.post('/', createOrder);

export const orderRoutes = router; 