/**
 * Utility functions for handling orders
 */
import { formatCurrency } from './formatCurrency';

/**
 * Generates a random order ID for testing purposes
 */
export function generateOrderId(): string {
  const timestamp = new Date().getTime().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${timestamp}-${random}`;
}

/**
 * Calculates order totals based on items
 */
export function calculateOrderTotals(items: any[], shippingCost: number = 0): { 
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
} {
  // Calculate subtotal from items
  const subtotal = items.reduce((sum, item) => {
    const price = item.price || 0;
    const quantity = item.quantity || 1;
    return sum + (price * quantity);
  }, 0);
  
  // Calculate tax (assume 8.5% tax rate)
  const taxRate = 0.085;
  const tax = subtotal * taxRate;
  
  // Calculate total
  const total = subtotal + tax + shippingCost;
  
  return {
    subtotal,
    shipping: shippingCost,
    tax,
    total
  };
}

/**
 * Formats an order for display
 */
export function formatOrderForDisplay(order: any): any {
  if (!order) return null;
  
  // Create a copy to avoid modifying the original
  const formattedOrder = { ...order };
  
  // Format currency fields
  if (formattedOrder.totals) {
    formattedOrder.totals.formattedSubtotal = formatCurrency(formattedOrder.totals.subtotal);
    formattedOrder.totals.formattedShipping = formatCurrency(formattedOrder.totals.shipping);
    formattedOrder.totals.formattedTax = formatCurrency(formattedOrder.totals.tax);
    formattedOrder.totals.formattedTotal = formatCurrency(formattedOrder.totals.total);
  }
  
  // Format dates
  if (formattedOrder.createdAt) {
    formattedOrder.formattedDate = new Date(formattedOrder.createdAt).toLocaleDateString();
  }
  
  return formattedOrder;
} 