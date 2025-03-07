import mongoose, { Schema } from 'mongoose';
import { ICartDocument, ICartItem, ICartTotals } from './interfaces';
import { formatCurrency } from '../utils/formatCurrency';

// TypeScript interface for cart methods and 'this' context
interface CartMethods {
  addItem(item: Omit<ICartItem, 'subtotal'>): Promise<ICartDocument>;
  removeItem(productId: string): Promise<ICartDocument>;
  updateItemQuantity(productId: string, quantity: number): Promise<ICartDocument>;
  calculateTotals(): ICartTotals;
  clearCart(): Promise<ICartDocument>;
  isEmpty(): boolean;
}

/**
 * Cart item schema for embedded documents
 */
const CartItemSchema: Schema = new Schema({
  productId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  image: String,
  sku: String,
  subtotal: Number
}, { _id: true });

/**
 * Address schema for embedded documents
 */
const AddressSchema: Schema = new Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  address1: {
    type: String,
    required: true
  },
  address2: String,
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  postalCode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true,
    default: 'US'
  },
  type: {
    type: String,
    enum: ['shipping', 'billing'],
    default: 'shipping'
  }
}, { _id: false });

/**
 * Cart totals schema for embedded documents
 */
const CartTotalsSchema: Schema = new Schema({
  subtotal: {
    type: Number,
    required: true,
    default: 0
  },
  shipping: {
    type: Number,
    required: true,
    default: 0
  },
  tax: {
    type: Number,
    required: true,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true,
    default: 0
  }
}, { _id: false });

/**
 * Cart schema definition
 */
const CartSchema = new Schema<ICartDocument, mongoose.Model<ICartDocument>, CartMethods>({
  userId: {
    type: String,
    index: true
  },
  sessionId: {
    type: String,
    index: true
  },
  items: [CartItemSchema],
  totals: {
    type: CartTotalsSchema,
    required: true,
    default: {
      subtotal: 0,
      shipping: 0,
      tax: 0,
      total: 0
    }
  },
  shippingAddress: AddressSchema,
  shippingMethodId: String,
  couponCode: String,
  notes: String,
  expiresAt: Date
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
 * Index to allow finding cart by either userId or sessionId
 */
CartSchema.index({ userId: 1, sessionId: 1 });

/**
 * Index to automatically expire anonymous carts
 */
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Pre-save hook to calculate subtotal and update totals
 */
CartSchema.pre('save', function(next) {
  // Calculate subtotal for each item
  this.items.forEach(item => {
    item.subtotal = item.price * item.quantity;
  });
  
  // Calculate totals
  this.calculateTotals();
  
  // If it's a guest cart, ensure it has an expiration date
  if (!this.userId && !this.expiresAt) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30); // Expire after 30 days
    this.expiresAt = expirationDate;
  }
  
  next();
});

/**
 * Method to add item to cart
 */
CartSchema.methods.addItem = async function(this: ICartDocument, item: Omit<ICartItem, 'subtotal'>): Promise<ICartDocument> {
  // Check if item already exists in cart
  const existingItemIndex = this.items.findIndex(
    cartItem => cartItem.productId === item.productId
  );
  
  if (existingItemIndex >= 0) {
    // Update quantity of existing item
    this.items[existingItemIndex].quantity += item.quantity;
  } else {
    // Add as new item with subtotal
    const newItem: ICartItem = {
      ...item,
      subtotal: item.price * item.quantity
    };
    this.items.push(newItem);
  }
  
  // Recalculate totals and save
  this.calculateTotals();
  return this.save();
};

/**
 * Method to remove item from cart
 */
CartSchema.methods.removeItem = async function(this: ICartDocument, productId: string): Promise<ICartDocument> {
  // Filter out the item to remove
  this.items = this.items.filter(item => item.productId !== productId);
  
  // Recalculate totals and save
  this.calculateTotals();
  return this.save();
};

/**
 * Method to update item quantity
 */
CartSchema.methods.updateItemQuantity = async function(this: ICartDocument, productId: string, quantity: number): Promise<ICartDocument> {
  // Find the item to update
  const itemIndex = this.items.findIndex(item => item.productId === productId);
  
  if (itemIndex >= 0) {
    if (quantity <= 0) {
      // If quantity is 0 or less, remove the item
      return this.removeItem(productId);
    }
    
    // Update quantity and recalculate subtotal
    this.items[itemIndex].quantity = quantity;
    this.items[itemIndex].subtotal = this.items[itemIndex].price * quantity;
  }
  
  // Recalculate totals and save
  this.calculateTotals();
  return this.save();
};

/**
 * Method to calculate cart totals
 */
CartSchema.methods.calculateTotals = function(this: ICartDocument): ICartTotals {
  // Calculate subtotal from items
  const subtotal = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  // Calculate tax (assume 8.5% tax rate)
  const taxRate = 0.085;
  const tax = Math.round((subtotal * taxRate) * 100) / 100;
  
  // Get shipping and discount
  const shipping = this.totals.shipping || 0;
  const discount = this.totals.discount || 0;
  
  // Calculate total
  const total = subtotal + shipping + tax - discount;
  
  // Update totals object
  this.totals = {
    subtotal,
    shipping,
    tax,
    discount,
    total
  };
  
  return this.totals;
};

/**
 * Method to clear cart
 */
CartSchema.methods.clearCart = async function(this: ICartDocument): Promise<ICartDocument> {
  // Remove all items
  this.items = [];
  
  // Reset totals
  this.totals = {
    subtotal: 0,
    shipping: 0,
    tax: 0,
    discount: 0,
    total: 0
  };
  
  // Clear shipping and coupon
  this.shippingMethodId = undefined;
  this.couponCode = undefined;
  
  return this.save();
};

/**
 * Method to check if cart is empty
 */
CartSchema.methods.isEmpty = function(this: ICartDocument): boolean {
  return this.items.length === 0;
};

/**
 * Virtual for item count
 */
CartSchema.virtual('itemCount').get(function(this: ICartDocument) {
  return this.items.reduce((count, item) => count + item.quantity, 0);
});

/**
 * Virtual for formatted totals
 */
CartSchema.virtual('formattedTotals').get(function(this: ICartDocument) {
  return {
    subtotal: formatCurrency(this.totals.subtotal),
    shipping: formatCurrency(this.totals.shipping),
    tax: formatCurrency(this.totals.tax),
    discount: this.totals.discount ? formatCurrency(this.totals.discount) : undefined,
    total: formatCurrency(this.totals.total)
  };
});

// Create and export the model
const Cart = mongoose.model<ICartDocument, mongoose.Model<ICartDocument, {}, CartMethods>>('Cart', CartSchema);

export default Cart; 