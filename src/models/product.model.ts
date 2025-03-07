import mongoose, { Schema } from 'mongoose';
import { IProductDocument } from './interfaces';
import { formatCurrency } from '../utils/formatCurrency';

// TypeScript interface for schema methods and 'this' context
interface ProductMethods {
  isOnSale(): boolean;
  getDiscountPercentage(): number;
}

/**
 * Product schema definition
 */
const ProductSchema = new Schema<IProductDocument, mongoose.Model<IProductDocument>, ProductMethods>({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Product slug is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  compareAtPrice: {
    type: Number,
    min: [0, 'Compare at price cannot be negative']
  },
  images: {
    type: [String],
    default: []
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    index: true
  },
  tags: {
    type: [String],
    default: []
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    index: true
  },
  stockQuantity: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock quantity cannot be negative'],
    default: 0
  },
  isInStock: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  attributes: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
    virtuals: true
  }
});

/**
 * Pre-save hook to update stock status
 */
ProductSchema.pre('save', function(next) {
  // Update isInStock based on stockQuantity
  this.isInStock = this.stockQuantity > 0;
  next();
});

/**
 * Method to check if product is on sale
 */
ProductSchema.methods.isOnSale = function(this: IProductDocument): boolean {
  return !!(this.compareAtPrice && this.compareAtPrice > this.price);
};

/**
 * Method to calculate discount percentage
 */
ProductSchema.methods.getDiscountPercentage = function(this: IProductDocument): number {
  if (!this.compareAtPrice || this.compareAtPrice <= this.price) {
    return 0;
  }
  
  const discount = ((this.compareAtPrice - this.price) / this.compareAtPrice) * 100;
  return Math.round(discount);
};

/**
 * Virtual for formatted price
 */
ProductSchema.virtual('formattedPrice').get(function(this: IProductDocument) {
  return formatCurrency(this.price);
});

/**
 * Virtual for formatted compare at price
 */
ProductSchema.virtual('formattedCompareAtPrice').get(function(this: IProductDocument) {
  return this.compareAtPrice ? formatCurrency(this.compareAtPrice) : undefined;
});

// Create and export the model
const Product = mongoose.model<IProductDocument, mongoose.Model<IProductDocument, {}, ProductMethods>>('Product', ProductSchema);

export default Product; 