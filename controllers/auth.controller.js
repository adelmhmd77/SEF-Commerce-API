
const bcrypt = require("bcryptjs");
const generateOTP = require("../utils/generateOTP");
const User = require("../models/User.model");
const OTP = require("../models/OTP.model");
const sendEmail = require("../utils/sendEmail");

const sendRegisterOTP = async (req, res) => {
  const { username, password, phone } = req.body;
  const email = req.body.email.trim().toLowerCase();

  const user = await User.findOne({ email });

  if (user) {
    return res.status(409).json({
      message: "Email is already registered",
    });
  }

  await OTP.deleteMany({ email });

  const otp = generateOTP();
  const hashOtp = await bcrypt.hash(otp, 10);

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const otpDocument = await OTP.create({
    email,
    otp: hashOtp,
    expiresAt,
    userData: {
      username,
      email,
      password,
      phone,
    },
  });

  try {
    await sendEmail({
      to: email,
      subject: "Email Verification",
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

  return res.status(200).json({
    message: "OTP sent to your email",
  });
};

const verifyRegisterOTP = async (req, res) => {
  const { email,otp } = req.body;
  const otpRegister = await OTP.findOne({ email });

  if (!otpRegister) {
    return res.status(400).json({
      message: "Invalid or expired OTP",
    });
  }

  if (otpRegister.expiresAt <= new Date()) {
    await OTP.deleteOne({ _id: otpRegister._id });

    return res.status(400).json({
      message: "Invalid or expired OTP",
    });
  }

  const matchedOtp = await bcrypt.compare(otp, otpRegister.otp);

  if (!matchedOtp) {
    return res.status(400).json({
      message: "Invalid or expired OTP",
    });
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(409).json({
      message: "Email is already registered",
    });
  }

  const user = await User.create({
    ...otpRegister.userData,
    isVerified: true,
  });

  await OTP.deleteOne({ _id: otpRegister._id });

  const userData = user.toObject();


  return res.status(201).json({
    message: "Account created successfully",
    user: userData,
  });
};

exports.sendRegisterOTP = sendRegisterOTP;
exports.verifyRegisterOTP = verifyRegisterOTP;
