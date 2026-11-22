const express = require('express');
const router = express.Router();

const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth.middleware');

const {
  registerSchema,
  verifyOtpSchema,
  loginSchema,
  forgotPasswordSendOtpSchema,
  forgotPasswordVerifyOtpSchema,
} = require('../validation/auth.validation');

const {
  login,
  sendRegisterOTP,
  verifyRegisterOTP,
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  logout,
  getMe,
} = require('../controllers/auth.controller');

router.post('/login', validate(loginSchema), login);

router.post('/register/send-otp', validate(registerSchema), sendRegisterOTP);

router.post('/verify-otp', validate(verifyOtpSchema), verifyRegisterOTP);

router.post(
  '/forgot-password/send-otp',
  validate(forgotPasswordSendOtpSchema),
  forgotPasswordSendOtp
);

// Task 4B: Verify OTP and reset password
router.post(
  '/forgot-password/verify-otp',
  validate(forgotPasswordVerifyOtpSchema),
  forgotPasswordVerifyOtp
);

router.get('/me', protect, getMe);

router.post('/logout', protect, logout);

module.exports = router;