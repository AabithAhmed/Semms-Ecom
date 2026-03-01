const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/db');

const generateTokens = (user) => {
    const payload = { userId: user.id, role: user.role };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

const setTokenCookies = (res, accessToken, refreshToken) => {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 15 * 60 * 1000 // 15 minutes
    });
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};

exports.register = async (req, res) => {
    try {
        const { email, password, full_name } = req.body;

        if (!email || !password || !full_name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const client = await pool.connect();

        // Check if user exists
        const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            client.release();
            return res.status(409).json({ error: 'User already exists' });
        }

        // Hash password & Insert
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = await client.query(
            'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, role',
            [email, passwordHash, full_name]
        );

        const user = newUser.rows[0];
        const { accessToken, refreshToken } = generateTokens(user);

        // Save refresh token
        await client.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

        client.release();

        setTokenCookies(res, accessToken, refreshToken);
        res.status(201).json({ user });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = rows[0];
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

        const { accessToken, refreshToken } = generateTokens(user);

        await pool.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

        setTokenCookies(res, accessToken, refreshToken);

        const { password_hash, refresh_token, reset_password_token, reset_password_expires, ...userProfile } = user;
        res.json({ user: userProfile });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (err) {
            return res.status(403).json({ error: 'Invalid refresh token' });
        }

        // Check DB
        const { rows } = await pool.query('SELECT * FROM users WHERE id = $1 AND refresh_token = $2', [decoded.userId, refreshToken]);
        if (rows.length === 0) return res.status(403).json({ error: 'Invalid refresh token' });

        const user = rows[0];
        const tokens = generateTokens(user);

        await pool.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [tokens.refreshToken, user.id]);

        setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
        res.json({ message: 'Tokens refreshed successfully' });
    } catch (error) {
        console.error('Refresh error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.logout = async (req, res) => {
    try {
        const { userId } = req.user;
        await pool.query('UPDATE users SET refresh_token = NULL WHERE id = $1', [userId]);

        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.forgotPassword = async (req, res) => {
    // In a real app we would send an email. For now we just generate the token.
    try {
        const { email } = req.body;
        const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

        if (rows.length > 0) {
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetExpires = new Date(Date.now() + 3600000); // 1 hour

            await pool.query(
                'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
                [resetToken, resetExpires, rows[0].id]
            );

            // Send email simulation
            console.log(`Sending password reset link to ${email}: /reset-password/${resetToken}`);
        }

        res.json({ message: 'If that email address is in our database, we will send you an email to reset your password.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const { rows } = await pool.query(
            'SELECT id FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
            [token]
        );

        if (rows.length === 0) {
            return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
        }

        const userId = rows[0].id;
        const passwordHash = await bcrypt.hash(password, 10);

        await pool.query(
            'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
            [passwordHash, userId]
        );

        res.json({ message: 'Password has been updated successfully.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
