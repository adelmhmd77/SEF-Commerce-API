const express = require("express");
const router = express.Router();

const protectOwnerAccount = require("../middleware/protectOwnerAccount");
// protect و restrictTo هيبقوا من ملف الـ auth بتاعكم
// const { protect, restrictTo } = require("../middleware/auth");

const { updateUser, deleteUser, updateUserRole } = require("../controllers/user.controller");

// تعديل يوزر
router.patch("/:id/role", protectOwnerAccount, updateUserRole);
// مسح يوزر
router.delete("/:id", protectOwnerAccount, deleteUser);

module.exports = router;