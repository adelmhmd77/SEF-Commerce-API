const User = require("../models/User.model.js");
module.exports = async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id).select("role");
    if (target && target.role === "owner") {
      return res.status(403).json({
        success: false,
        message: "Owner account cannot be modified through the API",
      });
    }
    next();
  } catch (err) {
    next(err);
  }
};