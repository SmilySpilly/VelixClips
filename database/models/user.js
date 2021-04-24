const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, required: false, default: "acc.png" },
  banner: { type: String, required: false, default: "" },
  paypal: { type: String, default: "" },
  admin: { type: Boolean, required: true, default: false },
  likedVideos: { type: Array, required: false, default: [] },
  dislikedVideos: { type: Array, required: false, default: [] },
  history: { type: Array, required: false, default: [] },
  strikes: { type: Number, required: false, default: 0 },
  subscribers: { type: Number, require: false, default: 0 },
  subscribed: { type: Array, required: false, default: [] },
  views: { type: Number, require: false, default: 0 },
  CCFProgram: { type: Boolean, require: false, default: false },
  income: { type: Number, require: false, default: 0 },
  wallet: { type: Number, require: false, default: 0 },
  lastChanged: { type: Date, require: false, default: Date.now },
  createdAt: { type: Date, require: false, default: Date.now },
  notifications: {type: Boolean, default: false}
});

const User = (module.exports = mongoose.model("User", UserSchema));
