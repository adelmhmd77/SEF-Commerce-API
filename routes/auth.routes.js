const express = require("express")
const {sendRegisterOTP,verifyRegisterOTP} = require("../controllers/auth.controller")
const validate = require("../middleware/validate")
const {registerSchema,verifyOtpSchema}=require("../validations/auth.validation")
const router = express.Router()

router.post("/register/send-otp",validate(registerSchema),sendRegisterOTP)
router.post("/register/verify-otp",validate(verifyOtpSchema),verifyRegisterOTP)

module.exports = router