const { pool } = require('../config/db');

exports.getProfile = async (req, res) => {
    try {
        const { userId } = req.user;
        const { rows } = await pool.query(
            'SELECT id, email, full_name, role, created_at FROM users WHERE id = $1',
            [userId]
        );

        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(rows[0]);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { userId } = req.user;
        const { full_name } = req.body;

        const { rows } = await pool.query(
            'UPDATE users SET full_name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, full_name, role',
            [full_name, userId]
        );

        res.json(rows[0]);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getUserOrders = async (req, res) => {
    try {
        const { userId } = req.user;
        const { rows } = await pool.query(
            'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
