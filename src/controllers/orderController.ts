import { Request, Response } from 'express';
import { Order, OrderStatus } from '../models/order';

// Mock orders data
let orders: Order[] = [];
let nextOrderId = 1000;

// Get all orders
export const getOrders = (req: Request, res: Response) => {
  res.status(200).json(orders);
};

// Get order by ID
export const getOrder = (req: Request, res: Response) => {
  const { orderId } = req.params;
  
  const order = orders.find(order => order.id === orderId);
  
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }
  
  res.status(200).json(order);
};

// Create a new order
export const createOrder = (req: Request, res: Response) => {
  try {
    const { items, shippingAddress, billingAddress, paymentInfo, shippingMethod } = req.body;
    
    if (!items || !shippingAddress || !paymentInfo || !shippingMethod) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Calculate order totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1; // 10% tax
    const shipping = shippingMethod.price || 5.99; // Default to $5.99 if not specified
    const total = subtotal + tax + shipping;
    
    // Create a new order
    const newOrder: Order = {
      id: `ORD-${nextOrderId++}`,
      date: new Date().toISOString(),
      customer: {
        name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        email: req.body.email || 'customer@example.com'
      },
      items: items.map((item: any) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      })),
      shipping: {
        address: shippingAddress,
        method: shippingMethod.name,
        cost: shipping,
        estimatedDelivery: shippingMethod.estimatedDelivery
      },
      billing: {
        address: billingAddress || shippingAddress, // Use shipping address if billing not provided
        paymentMethod: paymentInfo.type || 'card',
        lastFourDigits: paymentInfo.lastFourDigits || '1234'
      },
      totals: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        shipping: parseFloat(shipping.toFixed(2)),
        total: parseFloat(total.toFixed(2))
      },
      status: OrderStatus.PROCESSING,
      statusHistory: [
        {
          status: OrderStatus.PROCESSING,
          timestamp: new Date().toISOString(),
          note: 'Order received'
        }
      ]
    };
    
    // Add to orders array
    orders.push(newOrder);
    
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create order' });
  }
}; 