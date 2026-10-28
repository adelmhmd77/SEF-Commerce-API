const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const addressSchema = new mongoose.Schema(
  {
    country: {
      type: String,
    },
    city: {
      type: String,
    },
    street: {
      type: String,
    },
    postalCode: {
      type: String,
    },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 2
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
      required: true,
      minlength: 6,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["customer", "admin", "owner"],
      default: "customer",
    },
    addresses: {
      type: [addressSchema],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
    },
  },
  { timestamps: true },
);

//==============
//Hash -->register/update(findById,save())
//==============
userSchema.pre("save", async function () {
  if (!this.isModified("password")) { //field name
    return;
  }
  this.password = await bcrypt.hash(this.password, 10);
});

//============
//compare-->login
//============
userSchema.methods.comparePassword = async function (loginpassword) {
  return await bcrypt.compare(loginpassword, this.password);
};

const User = mongoose.model("User", userSchema);


module.exports = User
