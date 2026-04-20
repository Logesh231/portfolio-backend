const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  pdfUrl:       { type: String, required: true },
  pdfPublicId:  { type: String, required: true },
  originalName: { type: String },
  updatedAt:    { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resume', ResumeSchema);




// const mongoose = require('mongoose');
 
// const ResumeSchema = new mongoose.Schema({
//   viewUrl:     { type: String, required: true },
//   downloadUrl: { type: String, required: true },
//   updatedAt:   { type: Date, default: Date.now }
// });
 
// module.exports = mongoose.model('Resume', ResumeSchema);
 