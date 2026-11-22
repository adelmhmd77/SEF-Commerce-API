const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post(
    '/forgot-password/verify-otp',
    authController.VerifyOtpAndResetPassword
);

module.exports = router;