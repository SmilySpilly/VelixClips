const mongoose = require("mongoose");

const VideosSchema = new mongoose.Schema({
  uuid: { type: String, required: true, unique: true },
  owner: { type: String, required: true },
  channelID: { type: String, required: true },
  title: { type: String, required: true },
  likes: { type: Number, required: false, default: 0 },
  dislikes: { type: Number, required: false, default: 0 },
  views: { type: Number, required: false, default: 0 },
  tags: { type: Array, required: false },
  thumbnail: { type: String, required: false },
  comments: { type: Number, required: false },
  description: { type: String, required: false },
  published: { type: Date, default: Date.now },
});

const videos = (module.exports = mongoose.model("Videos", VideosSchema));
