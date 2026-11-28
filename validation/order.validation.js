const Joi = require('joi');

const requiredString = (max) => Joi.string().trim().max(max).required();

const createOrderSchema = Joi.object({
  shippingAddress: Joi.object({
    fullName: requiredString(100),
    phone: Joi.string()
      .trim()
      .pattern(/^\+?[0-9\s\-()]{7,20}$/)
      .required()
      .messages({ 'string.pattern.base': 'phone must be a valid phone number' }),
    country: requiredString(100),
    city: requiredString(100),
    address: requiredString(300),
    postalCode: Joi.string()
      .trim()
      .pattern(/^[A-Za-z0-9\s\-]{3,10}$/)
      .required()
      .messages({ 'string.pattern.base': 'postalCode is invalid' }),
  }).required(),
  paymentMethod: Joi.string().valid('cash', 'stripe').default('cash'),
  customerNote: Joi.string().trim().max(500).allow('').optional(),
});

module.exports = { createOrderSchema };