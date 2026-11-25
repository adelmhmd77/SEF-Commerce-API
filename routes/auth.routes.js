const express = require('express');
const router = express.Router();

const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/role.middleware');
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
  changeRole,
  adminTest,
  logout,
  getMe,
} = require('../controllers/auth.controller');

router.post('/login', validate(loginSchema), login);

router.post('/register/send-otp', validate(registerSchema), sendRegisterOTP);

router.post('/verify-otp', validate(verifyOtpSchema), verifyRegisterOTP);
router.post('/register/verify-otp', validate(verifyOtpSchema), verifyRegisterOTP);
router.post(
  '/forgot-password/send-otp',
  validate(forgotPasswordSendOtpSchema),
  forgotPasswordSendOtp
);
router.post(
  '/forgot-password/verify-otp',
  validate(forgotPasswordVerifyOtpSchema),
  forgotPasswordVerifyOtp
);

// Task 4B: Verify OTP and reset password
router.post(
  '/forgot-password/verify-otp',
  validate(forgotPasswordVerifyOtpSchema),
  forgotPasswordVerifyOtp
);

router.get('/me', protect, getMe);
router.post('/me', protect, getMe);
router.post('/logout', protect, logout);
router.get('/admin-test', protect, adminOnly, adminTest);
router.get('/change-role', protect, changeRole);
router.post('/change-role', protect, changeRole);

module.exports = router;