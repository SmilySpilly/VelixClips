const mongoose = require('mongoose');

module.exports = mongoose.connect('mongodb://localhost:27017/VelixClips', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true });