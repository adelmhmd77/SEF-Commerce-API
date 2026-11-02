const express = require('express');
const router = express.Router();

const {
  forgotPasswordSendOtp,
} = require('../controllers/auth.controller');

router.post(
  '/forgot-password/send-otp',
  forgotPasswordSendOtp
);

module.exports = router;