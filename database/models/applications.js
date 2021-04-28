const mongoose = require("mongoose");

const ApplicationsSchema = new mongoose.Schema({
  userID: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  birthday: { type: String, required: true},
  country: { type: String, required: true},
  paypal: { type: String, required: true},
});

const Applications = (module.exports = mongoose.model("Applications", ApplicationsSchema));
