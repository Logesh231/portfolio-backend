const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log("BODY:", req.body);
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid password' });

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, role: user.role, username: user.username });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/seed  ← Run ONCE to create admin user
router.post('/seed', async (req, res) => {
  try {
    const exists = await User.findOne({ username: 'admin' });
    if (exists) return res.json({ message: 'Admin already exists' });

    const hashed = await bcrypt.hash('admin123', 10);
    await User.create({ username: 'admin', password: hashed, role: 'ADMIN' });
    res.json({ message: 'Admin created: username=admin password=admin123' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;