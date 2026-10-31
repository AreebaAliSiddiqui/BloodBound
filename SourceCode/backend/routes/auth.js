const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'bloodbound_super_secret_key_2026';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
// 'admin' accounts are never created through public registration (seed/DB only).
const PUBLIC_ROLES = ['donor', 'hospital_staff', 'camp_organizer'];

// 1. REGISTER
router.post('/register', async (req, res) => {
    const client = await pool.connect();
    try {
        const { name, password, role, phone, blood_group, city } = req.body;
        const email = (req.body.email || '').trim().toLowerCase();

        if (!name || !email || !password || !role || !phone) {
            return res.status(400).json({ error: 'Please provide all required fields (name, email, password, role, phone).' });
        }
        if (!PUBLIC_ROLES.includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Allowed: donor, hospital_staff, camp_organizer.' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters.' });
        }
        if (role === 'donor' && (!BLOOD_GROUPS.includes(blood_group) || !city)) {
            return res.status(400).json({ error: 'Donors must provide a valid blood_group and city.' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        await client.query('BEGIN');
        const userResult = await client.query(
            `INSERT INTO users (name, email, password_hash, role, phone)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING user_id, name, email, role, phone`,
            [name, email, password_hash, role, phone]
        );
        const user = userResult.rows[0];

        if (role === 'donor') {
            await client.query(
                `INSERT INTO donor_profiles (user_id, blood_group, city) VALUES ($1, $2, $3)`,
                [user.user_id, blood_group, city]
            );
        }
        await client.query('COMMIT');

        return res.status(201).json({ message: 'User registered successfully!', user });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Email address is already registered.' });
        }
        console.error('Registration Error:', err.message);
        res.status(500).json({ error: 'Server error during registration.' });
    } finally {
        client.release();
    }
});

// 2. LOGIN
router.post('/login', async (req, res) => {
    try {
        const email = (req.body.email || '').trim().toLowerCase();
        const { password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Please provide both email and password.' });
        }

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        const isMatch = user && await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { user_id: user.user_id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.json({ message: 'Login successful!', token, role: user.role, name: user.name });
    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).json({ error: 'Server error during login.' });
    }
});

module.exports = router;
