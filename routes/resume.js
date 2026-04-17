const express = require('express');
const router  = express.Router();
const Resume  = require('../models/Resume');
const { verifyToken, adminOnly } = require('../middleware/auth');


router.get('/', async (req, res) => {
  try {
    const resume = await Resume.findOne();
    res.json(resume);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', verifyToken, adminOnly, async (req, res) => {
  try {
    let resume = await Resume.findOne();
    if (resume) {
      resume.viewUrl     = req.body.viewUrl;
      resume.downloadUrl = req.body.downloadUrl;
      resume.updatedAt   = Date.now();
      await resume.save();
    } else {
      resume = await Resume.create(req.body);
    }
    res.json(resume);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;