/**
 * Custom type definitions for the e-commerce checkout API
 */

// Extend Express Request interface to include custom properties
declare namespace Express {
  export interface Request {
    userId?: string;
    user?: any;
    cart?: any;
    order?: any;
  }
}

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