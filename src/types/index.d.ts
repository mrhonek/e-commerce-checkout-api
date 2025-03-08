/**
 * Global type definitions for the entire project
 */
import { Document, Types } from 'mongoose';

// User payload for JWT authentication
export interface UserPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
      token?: string;
      cart?: any;
      order?: any;
    }
  }
}

// Extend Mongoose Document
declare module 'mongoose' {
  interface Document {
    _id: Types.ObjectId;
  }
}

// Helper types
export type WithId<T> = T & {
  _id: Types.ObjectId;
  id?: string;
};

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

/**
 * Custom type definitions for the e-commerce checkout API
 */

// Order related types
interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface OrderDetails {
  _id?: string;
  id?: string;
  userId?: string;
  items: OrderItem[];
  shippingDetails?: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    email: string;
    phone?: string;
  };
  shippingMethod?: {
    id: string;
    name: string;
    price: number;
    estimatedDelivery: string;
  };
  paymentDetails?: {
    method: string;
    cardLast4?: string;
    cardBrand?: string;
    paymentIntentId?: string;
  };
  totals: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  };
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Shipping related types
interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: number;
  description?: string;
}

// Payment related types
interface PaymentResult {
  success: boolean;
  error?: string;
  clientSecret?: string;
  paymentIntentId?: string;
}

// Product related types
interface Product {
  _id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  inStock: boolean;
  featured?: boolean;
}

// Custom environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: string;
    MONGO_URI: string;
    JWT_SECRET: string;
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
    CORS_ORIGIN: string;
  }
} 