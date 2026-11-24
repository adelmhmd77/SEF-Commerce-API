const express = require('express');

const { protect } = require('../middleware/auth.middleware');
const {
  createPaymentIntent,
  handleWebhook,
} = require('../controllers/payment.controller');

const router = express.Router();

// Protected route: the user must be logged in to create a payment intent.
router.post('/create-intent', protect, createPaymentIntent);

// Public Stripe webhook route.
// Stripe authenticates this route using the webhook signature.
router.post('/webhook', handleWebhook);

module.exports = router;