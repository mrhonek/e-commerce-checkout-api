import { Document } from 'mongoose';
import { IAddress } from './user.interface';

/**
 * Order status enum
 */
export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

/**
 * Payment status enum
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

/**
 * Order item interface
 */
export interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  sku?: string;
  subtotal: number;
}

/**
 * Shipping method interface
 */
export interface IShippingMethod {
  id: string;
  name: string;
  price: number;
  estimatedDays: number;
  description?: string;
}

/**
 * Order totals interface
 */
export interface IOrderTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  discount?: number;
  total: number;
}

/**
 * Payment details interface
 */
export interface IPaymentDetails {
  method: 'credit_card' | 'paypal' | 'other';
  transactionId?: string;
  cardBrand?: string;
  cardLast4?: string;
  paymentIntentId?: string;
}

/**
 * Order interface representing an order in the system
 */
export interface IOrder {
  userId: string;
  orderNumber: string;
  items: IOrderItem[];
  shippingAddress: IAddress;
  billingAddress?: IAddress;
  shippingMethod: IShippingMethod;
  paymentDetails?: IPaymentDetails;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  totals: IOrderTotals;
  notes?: string;
  estimatedDeliveryDate?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Order mongoose document
 */
export interface IOrderDocument extends IOrder, Document {
  calculateTotals(): IOrderTotals;
  getFormattedOrderNumber(): string;
}

/**
 * Order response for API
 */
export interface IOrderResponse extends Omit<IOrder, 'userId'> {
  id: string;
  formattedTotals: {
    subtotal: string;
    shipping: string;
    tax: string;
    discount?: string;
    total: string;
  };
  formattedDates: {
    created: string;
    estimated?: string;
    shipped?: string;
    delivered?: string;
  };
} 