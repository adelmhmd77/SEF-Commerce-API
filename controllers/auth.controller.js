
const bcrypt = require('bcryptjs');

const User = require('../models/user.model');
const OTP = require('../models/otp.model');

const { generateOTP } = require('../utils/generateOTP');
const { sendEmail } = require('../utils/sendEmail');

const forgotPasswordSendOtp = async (req, res, next) => {
  const message =
    'If this email is registered, an OTP has been sent';

  try {
    const email = req.body.email.trim().toLowerCase();

    // Find only verified users
    const user = await User.findOne({
      email,
      isVerified: true,
    });

    // Same response for unknown and unverified accounts
    if (!user) {
      return res.status(200).json({ message });
    }

    // Remove previous OTP
    await OTP.deleteMany({ email });

    // Generate OTP
    const otp = generateOTP();

    // Hash OTP
    const hashedOTP = await bcrypt.hash(otp, 10);

    // OTP expires after 10 minutes
    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    // Save OTP without userData
    const otpDocument = await OTP.create({
      email,
      otp: hashedOTP,
      expiresAt,
    });

    try {
      await sendEmail({
        to: email,
        subject: 'Password Reset OTP',
        text: `Your password reset OTP is: ${otp}`,
      });
    } catch (emailError) {
      await OTP.deleteOne({
        _id: otpDocument._id,
      });

      throw emailError;
    }

    return res.status(200).json({ message });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  forgotPasswordSendOtp,
};
