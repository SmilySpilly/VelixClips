const mongoose = require("mongoose");

const PanelSchema = new mongoose.Schema({
  totalVideos:  { type: Number, required: true, default: 0},
  totalMembers: { type: Number, required: true, default: 0},
  totalApplications: { type: Number, required: true, default: 0},
  applicationsToday: { type: Number, required: true},
  videosToday: { type: Number, required: true },
  WeeklyVideos: { type: Object, required: true },
  WeeklyMembers: { type: Object, required: true },
  Todaylikes: { type: Number, required: false, default: 0 },
  TodayViews: { type: Number, required: false, default: 0 },
  TodaySubs: { type: Number, required: false, default: 0 },
});

const panel = (module.exports = mongoose.model("Panel", PanelSchema));
