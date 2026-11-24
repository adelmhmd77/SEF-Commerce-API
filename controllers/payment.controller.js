const mongoose = require('mongoose');
const Order = require('../models/Order.model');
const { getStripe } = require('../utils/stripe');
const {
  sendOrderConfirmationEmail,
} = require('../utils/sendEmail');

// Create or reuse a Stripe PaymentIntent for an order.
const createPaymentIntent = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    // Return 404 when the order ID is missing or invalid.
    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Find the order only if it belongs to the authenticated user.
    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // This endpoint is only for Stripe orders.
    if (order.paymentMethod !== 'stripe') {
      return res.status(400).json({
        success: false,
        message: 'Order payment method is not Stripe',
      });
    }

    // Do not create another intent for an already paid or failed order.
    if (order.paymentStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Order payment is not pending',
      });
    }

    const stripe = getStripe();
    let intent;

    // Reuse the existing PaymentIntent when one was already created.
    if (order.transactionId) {
      intent = await stripe.paymentIntents.retrieve(order.transactionId);
    } else {
      intent = await stripe.paymentIntents.create({
        amount: Math.round(Number(order.totalPrice) * 100),
        currency: 'egp',
        metadata: {
          orderId: order._id.toString(),
        },
      });

      // Save the Stripe PaymentIntent ID on the order.
      order.transactionId = intent.id;
      await order.save();
    }

    return res.status(200).json({
      success: true,
      clientSecret: intent.client_secret,
      orderId: order._id,
    });
  } catch (error) {
    return next(error);
  }
};

// Handle Stripe webhook events.
const handleWebhook = async (req, res) => {
  let event;

  try {
    const stripe = getStripe();
    const signature = req.headers['stripe-signature'];

    // req.body must be the raw request body for signature verification.
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: `Webhook Error: ${error.message}`,
    });
  }

  try {
    // Payment succeeded.
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;

      const order = await Order.findOne({
        transactionId: intent.id,
      }).populate('user');

      // This condition makes repeated webhook events harmless.
      if (order && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        order.paidAt = new Date();

        // Only pending orders become confirmed after successful payment.
        if (order.status === 'pending') {
          order.status = 'confirmed';
        }

        await order.save();

        // Email errors are handled inside the helper and do not break payment.
        await sendOrderConfirmationEmail(order, order.user);
      }
    }

    // Payment failed.
    if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object;

      // Do not change a payment back from paid to failed.
      await Order.updateOne(
        {
          transactionId: intent.id,
          paymentStatus: { $ne: 'paid' },
        },
        {
          $set: {
            paymentStatus: 'failed',
          },
        }
      );
    }

    // Stripe expects HTTP 200 for processed or ignored events.
    return res.status(200).json({
      received: true,
    });
  } catch (error) {
    console.error(
      'Stripe webhook processing failed:',
      error.message
    );

    // Return 200 so Stripe does not repeatedly retry an already received event.
    return res.status(200).json({
      received: true,
    });
  }
};

module.exports = {
  createPaymentIntent,
  handleWebhook,
};