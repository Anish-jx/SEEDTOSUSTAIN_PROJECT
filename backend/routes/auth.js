import express from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/signup - Create new user
router.post('/signup', async (req, res) => {
    try {
        const { email, password, displayName, securityQuestion, securityAnswer } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        if (!securityQuestion || !securityAnswer) {
            return res.status(400).json({ error: 'Security question and answer are required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Please enter a valid email address' });
        }

        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }

        // Hash password and security answer
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        const securityAnswerHash = await bcrypt.hash(securityAnswer.toLowerCase().trim(), saltRounds);

        // Create user
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, display_name, security_question, security_answer_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, display_name, role, created_at`,
            [email.toLowerCase(), passwordHash, displayName || email.split('@')[0], securityQuestion, securityAnswerHash]
        );

        const user = result.rows[0];
        const token = generateToken(user);

        // User starts with no devices - they will add their own
        res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                displayName: user.display_name,
                role: user.role,
            },
            token,
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Failed to create account. Please try again.' });
    }
});

// POST /api/auth/login - Authenticate user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const result = await pool.query(
            'SELECT id, email, password_hash, display_name, role FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'No account found with this email address' });
        }

        const user = result.rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Incorrect password. Please try again.' });
        }

        const token = generateToken(user);

        // Update last login timestamp
        await pool.query('UPDATE users SET updated_at = NOW() WHERE id = $1', [user.id]);

        res.json({
            user: {
                id: user.id,
                email: user.email,
                displayName: user.display_name,
                role: user.role,
            },
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// POST /api/auth/forgot-password/check-email - Check if email exists and get security question
router.post('/forgot-password/check-email', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const result = await pool.query(
            'SELECT id, security_question FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No account found with this email address' });
        }

        const user = result.rows[0];

        if (!user.security_question) {
            return res.status(400).json({ error: 'This account does not have a security question set up' });
        }

        res.json({
            userId: user.id,
            securityQuestion: user.security_question,
        });
    } catch (error) {
        console.error('Check email error:', error);
        res.status(500).json({ error: 'Failed to check email. Please try again.' });
    }
});

// POST /api/auth/forgot-password/verify-answer - Verify security answer
router.post('/forgot-password/verify-answer', async (req, res) => {
    try {
        const { email, securityAnswer } = req.body;

        if (!email || !securityAnswer) {
            return res.status(400).json({ error: 'Email and security answer are required' });
        }

        const result = await pool.query(
            'SELECT id, security_answer_hash FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No account found with this email address' });
        }

        const user = result.rows[0];

        const isValidAnswer = await bcrypt.compare(securityAnswer.toLowerCase().trim(), user.security_answer_hash);
        if (!isValidAnswer) {
            return res.status(401).json({ error: 'Incorrect answer. Please try again.' });
        }

        // Generate a temporary reset token
        const resetToken = generateToken({ id: user.id, type: 'reset' });

        res.json({
            success: true,
            resetToken,
        });
    } catch (error) {
        console.error('Verify answer error:', error);
        res.status(500).json({ error: 'Failed to verify answer. Please try again.' });
    }
});

// POST /api/auth/forgot-password/reset - Reset password
router.post('/forgot-password/reset', async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({ error: 'Reset token and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Verify reset token
        const jwt = await import('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'seed2sustain-secret-key-2026-aeroponic-farm-change-in-production';

        let decoded;
        try {
            decoded = jwt.default.verify(resetToken, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ error: 'Invalid or expired reset token' });
        }

        // Hash new password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await pool.query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
            [passwordHash, decoded.id]
        );

        res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password. Please try again.' });
    }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, display_name, role, iot_setup_type, created_at FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
            id: user.id,
            email: user.email,
            displayName: user.display_name,
            role: user.role,
            iotSetupType: user.iot_setup_type || 'single',
            createdAt: user.created_at,
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// PUT /api/auth/me - Update current user
router.put('/me', authenticateToken, async (req, res) => {
    try {
        const { displayName, role, iotSetupType } = req.body;

        const result = await pool.query(
            `UPDATE users 
       SET display_name = COALESCE($1, display_name), 
           role = COALESCE($2, role),
           iot_setup_type = COALESCE($3, iot_setup_type),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, email, display_name, role, iot_setup_type`,
            [displayName, role, iotSetupType, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
            id: user.id,
            email: user.email,
            displayName: user.display_name,
            role: user.role,
            iotSetupType: user.iot_setup_type || 'single',
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

export default router;
