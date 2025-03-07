import mongoose, { Schema } from 'mongoose';
import { IOrderDocument, OrderStatus, PaymentStatus, IOrderItem, IOrderTotals } from './interfaces';
import { formatCurrency } from '../utils/formatCurrency';
import { getEstimatedDeliveryDate } from '../utils/dateUtils';

// TypeScript interface for order methods and 'this' context
interface OrderMethods {
  calculateTotals(): IOrderTotals;
  getFormattedOrderNumber(): string;
}

/**
 * Address schema for embedded documents
 */
const AddressSchema: Schema = new Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  address1: {
    type: String,
    required: true,
    trim: true
  },
  address2: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  postalCode: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    default: 'US',
    trim: true
  },
  type: {
    type: String,
    enum: ['shipping', 'billing'],
    default: 'shipping'
  }
}, { _id: false });

/**
 * Order item schema for embedded documents
 */
const OrderItemSchema: Schema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Product'
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
  subtotal: {
    type: Number,
    required: true
  }
}, { _id: true });

/**
 * Shipping method schema for embedded documents
 */
const ShippingMethodSchema: Schema = new Schema({
  id: {
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
  estimatedDays: {
    type: Number,
    required: true
  },
  description: String
}, { _id: false });

/**
 * Order totals schema for embedded documents
 */
const OrderTotalsSchema: Schema = new Schema({
  subtotal: {
    type: Number,
    required: true
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
    required: true
  }
}, { _id: false });

/**
 * Payment details schema for embedded documents
 */
const PaymentDetailsSchema: Schema = new Schema({
  method: {
    type: String,
    enum: ['credit_card', 'paypal', 'other'],
    required: true
  },
  transactionId: String,
  cardBrand: String,
  cardLast4: String,
  paymentIntentId: String
}, { _id: false });

/**
 * Order schema definition
 */
const OrderSchema = new Schema<IOrderDocument, mongoose.Model<IOrderDocument>, OrderMethods>({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  items: [OrderItemSchema],
  shippingAddress: {
    type: AddressSchema,
    required: true
  },
  billingAddress: AddressSchema,
  shippingMethod: {
    type: ShippingMethodSchema,
    required: true
  },
  paymentDetails: PaymentDetailsSchema,
  orderStatus: {
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
    required: true
  },
  totals: {
    type: OrderTotalsSchema,
    required: true
  },
  notes: String,
  estimatedDeliveryDate: Date,
  shippedAt: Date,
  deliveredAt: Date
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
 * Pre-save hook to set estimated delivery date
 */
OrderSchema.pre('save', function(next) {
  // Set estimated delivery date if it doesn't exist yet and we have shipping method
  if (!this.estimatedDeliveryDate && this.shippingMethod && this.shippingMethod.estimatedDays) {
    const estimatedDays = this.shippingMethod.estimatedDays;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + estimatedDays);
    this.estimatedDeliveryDate = deliveryDate;
  }
  next();
});

/**
 * Method to calculate order totals
 */
OrderSchema.methods.calculateTotals = function(this: IOrderDocument): IOrderTotals {
  // Calculate subtotal from items
  const subtotal = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  // Get shipping cost from shipping method
  const shipping = this.shippingMethod ? this.shippingMethod.price : 0;
  
  // Calculate tax (assume 8.5% tax rate)
  const taxRate = 0.085;
  const tax = Math.round((subtotal * taxRate) * 100) / 100;
  
  // Get discount or default to 0
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
 * Method to get formatted order number
 */
OrderSchema.methods.getFormattedOrderNumber = function(this: IOrderDocument): string {
  return `#${this.orderNumber}`;
};

// Virtuals for formatted totals
OrderSchema.virtual('formattedTotals').get(function(this: IOrderDocument) {
  return {
    subtotal: formatCurrency(this.totals.subtotal),
    shipping: formatCurrency(this.totals.shipping),
    tax: formatCurrency(this.totals.tax),
    discount: this.totals.discount ? formatCurrency(this.totals.discount) : undefined,
    total: formatCurrency(this.totals.total)
  };
});

// Virtuals for formatted dates
OrderSchema.virtual('formattedDates').get(function(this: IOrderDocument) {
  return {
    created: this.createdAt.toLocaleDateString(),
    estimated: this.estimatedDeliveryDate ? this.estimatedDeliveryDate.toLocaleDateString() : undefined,
    shipped: this.shippedAt ? this.shippedAt.toLocaleDateString() : undefined,
    delivered: this.deliveredAt ? this.deliveredAt.toLocaleDateString() : undefined
  };
});

// Create and export the model
const Order = mongoose.model<IOrderDocument, mongoose.Model<IOrderDocument, {}, OrderMethods>>('Order', OrderSchema);

export default Order; 