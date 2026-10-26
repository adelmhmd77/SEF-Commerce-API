const mongoose = require('mongoose');

const { Schema } = mongoose;

const ORDER_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned', 
];

const PAYMENT_METHODS = ['cash', 'card'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

const orderItemSchema = new Schema(
  {
     product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Order item product is required'],
    },
    name: {
      type: String,
      required: [true, 'Order item name is required'],
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Order item image is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Order item price is required'],
      min: [0, 'Order item price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Order item quantity is required'],
      min: [1, 'Order item quantity must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Order item quantity must be an integer',
      },
    },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Shipping address fullName is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Shipping address phone is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Shipping address address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'Shipping address city is required'],
      trim: true,
    },
    governorate: {
      type: String,
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Order user is required'],
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: [true, 'Order items are required'],
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: [true, 'Shipping address is required'],
    },
    subtotal: {
      type: Number,
      default: 0,
      min: [0, 'Subtotal cannot be negative'],
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: [0, 'Shipping fee cannot be negative'],
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, 'Tax cannot be negative'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
    },
    totalPrice: {
      type: Number,
      default: 0,
      min: [0, 'Total price cannot be negative'],
    },
    codFee: {
      type: Number,
      default: 0,
      min: [0, 'COD Fee cannot be negative'],
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: 'cash',
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'pending',
    },
    transactionId: {
      type: String,
      trim: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Pricing is calculated by the order controller in Phase 4, not by this model:
// - shippingFee = 0 when subtotal >= 1000 EGP; otherwise shippingFee = 50 EGP.
// - tax = 14% of subtotal.
// - codFee = COD fee when paymentMethod is cash; otherwise 0.
// - totalPrice = subtotal + shippingFee + tax + codFee - discount.

orderSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Order', orderSchema);