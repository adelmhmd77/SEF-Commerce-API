const express = require("express");
const router = express.Router();

const protectOwnerAccount = require("../middleware/protectOwnerAccount");
const { protect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate");
const { updateProfile, deleteUser, updateUserRole, changePassword } = require("../controllers/user.controller");
const { updateProfileSchema, changePasswordSchema } = require("../validation/user.validation");

// تعديل البروفايل
router.patch("/profile", protect, validate(updateProfileSchema), updateProfile);
router.patch("/change-password", protect, validate(changePasswordSchema), changePassword);
// تعديل يوزر
router.patch("/:id/role", protectOwnerAccount, updateUserRole);
// مسح يوزر
router.delete("/:id", protectOwnerAccount, deleteUser);


module.exports = router;