const { isOwnerValue } = require("../utils/roles");

function containsOwnerRole(obj) {
  if (obj === null || typeof obj !== "object") return false;
  for (const [key, value] of Object.entries(obj)) {
    if (key.toLowerCase() === "role") {
      if (isOwnerValue(value)) return true;
      if (value !== null && typeof value === "object") return true; // حقن زي { $ne: ... }
    }
    if (typeof value === "object" && containsOwnerRole(value)) return true;
  }
  return false;
}

module.exports = (req, res, next) => {
  if (
    containsOwnerRole(req.body) ||
    containsOwnerRole(req.query) ||
    containsOwnerRole(req.params)
  ) {
    return res.status(403).json({
      success: false,
      message: "Assigning the Owner role is not allowed through the API",
    });
  }
  next();
};