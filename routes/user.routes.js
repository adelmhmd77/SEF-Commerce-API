const express = require("express");
const router = express.Router();

const protectOwnerAccount = require("../middleware/protectOwnerAccount");

// protect و restrictTo هيبقوا من ملف الـ auth بتاعكم
// const { protect, restrictTo } = require("../middleware/auth");
const { protect } = require("../middleware/auth");

const {validate} = require("../middleware/validate")
const { updateProfile, deleteUser, updateUserRole } = require("../controllers/user.controller");
const {updateProfileSchema} = require("../validation/user.validation")

// تعديل البروفايل
router.patch("/profile", protect, validate(updateProfileSchema), updateProfile)
// تعديل يوزر
router.patch("/:id/role", protectOwnerAccount, updateUserRole);
// مسح يوزر
router.delete("/:id", protectOwnerAccount, deleteUser);


module.exports = router;