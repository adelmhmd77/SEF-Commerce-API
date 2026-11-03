const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const {
  registerSchema,
  verifyOtpSchema,
} = require('../validations/auth.validation');
const { loginSchema, forgotPasswordSendOtpSchema } = require('../validation/auth.validation');
const {
  login,
  sendRegisterOTP,
  verifyRegisterOTP,
  forgotPasswordSendOtp,
} = require('../controllers/auth.controller');

router.post('/login', validate(loginSchema), login);
router.post('/register/send-otp', validate(registerSchema), sendRegisterOTP);
router.post('/register/verify-otp', validate(verifyOtpSchema), verifyRegisterOTP);
router.post(
  '/forgot-password/send-otp',
  validate(forgotPasswordSendOtpSchema),
  forgotPasswordSendOtp
);

module.exports = router;
