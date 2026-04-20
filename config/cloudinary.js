const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary with env credentials
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage for PROJECT screenshots
// Uploads to cloudinary folder: portfolio/projects
const projectStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder:         'portfolio/projects',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 800, height: 600, crop: 'limit', quality: 'auto' }]
    }
});

// Storage for RESUME PDF
// Uploads to cloudinary folder: portfolio/resume
const resumeStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder:         'portfolio/resume',
        allowed_formats: ['pdf'],
        resource_type:  'raw'   // 'raw' is required for PDF files
    }
});

// Multer upload instances
const uploadProjectImage = multer({ storage: projectStorage });
const uploadResumePDF    = multer({ storage: resumeStorage  });

module.exports = { cloudinary, uploadProjectImage, uploadResumePDF };