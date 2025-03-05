import { Address } from './shipping';

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Customer {
  name: string;
  email: string;
}

export interface ShippingInfo {
  address: Address;
  method: string;
  cost: number;
  estimatedDelivery: string;
}

export interface BillingInfo {
  address: Address;
  paymentMethod: string;
  lastFourDigits: string;
}

export interface OrderTotals {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

export interface StatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface Order {
  id: string;
  date: string;
  customer: Customer;
  items: OrderItem[];
  shipping: ShippingInfo;
  billing: BillingInfo;
  totals: OrderTotals;
  status: OrderStatus;
  statusHistory: StatusHistoryItem[];
} 