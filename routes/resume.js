const express  = require('express');
const router   = express.Router();
const Resume   = require('../models/Resume');
const { verifyToken, adminOnly } = require('../middleware/auth');
const { cloudinary, uploadResumePDF } = require('../config/cloudinary');

// ── GET resume (public) ──────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const resume = await Resume.findOne();
        if (!resume) return res.status(404).json({ message: 'No resume found' });
        res.json(resume);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── POST upload or replace resume PDF (admin only) ────────────
// uploadResumePDF.single('resume') → reads 'resume' field from multipart form
router.post('/', verifyToken, adminOnly,
    uploadResumePDF.single('resume'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No PDF file uploaded' });
            }

            // Check if resume already exists
            let resume = await Resume.findOne();

            if (resume) {
                // Delete old PDF from Cloudinary
                if (resume.pdfPublicId) {
                    await cloudinary.uploader.destroy(
                        resume.pdfPublicId,
                        { resource_type: 'raw' }  // required for PDF
                    );
                }
                // Update existing resume record
                resume.pdfUrl       = req.file.path;
                resume.pdfPublicId  = req.file.filename;
                resume.originalName = req.file.originalname;
                resume.updatedAt    = Date.now();
                await resume.save();
            } else {
                // Create new resume record
                resume = await Resume.create({
                    pdfUrl:       req.file.path,
                    pdfPublicId:  req.file.filename,
                    originalName: req.file.originalname
                });
            }

            res.json({
                message:  'Resume uploaded successfully',
                pdfUrl:   resume.pdfUrl,
                fileName: resume.originalName
            });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }
);

module.exports = router;

// const express = require('express');
// const router  = express.Router();
// const Resume  = require('../models/Resume');
// const { verifyToken, adminOnly } = require('../middleware/auth');


// router.get('/', async (req, res) => {
//   try {
//     const resume = await Resume.findOne();
//     res.json(resume);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// router.post('/', verifyToken, adminOnly, async (req, res) => {
//   try {
//     let resume = await Resume.findOne();
//     if (resume) {
//       resume.viewUrl     = req.body.viewUrl;
//       resume.downloadUrl = req.body.downloadUrl;
//       resume.updatedAt   = Date.now();
//       await resume.save();
//     } else {
//       resume = await Resume.create(req.body);
//     }
//     res.json(resume);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// });

// module.exports = router;