import express from 'express';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '../controllers/cartController';

const router = express.Router();

// Get cart contents
router.get('/', getCart);

// Add item to cart
router.post('/items', addToCart);

// Update cart item
router.put('/items/:itemId', updateCartItem);

// Remove item from cart
router.delete('/items/:itemId', removeFromCart);

// Clear cart
router.delete('/', clearCart);

export const cartRoutes = router; 