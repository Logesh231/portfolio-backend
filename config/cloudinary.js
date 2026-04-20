const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary with your credentials
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ── PROJECT IMAGE storage (CloudinaryStorage works fine for images)
const projectStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
        folder:          'portfolio/projects',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        resource_type:   'image',
        transformation:  [{ width: 800, height: 600, crop: 'limit', quality: 'auto' }]
    })
});

// ── RESUME PDF — use memoryStorage
// We store file in memory buffer and manually call cloudinary.uploader.upload_stream
// This is the ONLY reliable way to upload PDFs with resource_type:'raw'
const resumeMemoryStorage = multer.memoryStorage();

const uploadProjectImage = multer({
    storage: projectStorage,
    limits: { fileSize: 5 * 1024 * 1024 }  // 5MB
});

const uploadResumePDF = multer({
    storage: resumeMemoryStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        console.log('File mimetype:', file.mimetype);
        // Accept PDF and also octet-stream (some Android versions send this)
        if (
            file.mimetype === 'application/pdf' ||
            file.mimetype === 'application/octet-stream'
        ) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type: ${file.mimetype}. Only PDF allowed.`), false);
        }
    }
});

// ── Helper: upload buffer to Cloudinary as raw PDF
const uploadBufferToCloudinary = (buffer, filename) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder:        'portfolio/resume',
                resource_type: 'raw',           // REQUIRED for PDF
                public_id:     filename.replace('.pdf', ''),
                use_filename:  true,
                overwrite:     true,
                // format:        'pdf'
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload_stream error:', error);
                    reject(error);
                } else {
                    console.log('Cloudinary upload success:', result.secure_url);
                    resolve(result);
                }
            }
        );
        // Write the buffer into the stream
        uploadStream.end(buffer);
    });
};

module.exports = {
    cloudinary,
    uploadProjectImage,
    uploadResumePDF,
    uploadBufferToCloudinary
};