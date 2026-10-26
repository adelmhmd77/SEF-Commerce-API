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

 const Otp = mongoose.model("Otp",otpSchema)

 module.exports = Otp