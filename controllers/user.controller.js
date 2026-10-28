const User = require("../models/User.model.js");
const { API_ASSIGNABLE_ROLES } = require("../utils/roles");

// تعديل يوزر (whitelist: مفيش role ولا isVerified)
exports.updateUser = async (req, res, next) => {
  try {
    const { username, phone, avatar, addresses } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { username, phone, avatar, addresses },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// مسح يوزر
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    next(err);
  }
};

// تغيير الدور (للـ Admin): customer أو admin بس
exports.updateUserRole = async (req, res, next) => {
  try {
    const role = String(req.body.role || "").toLowerCase();
    if (!API_ASSIGNABLE_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: "User not found" });
    if (target.role === "owner") {
      return res.status(403).json({ success: false, message: "Owner account cannot be modified" });
    }
    target.role = role;
    await target.save();
    res.json({ success: true, data: { id: target._id, role: target.role } });
  } catch (err) {
    next(err);
  }
};