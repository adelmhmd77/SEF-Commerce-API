const mongoose = require('mongoose');

const { Schema } = mongoose;

// The allowed order statuses used by the admin status-update endpoint.
const ORDER_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
];

// The allowed payment methods and payment statuses.
const PAYMENT_METHODS = ['cash', 'card'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

const orderItemSchema = new Schema(
  {
    // Keep the product reference so Phase 4 can restore stock after cancellation.
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Order item product is required'],
    },

    // Snapshot fields: later Product changes must not alter an existing order.
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

    // The quantity must be an integer and cannot be less than 1.
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

  // Order items do not need their own MongoDB _id.
  { _id: false }
);

const shippingAddressSchema = new Schema(
  {
    // Required shipping address information saved with the order snapshot.
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

    // Optional address details.
    governorate: {
      type: String,
      trim: true,
    },

    postalCode: {
      type: String,
      trim: true,
    },
  },

  // The shipping address is embedded inside the order and does not need its own _id.
  { _id: false }
);

const orderSchema = new Schema(
  {
    // The user who placed the order; indexed for fast user-order lookups.
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Order user is required'],
      index: true,
    },

    // An order must contain at least one purchased item.
    items: {
      type: [orderItemSchema],
      required: [true, 'Order items are required'],
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'Order must contain at least one item',
      },
    },

    // Required shipping details are captured as a snapshot on the order.
    shippingAddress: {
      type: shippingAddressSchema,
      required: [true, 'Shipping address is required'],
    },

    // These amounts are stored by the controller; their calculation belongs to Phase 4.
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

    // Optional cash-on-delivery fee;
    codFee: {
      type: Number,
      default: 0,
      min: [0, 'COD fee cannot be negative'],
    },

    // The order status is used by the admin endpoint and status emails.
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'pending',
      index: true,
    },

    // Cash is the default payment method.
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: 'cash',
    },

    // Payment remains pending until the payment process updates it.
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'pending',
    },

    // Used to identify the payment transaction, especially for online payments.
    transactionId: {
      type: String,
      trim: true,
      index: true,
    },
  },

  // Automatically adds createdAt and updatedAt fields.
  { timestamps: true }
);

// Pricing is calculated by the order controller in Phase 4, not by this model:
// - shippingFee = 0 when subtotal >= 1000 EGP; otherwise shippingFee = 50 EGP.
// - tax = 14% of subtotal.
// - codFee = COD fee when paymentMethod is cash; otherwise 0.
// - totalPrice = subtotal + shippingFee + tax + codFee - discount.

// Required indexes: user, status, createdAt, and transactionId.
orderSchema.index({ createdAt: 1 });

// The model name must be exactly "Order".
module.exports = mongoose.model('Order', orderSchema);
