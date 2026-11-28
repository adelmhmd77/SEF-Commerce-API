const mongoose = require('mongoose');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const Cart = require('../models/cart.model');
const { createOrderSchema } = require('../validation/order.validation');
// const { sendOrderConfirmationEmail } = require('../services/email.service'); // TODO: enable when Task 6 is merged

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const FREE_SHIPPING_THRESHOLD = 1000;
const SHIPPING_FEE = 50;
const TAX_RATE = 0.14;

// استبدلها بالـ error class بتاعة Phase 1 لو موجودة
const httpError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

exports.createOrder = async (req, res, next) => {
  let session;
  try {
    const { error, value } = createOrderSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      throw httpError(400, error.details.map((d) => d.message).join(', '));
    }

    const { shippingAddress, paymentMethod, customerNote } = value;
    const user = req.user;

    session = await mongoose.startSession();
    let order;

    await session.withTransaction(async () => {
      order = null; // لو الـ callback اتعاد بسبب transient error

      const cart = await Cart.findOne({ user: user._id }).session(session);
      if (!cart || cart.items.length === 0) {
        throw httpError(400, 'Cart is empty');
      }

      // كل منتج لازم يكون لسه موجود و active
      const ids = cart.items.map((i) => i.product);
      const products = await Product.find({ _id: { $in: ids } }).session(session);
      const byId = new Map(products.map((p) => [p._id.toString(), p]));

      for (const item of cart.items) {
        const p = byId.get(item.product.toString());
        if (!p || !p.isActive) {
          throw httpError(400, `Product "${item.name}" is no longer available`);
        }
      }

      // Snapshot من الكارت (الـ stock اتحجز في Task 3A، مفيش خصم هنا)
      const items = cart.items.map((i) => ({
        product: i.product,
        name: i.name,
        image: i.image,
        price: i.price,
        quantity: i.quantity,
      }));

      const subtotal = round2(items.reduce((s, i) => s + i.price * i.quantity, 0));
      const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
      const tax = round2(subtotal * TAX_RATE);
      const discount = round2(cart.discountAmount || 0);
      const totalPrice = round2(Math.max(0, subtotal + shippingFee + tax - discount));

      const [created] = await Order.create(
        [
          {
            user: user._id,
            items,
            shippingAddress,
            paymentMethod,
            customerNote,
            subtotal,
            shippingFee,
            tax,
            discount,
            totalPrice,
            status: 'pending',
            paymentStatus: 'pending',
          },
        ],
        { session }
      );
      order = created;

      // تفريغ الكارت والكوبون بدون إرجاع الـ stock
      cart.items = [];
      cart.coupon = null;
      cart.discountAmount = 0;
      await cart.save({ session });
    });

    // بعد الـ commit: فشل الإيميل ميفشلش الأوردر
    try {
      // TODO: enable when Task 6 is merged
      // await sendOrderConfirmationEmail(order, user);
    } catch (emailErr) {
      console.error('Order confirmation email failed:', emailErr.message);
    }

    return res.status(201).json({ success: true, data: order });
  } catch (err) {
    return next(err);
  } finally {
    if (session) await session.endSession();
  }
};