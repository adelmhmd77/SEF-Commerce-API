const bcrypt = require('bcryptjs');

const User = require('../models/User.model');
const OTP = require('../models/OTP.model');
const generateToken = require('../utils/generateToken');
const { generateOTP } = require('../utils/generateOTP');
const { sendEmail } = require('../utils/sendEmail');

const login = async (req, res, next) => {
  try {
    const email = req.body.email.trim().toLowerCase();
    const { password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email first',
      });
    }

    const token = generateToken(user._id, user.role);
    const userData = user.toObject();
    delete userData.password;
    delete userData.resetPasswordToken;
    delete userData.resetPasswordExpire;

    return res.status(200).json({ token, user: userData });
  } catch (error) {
    return next(error);
  }
};

const sendRegisterOTP = async (req, res, next) => {
  try {
    const { username, password, phone } = req.body;
    const email = req.body.email.trim().toLowerCase();
    const user = await User.findOne({ email });

    if (user) {
      return res.status(409).json({
        message: 'Email is already registered',
      });
    }

    await OTP.deleteMany({ email });

    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpDocument = await OTP.create({
      email,
      otp: hashedOtp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      userData: { username, email, password, phone },
    });

    try {
      await sendEmail({
        to: email,
        subject: 'Email Verification',
        html: `
          <h2>Email Verification</h2>
          <p>Your verification code is:</p>
          <h1>${otp}</h1>
          <p>This code expires in 10 minutes.</p>
        `,
      });
    } catch (error) {
      await OTP.deleteOne({ _id: otpDocument._id });
      throw error;
    }

    return res.status(200).json({ message: 'OTP sent to your email' });
  } catch (error) {
    return next(error);
  }
};

const verifyRegisterOTP = async (req, res, next) => {
  try {
    const email = req.body.email.trim().toLowerCase();
    const { otp } = req.body;
    const otpRegister = await OTP.findOne({ email });

    if (
      !otpRegister ||
      !otpRegister.userData ||
      otpRegister.expiresAt <= new Date() ||
      !(await bcrypt.compare(otp, otpRegister.otp))
    ) {
      if (otpRegister && otpRegister.expiresAt <= new Date()) {
        await OTP.deleteOne({ _id: otpRegister._id });
      }

      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const user = await User.create({
      ...otpRegister.userData,
      isVerified: true,
    });
    await OTP.deleteOne({ _id: otpRegister._id });

    const userData = user.toObject();
    delete userData.password;

    return res.status(201).json({
      message: 'Account created successfully',
      user: userData,
    });
  } catch (error) {
    return next(error);
  }
};

const forgotPasswordSendOtp = async (req, res, next) => {
  const message = 'If this email is registered, an OTP has been sent';

  try {
    const email = req.body.email.trim().toLowerCase();
    const user = await User.findOne({ email, isVerified: true });

    if (!user) {
      return res.status(200).json({ message });
    }

    await OTP.deleteMany({ email });

    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpDocument = await OTP.create({
      email,
      otp: hashedOtp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    try {
      await sendEmail({
        to: email,
        subject: 'Password Reset OTP',
        text: `Your password reset OTP is: ${otp}`,
      });
    } catch (error) {
      await OTP.deleteOne({ _id: otpDocument._id });
      throw error;
    }

    return res.status(200).json({ message });
  } catch (error) {
    return next(error);
  }
};

const forgotPasswordVerifyOtp = async (req, res, next) => {
  try {
    const email = req.body.email.trim().toLowerCase();
    const { otp, newPassword } = req.body;
    const otpReset = await OTP.findOne({ email });

    if (
      !otpReset ||
      otpReset.expiresAt <= new Date() ||
      !(await bcrypt.compare(otp, otpReset.otp))
    ) {
      if (otpReset && otpReset.expiresAt <= new Date()) {
        await OTP.deleteOne({ _id: otpReset._id });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    const user = await User.findOne({ email, isVerified: true }).select('+password');
    if (!user) {
      await OTP.deleteOne({ _id: otpReset._id });
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    user.password = newPassword;
    await user.save();
    await OTP.deleteOne({ _id: otpReset._id });

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    return next(error);
  }
};

const changeRole = async (req, res, next) => {
  try {
    if (req.user.role === 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Owner account cannot be modified',
      });
    }

    const requestedRole = String(req.body?.role || req.query?.role || '').trim().toLowerCase();
    const role = requestedRole || (req.user.role === 'admin' ? 'customer' : 'admin');

    if (!['customer', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
      });
    }

    req.user.role = role;
    await req.user.save();

    return res.status(200).json({
      success: true,
      message: 'Role changed successfully',
      user: {
        _id: req.user._id,
        role: req.user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const adminTest = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Admin access granted',
  });
};

const logout = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    return next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const userData = req.user.toObject();
    delete userData.password;
    delete userData.resetPasswordToken;
    delete userData.resetPasswordExpire;

    return res.status(200).json({
      success: true,
      user: userData,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  login,
  sendRegisterOTP,
  verifyRegisterOTP,
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  changeRole,
  adminTest,
  getMe,
  logout,
};
