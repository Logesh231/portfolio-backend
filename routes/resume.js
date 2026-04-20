const express = require("express");
const router = express.Router();

const Resume = require("../models/Resume");
const { verifyToken, adminOnly } = require("../middleware/auth");

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// ── CLOUDINARY CONFIG ─────────────────────────────
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── MULTER CONFIG (SAFE FOR RENDER) ───────────────
const upload = multer({ dest: "uploads/" });

/* ────────────────────────────────────────────────
   GET RESUME (PUBLIC)
──────────────────────────────────────────────── */
router.get("/", async (req, res) => {
    try {
        const resume = await Resume.findOne();
        if (!resume) {
            return res.status(404).json({ message: "No resume uploaded yet" });
        }
        res.json(resume);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/* ────────────────────────────────────────────────
   UPLOAD RESUME (ADMIN ONLY)
──────────────────────────────────────────────── */
router.post(
    "/",
    verifyToken,
    adminOnly,
    upload.single("resume"),
    async (req, res) => {
        try {

            console.log("FILE RECEIVED:", req.file);

            if (!req.file) {
                return res.status(400).json({ message: "No file uploaded" });
            }

            // Upload PDF to Cloudinary as RAW file
            const result = await cloudinary.uploader.upload(req.file.path, {
                resource_type: "raw",
                folder: "resumes"
            });

            // Delete local file after upload (important for Render)
            fs.unlinkSync(req.file.path);

            let resume = await Resume.findOne();

            if (resume) {
                // delete old file from cloudinary
                if (resume.pdfPublicId) {
                    await cloudinary.uploader.destroy(resume.pdfPublicId, {
                        resource_type: "raw"
                    });
                }

                resume.pdfUrl = result.secure_url;
                resume.pdfPublicId = result.public_id;
                resume.originalName = req.file.originalname;
                resume.updatedAt = Date.now();

                await resume.save();
            } else {
                resume = await Resume.create({
                    pdfUrl: result.secure_url,
                    pdfPublicId: result.public_id,
                    originalName: req.file.originalname
                });
            }

            res.json({
                message: "Resume uploaded successfully ✅",
                pdfUrl: resume.pdfUrl
            });

        } catch (err) {
            console.error("UPLOAD ERROR:", err);
            res.status(500).json({ message: err.message });
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