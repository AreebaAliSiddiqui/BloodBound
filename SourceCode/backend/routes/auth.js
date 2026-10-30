const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// Note: You can plug in your actual db pool connection here (e.g., const pool = require('../database/db');)

const JWT_SECRET = process.env.JWT_SECRET || 'bloodbound_super_secret_key_2026';

// In-memory mock storage fallback or database connection hook
// (We will connect this directly to your PostgreSQL pool once db.js is initialized)

// 1. REGISTER ROUTE
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, phone, blood_group, city } = req.body;

        // Basic validation
        if (!name || !email || !password || !role || !phone) {
            return res.status(400).json({ error: 'Please provide all required fields (name, email, password, role, phone).' });
        }

        // Validate allowed roles
        const validRoles = ['donor', 'hospital_staff', 'camp_organizer', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role specified.' });
        }

        // Hash password securely
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // TODO: Insert into PostgreSQL database users table
        // const newUser = await pool.query(
        //     'INSERT INTO users (name, email, password_hash, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, name, email, role, phone',
        //     [name, email, password_hash, role, phone]
        // );

        // Mock response for scaffolding confirmation
        return res.status(201).json({
            message: 'User registered successfully!',
            user: {
                name,
                email,
                role,
                phone
            }
        });

    } catch (err) {
        console.error('Registration Error:', err.message);
        if (err.code === '23505') { // Postgres unique violation code for duplicate email
            return res.status(400).json({ error: 'Email address is already registered.' });
        }
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

// 2. LOGIN ROUTE
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Please provide both email and password.' });
        }

        // TODO: Fetch user from PostgreSQL database
        // const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        // if (userResult.rows.length === 0) return res.status(400).json({ error: 'Invalid email or password.' });
        // const user = userResult.rows[0];

        // Placeholder mock user check until DB connection module is hooked up
        if (email !== 'admin@bloodbound.org' && email !== 'areeba@example.com') {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        // Compare password with hash (Simulated check)
        // const isMatch = await bcrypt.compare(password, user.password_hash);
        // if (!isMatch) return res.status(400).json({ error: 'Invalid email or password.' });

        // Generate JWT Token containing role information
        const tokenPayload = {
            user_id: '11111111-1111-1111-1111-111111111111',
            email: email,
            role: email.includes('admin') ? 'admin' : 'donor' // Dynamic role mock
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

        return res.json({
            message: 'Login successful!',
            token,
            role: tokenPayload.role
        });

    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).json({ error: 'Server error during login.' });
    }
});

module.exports = router;