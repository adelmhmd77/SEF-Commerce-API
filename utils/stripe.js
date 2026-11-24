const Stripe = require('stripe');

let stripeClient;

const getStripe = () => {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is missing in environment variables');
    }

    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  return stripeClient;
};

module.exports = { getStripe };