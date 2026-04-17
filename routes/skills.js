const express = require('express');
const router  = express.Router();
const Skill   = require('../models/Skill');
const { verifyToken, adminOnly } = require('../middleware/auth');

// GET all (public)
router.get('/', async (req, res) => {
  try {
    const skills = await Skill.find();
    res.json(skills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST (admin only)
router.post('/', verifyToken, adminOnly, async (req, res) => {
  try {
    const skill = await Skill.create(req.body);
    res.status(201).json(skill);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT (admin only)
router.put('/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const skill = await Skill.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!skill) return res.status(404).json({ message: 'Skill not found' });
    res.json(skill);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE (admin only)
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    await Skill.findByIdAndDelete(req.params.id);
    res.json({ message: 'Skill deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;