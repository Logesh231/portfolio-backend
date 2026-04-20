const express  = require('express');
const router   = express.Router();
const Resume   = require('../models/Resume');
const { verifyToken, adminOnly } = require('../middleware/auth');
const {
    cloudinary,
    uploadResumePDF,
    uploadBufferToCloudinary
} = require('../config/cloudinary');

// ── GET resume (public) ──────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const resume = await Resume.findOne();
        if (!resume) {
            return res.status(404).json({ message: 'No resume uploaded yet' });
        }
        res.json(resume);
    } catch (err) {
        console.error('GET /resume error:', err.message);
        res.status(500).json({ message: err.message });
    }
});

// ── POST upload resume PDF (admin only) ──────────────────────
router.post('/',
    verifyToken,
    adminOnly,

    // Step 1: multer reads file into memory buffer
    (req, res, next) => {
        uploadResumePDF.single('resume')(req, res, (err) => {
            if (err) {
                console.error('❌ Multer error:', err.message);
                return res.status(400).json({ message: err.message });
            }
            next();
        });
    },

    // Step 2: manually upload buffer to Cloudinary
    async (req, res) => {
        try {
            console.log('--- POST /api/resume ---');
            console.log('req.file present:', !!req.file);

            if (!req.file) {
                return res.status(400).json({
                    message: 'No file received. Make sure field name is "resume".'
                });
            }

            console.log('File name    :', req.file.originalname);
            console.log('File size    :', req.file.size, 'bytes');
            console.log('File mimetype:', req.file.mimetype);
            console.log('Buffer length:', req.file.buffer ? req.file.buffer.length : 'NO BUFFER');

            if (!req.file.buffer || req.file.buffer.length === 0) {
                return res.status(400).json({ message: 'File buffer is empty' });
            }

            // Step 2a: delete old PDF from Cloudinary if exists
            const existing = await Resume.findOne();
            if (existing && existing.pdfPublicId) {
                try {
                    await cloudinary.uploader.destroy(existing.pdfPublicId, {
                        resource_type: 'raw'
                    });
                    console.log('Old PDF deleted:', existing.pdfPublicId);
                } catch (delErr) {
                    console.warn('Could not delete old PDF (non-fatal):', delErr.message);
                }
            }

            // Step 2b: upload buffer to Cloudinary
            const originalName = req.file.originalname || 'resume.pdf';
            const result = await uploadBufferToCloudinary(
                req.file.buffer,
                originalName
            );

            const pdfUrl      = result.secure_url;
            const pdfPublicId = result.public_id;

            console.log('✅ Uploaded to Cloudinary:', pdfUrl);

            // Step 2c: save to MongoDB
            let resume;
            if (existing) {
                existing.pdfUrl       = pdfUrl;
                existing.pdfPublicId  = pdfPublicId;
                existing.originalName = originalName;
                existing.updatedAt    = Date.now();
                resume = await existing.save();
            } else {
                resume = await Resume.create({ pdfUrl, pdfPublicId, originalName });
            }

            res.json(resume);

            // res.json({
            //     message:      'Resume uploaded successfully ✅',
            //     pdfUrl:       resume.pdfUrl,
            //     originalName: resume.originalName
            // });

        } catch (err) {
            console.error('❌ POST /resume error:', err.message);
            console.error(err.stack);
            res.status(500).json({ message: err.message || 'Server error during upload' });
        }
    }
);

module.exports = router;



// const express  = require('express');
// const router   = express.Router();
// const Resume   = require('../models/Resume');
// const { verifyToken, adminOnly } = require('../middleware/auth');
// const { cloudinary, uploadResumePDF } = require('../config/cloudinary');

// // ── GET resume (public) ──────────────────────────────────────
// router.get('/', async (req, res) => {
//     try {
//         const resume = await Resume.findOne();
//         if (!resume) {
//             return res.status(404).json({ message: 'No resume uploaded yet' });
//         }
//         res.json(resume);
//     } catch (err) {
//         console.error('GET /resume error:', err);
//         res.status(500).json({ message: err.message });
//     }
// });

// // ── POST upload resume PDF (admin only) ──────────────────────
// router.post('/',
//     verifyToken,
//     adminOnly,
//     (req, res, next) => {
//         // Run multer upload — catch multer-level errors separately
//         uploadResumePDF.single('resume')(req, res, (err) => {
//             if (err) {
//                 console.error('Multer/Cloudinary upload error:', err);
//                 return res.status(500).json({
//                     message: 'Upload failed: ' + err.message
//                 });
//             }
//             next();
//         });
//     },
//     async (req, res) => {
//         try {
//             console.log('req.file:', req.file); // debug log

//             if (!req.file) {
//                 return res.status(400).json({ message: 'No PDF file received' });
//             }

//             // multer-storage-cloudinary puts URL in req.file.path
//             // and public_id in req.file.filename
//             const pdfUrl      = req.file.path;
//             const pdfPublicId = req.file.filename;
//             const originalName = req.file.originalname;

//             if (!pdfUrl) {
//                 return res.status(500).json({ message: 'Cloudinary did not return URL' });
//             }

//             // Check if resume already exists → update or create
//             let resume = await Resume.findOne();

//             if (resume) {
//                 // Delete old PDF from Cloudinary before replacing
//                 if (resume.pdfPublicId) {
//                     try {
//                         await cloudinary.uploader.destroy(resume.pdfPublicId, {
//                             resource_type: 'raw'
//                         });
//                         console.log('Old PDF deleted from Cloudinary');
//                     } catch (delErr) {
//                         // Non-fatal — continue even if old delete fails
//                         console.warn('Could not delete old PDF:', delErr.message);
//                     }
//                 }

//                 resume.pdfUrl       = pdfUrl;
//                 resume.pdfPublicId  = pdfPublicId;
//                 resume.originalName = originalName;
//                 resume.updatedAt    = Date.now();
//                 await resume.save();
//             } else {
//                 resume = await Resume.create({
//                     pdfUrl,
//                     pdfPublicId,
//                     originalName
//                 });
//             }

//             console.log('Resume saved:', resume.pdfUrl);

//             res.json({
//                 message:      'Resume uploaded successfully ✅',
//                 pdfUrl:       resume.pdfUrl,
//                 originalName: resume.originalName
//             });

//         } catch (err) {
//             console.error('POST /resume error:', err);
//             res.status(500).json({ message: err.message });
//         }
//     }
// );

// module.exports = router;

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