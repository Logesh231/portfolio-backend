const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const admin   = require('../config/firebase-admin'); // Firebase Admin SDK

// ── POST /api/auth/verify-otp ────────────────────────────────
// Android sends Firebase ID token after OTP verified
// Backend checks if the phone number is the admin number
// If yes → returns JWT token with ADMIN role
router.post('/verify-otp', async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ message: 'Firebase ID token required' });
        }

        // Step 1: Verify Firebase ID token
        const decoded = await admin.auth().verifyIdToken(idToken);
        const phoneNumber = decoded.phone_number;

        console.log('Phone verified by Firebase:', phoneNumber);

        if (!phoneNumber) {
            return res.status(400).json({ message: 'No phone number in token' });
        }

        // Step 2: Check if this phone number is the admin
        // ✅ Set YOUR phone number here with country code (no spaces)
        const ADMIN_PHONE = process.env.ADMIN_PHONE_NUMBER; // e.g. +916369636340

        if (phoneNumber !== ADMIN_PHONE) {
            return res.status(403).json({
                message: 'Access denied. Not an admin number.'
            });
        }

        // Step 3: Issue JWT token for admin
        const token = jwt.sign(
            {
                phone: phoneNumber,
                role:  'ADMIN',
                uid:   decoded.uid
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('✅ Admin JWT issued for:', phoneNumber);

        res.json({
            token,
            role:     'ADMIN',
            username: 'Admin',
            phone:    phoneNumber
        });

    } catch (err) {
        console.error('❌ verify-otp error:', err.message);

        if (err.code === 'auth/id-token-expired') {
            return res.status(401).json({ message: 'OTP session expired. Try again.' });
        }
        if (err.code === 'auth/argument-error') {
            return res.status(400).json({ message: 'Invalid Firebase token.' });
        }

        res.status(500).json({ message: err.message });
    }
});

// ── GET /api/auth/check ──────────────────────────────────────
// Simple route to check if JWT is still valid
router.get('/check', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ valid: false });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ valid: true, role: decoded.role });
    } catch {
        res.status(401).json({ valid: false });
    }
});

module.exports = router;

















// const express = require('express');
// const router  = express.Router();
// const bcrypt  = require('bcryptjs');
// const jwt     = require('jsonwebtoken');
// const User    = require('../models/User');

// // POST /api/auth/login
// router.post('/login', async (req, res) => {
//   const { username, password } = req.body;
//   console.log("BODY:", req.body);
//   try {
//     const user = await User.findOne({ username });
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     const match = await bcrypt.compare(password, user.password);
//     if (!match) return res.status(401).json({ message: 'Invalid password' });

//     const token = jwt.sign(
//       { id: user._id, username: user.username, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     res.json({ token, role: user.role, username: user.username });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // POST /api/auth/seed  ← Run ONCE to create admin user
// router.post('/seed', async (req, res) => {
//   try {
//     const exists = await User.findOne({ username: 'admin' });
//     if (exists) return res.json({ message: 'Admin already exists' });

//     const hashed = await bcrypt.hash('admin123', 10);
//     await User.create({ username: 'admin', password: hashed, role: 'ADMIN' });
//     res.json({ message: 'Admin created: username=admin password=admin123' });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// module.exports = router;