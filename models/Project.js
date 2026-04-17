// models/Project.js
const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, required: true },
  techStack:   { type: String },
  githubUrl:   { type: String },
  imageUrl:    { type: String },
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', ProjectSchema);