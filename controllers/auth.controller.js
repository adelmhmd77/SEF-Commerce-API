const User = require('../models/User.model');
const generateToken = require('../utils/generateToken');

// @desc    Login user & get token
// @route   POST /auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. التأكد من إدخال الإيميل والباسورد
    if (!email || !password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 2. البحث بالإيميل (lowercase) وجلب الباسورد المشفر
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    // لو الإيميل مش موجود
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 3. مطابقة الباسورد
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 4. التحقق من تفعيل الحساب
    if (user.isVerified === false) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email first',
      });
    }

    // 5. توليد التوكن
    const token = generateToken(user._id, user.role);

    // 6. تجهيز بيانات المستخدم واستبعاد الحقول الحساسة
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.resetPasswordToken;
    delete userObj.resetPasswordExpire;

    // 7. الرد الناجح
    return res.status(200).json({
      success: true,
      token,
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
};
