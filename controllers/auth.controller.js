const User = require('../models/User.model.js');
const Otp = require('../models/OTP.model.js');
const bcrypt = require('bcryptjs');

exports.forgotPasswordVerifyOtp = async (req, res) =>{
    try{
        const {email , otp , newPassword} = req.body;
        const otpDoc = await Otp.findOne({ email });        
      if(!otpDoc)
        {
           return res.status(400).json({ message: "Invalid or expired OTP"});
        }

     const expiresAt = otpDoc.expiresAt
      ? new Date(otpDoc.expiresAt).getTime()
      : NaN;

     if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      return res.status(400).json({
        message: "Invalid or expired OTP"
      });
    }

      
        const isMatch = await bcrypt.compare( String(otp), otpDoc.otp);
        if(!isMatch)
        { 
            return res.status(400).json({ message: "Invalid or expired OTP"});
        } 
        
        const user = await User.findOne({email});
        if(!user)
        {
           return res.status(400).json({ message: "User not found"}); 
        }
        user.password = newPassword;
        await user.save();
        
        await Otp.deleteOne({_id: otpDoc._id });
        return res.status(200).json({message : "Password reset successfully"});
    
    }catch (error) {
    return next(error);
   }
}