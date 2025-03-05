import { Request, Response } from 'express';
import { Cart, CartItem } from '../models/cart';

// Mock data for cart
let cart: Cart = {
  items: [],
  subtotal: 0,
  tax: 0,
  shipping: 0,
  total: 0
};

// Get cart contents
export const getCart = (req: Request, res: Response) => {
  res.status(200).json(cart);
};

// Add item to cart
export const addToCart = (req: Request, res: Response) => {
  try {
    const { productId, name, price, quantity, image } = req.body;
    
    if (!productId || !name || !price || !quantity) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const existingItemIndex = cart.items.findIndex((item) => item.productId === productId);
    
    if (existingItemIndex > -1) {
      // Update existing item
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      const newItem: CartItem = {
        id: Date.now().toString(),
        productId,
        name,
        price,
        quantity,
        image
      };
      cart.items.push(newItem);
    }
    
    // Update cart totals
    updateCartTotals();
    
    res.status(201).json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add item to cart' });
  }
};

// Update cart item
export const updateCartItem = (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    
    if (!quantity) {
      return res.status(400).json({ message: 'Quantity is required' });
    }
    
    const itemIndex = cart.items.findIndex((item) => item.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Update item quantity
    cart.items[itemIndex].quantity = quantity;
    
    // Update cart totals
    updateCartTotals();
    
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update cart item' });
  }
};

// Remove item from cart
export const removeFromCart = (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    
    const itemIndex = cart.items.findIndex((item) => item.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Remove item
    cart.items.splice(itemIndex, 1);
    
    // Update cart totals
    updateCartTotals();
    
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove item from cart' });
  }
};

// Clear cart
export const clearCart = (req: Request, res: Response) => {
  try {
    // Reset cart
    cart.items = [];
    updateCartTotals();
    
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Failed to clear cart' });
  }
};

// Helper function to update cart totals
const updateCartTotals = () => {
  // Calculate subtotal
  cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calculate tax (10%)
  cart.tax = cart.subtotal * 0.1;
  
  // Calculate shipping (flat rate for now)
  cart.shipping = cart.items.length > 0 ? 5.99 : 0;
  
  // Calculate total
  cart.total = cart.subtotal + cart.tax + cart.shipping;
  
  // Round all values to 2 decimal places
  cart.subtotal = parseFloat(cart.subtotal.toFixed(2));
  cart.tax = parseFloat(cart.tax.toFixed(2));
  cart.shipping = parseFloat(cart.shipping.toFixed(2));
  cart.total = parseFloat(cart.total.toFixed(2));
}; 