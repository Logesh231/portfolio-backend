const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  category:   { type: String, required: true }, // e.g. "Web", "Android", "Backend"
  iconUrl:    { type: String },
  percentage: { type: Number, default: 80 }
});

module.exports = mongoose.model('Skill', SkillSchema);