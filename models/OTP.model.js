const mongoose = require("mongoose")

const otpSchema = new mongoose.Schema({
  email:{
    type:String,
    required:true,
    lowercase:true
  },
  otp:{
    type:String,
    required:true
  },
  expiresAt:{
    type:Date,
    required:true
  },
  userData:{
    type:Object,
  }
},{timestamps:true})

otpSchema.index({expiresAt:1},{expireAfterSeconds:0})

 const Otp = mongoose.model("OTP",otpSchema)

 module.exports = Otp