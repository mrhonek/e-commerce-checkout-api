import { Document } from 'mongoose';

/**
 * Product interface representing a product in the system
 */
export interface IProduct {
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  category: string;
  tags?: string[];
  sku: string;
  stockQuantity: number;
  isInStock: boolean;
  isFeatured?: boolean;
  attributes?: {
    [key: string]: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product mongoose document
 */
export interface IProductDocument extends IProduct, Document {
  isOnSale(): boolean;
  getDiscountPercentage(): number;
}

/**
 * Product response for API
 */
export interface IProductResponse extends Omit<IProduct, 'createdAt' | 'updatedAt'> {
  id: string;
  formattedPrice: string;
  formattedCompareAtPrice?: string;
  onSale: boolean;
  discountPercentage?: number;
}

/**
 * Product search query parameters
 */
export interface IProductSearchQuery {
  category?: string;
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  sortBy?: 'price' | 'name' | 'newest';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  limit?: number;
} 