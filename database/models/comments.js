const mongoose = require('mongoose');

const CommentsSchema = new mongoose.Schema({
    id: { type: String, required: true}, // Video UUID
    owner: { type: String , required: true }, // Comment Owner
    content: { type: String , required: true },
    likes: { type: Number, required: false, default: 0},
    dislikes: { type: Number, required: false, default: 0 },
    published: { type: Date, default: Date.now() },
});

const Comments = module.exports = mongoose.model('Comments', CommentsSchema);