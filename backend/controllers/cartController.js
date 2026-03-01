const { pool } = require('../config/db');

exports.getCart = async (req, res) => {
    try {
        const { sessionId } = req.query;
        let userId = req.user ? req.user.userId : null;

        let query = '';
        let params = [];

        if (userId) {
            query = 'SELECT * FROM carts WHERE user_id = $1';
            params = [userId];
        } else if (sessionId) {
            query = 'SELECT * FROM carts WHERE session_id = $1 AND user_id IS NULL';
            params = [sessionId];
        } else {
            return res.json({ items: [] });
        }

        const { rows } = await pool.query(query, params);

        if (rows.length === 0) {
            return res.json({ items: [] });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.syncCart = async (req, res) => {
    try {
        const { items, sessionId } = req.body;
        let userId = req.user ? req.user.userId : null;

        if (!userId && !sessionId) {
            return res.status(400).json({ error: 'User ID or Session ID required' });
        }

        let cart;
        if (userId) {
            // Find or create cart for user
            const userCart = await pool.query('SELECT * FROM carts WHERE user_id = $1', [userId]);
            if (userCart.rows.length === 0) {
                const { rows } = await pool.query(
                    'INSERT INTO carts (user_id, items) VALUES ($1, $2::jsonb) RETURNING *',
                    [userId, JSON.stringify(items || [])]
                );
                cart = rows[0];
            } else {
                const { rows } = await pool.query(
                    'UPDATE carts SET items = $1::jsonb, updated_at = NOW() WHERE user_id = $2 RETURNING *',
                    [JSON.stringify(items || []), userId]
                );
                cart = rows[0];
            }

            // If user just logged in, they might pass a sessionId from guest checkout to merge
            if (sessionId) {
                await pool.query('DELETE FROM carts WHERE session_id = $1 AND user_id IS NULL', [sessionId]);
            }
        } else {
            // Find or create cart for session
            const sessionCart = await pool.query('SELECT * FROM carts WHERE session_id = $1', [sessionId]);
            if (sessionCart.rows.length === 0) {
                const { rows } = await pool.query(
                    'INSERT INTO carts (session_id, items) VALUES ($1, $2::jsonb) RETURNING *',
                    [sessionId, JSON.stringify(items || [])]
                );
                cart = rows[0];
            } else {
                const { rows } = await pool.query(
                    'UPDATE carts SET items = $1::jsonb, updated_at = NOW() WHERE session_id = $2 RETURNING *',
                    [JSON.stringify(items || []), sessionId]
                );
                cart = rows[0];
            }
        }

        res.json(cart);
    } catch (error) {
        console.error('Sync cart error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
