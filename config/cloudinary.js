const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ── Project IMAGE storage ────────────────────────────────────
// params must be a FUNCTION (not object) for dynamic values
const projectStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        return {
            folder:          'portfolio/projects',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            resource_type:   'image',
            transformation:  [{ width: 800, height: 600, crop: 'limit', quality: 'auto' }]
        };
    }
});

// ── Resume PDF storage ───────────────────────────────────────
// resource_type 'raw' is REQUIRED for PDFs in Cloudinary
const resumeStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        return {
            folder:          'portfolio/resume',
            resource_type:   'raw',   // MUST be 'raw' for PDF
            format:          'pdf',
            use_filename:    true,
            unique_filename: true
        };
    }
});

const uploadProjectImage = multer({
    storage: projectStorage,
    limits:  { fileSize: 5 * 1024 * 1024 } // 5MB max
});

const uploadResumePDF = multer({
    storage: resumeStorage,
    limits:  { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

module.exports = { cloudinary, uploadProjectImage, uploadResumePDF };