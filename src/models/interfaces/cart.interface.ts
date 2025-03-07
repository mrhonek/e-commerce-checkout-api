import { Document } from 'mongoose';
import { IAddress } from './user.interface';

/**
 * Cart item interface
 */
export interface ICartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  sku?: string;
  subtotal?: number; // Calculated field (price * quantity)
}

/**
 * Cart totals interface
 */
export interface ICartTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  discount?: number;
  total: number;
}

/**
 * Cart interface representing a shopping cart
 */
export interface ICart {
  userId?: string; // Can be anonymous
  sessionId?: string; // For guest carts
  items: ICartItem[];
  totals: ICartTotals;
  shippingAddress?: IAddress;
  shippingMethodId?: string;
  couponCode?: string;
  notes?: string;
  expiresAt?: Date; // For anonymous carts
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cart mongoose document
 */
export interface ICartDocument extends ICart, Document {
  addItem(item: Omit<ICartItem, 'subtotal'>): Promise<ICartDocument>;
  removeItem(productId: string): Promise<ICartDocument>;
  updateItemQuantity(productId: string, quantity: number): Promise<ICartDocument>;
  calculateTotals(): ICartTotals;
  clearCart(): Promise<ICartDocument>;
  isEmpty(): boolean;
}

/**
 * Cart item add/update payload
 */
export interface ICartItemPayload {
  productId: string;
  quantity: number;
}

/**
 * Cart response for API
 */
export interface ICartResponse {
  id: string;
  items: (ICartItem & { formattedPrice: string; formattedSubtotal: string })[];
  itemCount: number;
  totals: ICartTotals & {
    formattedSubtotal: string;
    formattedShipping: string;
    formattedTax: string;
    formattedDiscount?: string;
    formattedTotal: string;
  };
  shippingAddress?: IAddress;
  shippingMethodId?: string;
  couponCode?: string;
} 