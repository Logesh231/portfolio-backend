const express   = require('express');
const router    = express.Router();
const Project   = require('../models/Project');
const { verifyToken, adminOnly } = require('../middleware/auth');
const { cloudinary, uploadProjectImage } = require('../config/cloudinary');

// ── GET all projects (public) ────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });
        res.json(projects);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── POST create project with image (admin only) ───────────────
// uploadProjectImage.single('image') → reads 'image' field from multipart form
router.post('/', verifyToken, adminOnly,
    uploadProjectImage.single('image'),
    async (req, res) => {
        try {
            const projectData = {
                title:       req.body.title,
                description: req.body.description,
                techStack:   req.body.techStack   || '',
                githubUrl:   req.body.githubUrl   || '',
            };

            // If image was uploaded, save its URL and public_id
            if (req.file) {
                projectData.imageUrl      = req.file.path;       // Cloudinary URL
                projectData.imagePublicId = req.file.filename;   // public_id
            }

            const project = await Project.create(projectData);
            res.status(201).json(project);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }
);

// ── PUT update project with optional new image (admin only) ───
router.put('/:id', verifyToken, adminOnly,
    uploadProjectImage.single('image'),
    async (req, res) => {
        try {
            const existing = await Project.findById(req.params.id);
            if (!existing) return res.status(404).json({ message: 'Project not found' });

            const updateData = {
                title:       req.body.title,
                description: req.body.description,
                techStack:   req.body.techStack || '',
                githubUrl:   req.body.githubUrl || '',
            };

            // If a new image was uploaded
            if (req.file) {
                // Delete old image from Cloudinary if it exists
                if (existing.imagePublicId) {
                    await cloudinary.uploader.destroy(existing.imagePublicId);
                }
                updateData.imageUrl      = req.file.path;
                updateData.imagePublicId = req.file.filename;
            }

            const project = await Project.findByIdAndUpdate(
                req.params.id, updateData, { new: true }
            );
            res.json(project);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }
);

// ── DELETE project + delete image from Cloudinary (admin only)
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Delete image from Cloudinary
        if (project.imagePublicId) {
            await cloudinary.uploader.destroy(project.imagePublicId);
        }

        await Project.findByIdAndDelete(req.params.id);
        res.json({ message: 'Project deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;



// const router  = express.Router();
// const Project = require('../models/Project');
// const { verifyToken, adminOnly } = require('../middleware/auth');

// // GET all projects (public - anyone can view)
// router.get('/', async (req, res) => {
//   try {
//     const projects = await Project.find().sort({ createdAt: -1 });
//     res.json(projects);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // POST create project (admin only)
// router.post('/', verifyToken, adminOnly, async (req, res) => {
//   try {
//     const project = await Project.create(req.body);
//     res.status(201).json(project);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// });

// // PUT update project (admin only)
// router.put('/:id', verifyToken, adminOnly, async (req, res) => {
//   try {
//     const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!project) return res.status(404).json({ message: 'Project not found' });
//     res.json(project);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// });

// // DELETE project (admin only)
// router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
//   try {
//     await Project.findByIdAndDelete(req.params.id);
//     res.json({ message: 'Project deleted' });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// module.exports = router;