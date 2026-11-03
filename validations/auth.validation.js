
const Joi = require("joi");

const registerSchema = {
  body: Joi.object({
    username: Joi.string().trim().min(3).required(),
    email: Joi.string().trim().email().lowercase().required(),
    password: Joi.string().min(8).required(),
    phone: Joi.string().optional(),
  }),
};

const verifyOtpSchema = {
  body: Joi.object({
    email: Joi.string().trim().email().lowercase().required(),
    otp: Joi.string().length(6).pattern(/^[0-9]+$/).required(),
  }),
};

module.exports = {
  registerSchema,
  verifyOtpSchema,
};
