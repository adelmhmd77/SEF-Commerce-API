require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User.model.js");

(async () => {
  const [email, action = "set"] = process.argv.slice(2);

  if (!email) {
    console.error("Usage: node scripts/setOwner.js <email> [set|remove]");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const newRole = action === "remove" ? "customer" : "owner";
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { role: newRole },
    { new: true }
  );

  console.log(user ? `${user.email} is now: ${user.role}` : "User not found");
  await mongoose.disconnect();
})();