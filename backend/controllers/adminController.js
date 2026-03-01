const { pool } = require('../config/db');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.getDashboardStats = async (req, res) => {
    try {
        const revenueQuery = await pool.query('SELECT SUM(total) as total_revenue FROM orders WHERE payment_status = \'paid\'');
        const ordersQuery = await pool.query('SELECT COUNT(*) as total_orders FROM orders');
        const customersQuery = await pool.query('SELECT COUNT(*) as new_customers FROM users WHERE role = \'customer\' AND created_at > NOW() - INTERVAL \'30 days\'');
        const lowStockQuery = await pool.query('SELECT COUNT(*) as low_stock FROM products WHERE stock_quantity < 10 AND is_active = true');

        const recentOrders = await pool.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5');

        res.json({
            totalRevenue: revenueQuery.rows[0].total_revenue || 0,
            totalOrders: ordersQuery.rows[0].total_orders || 0,
            newCustomers: customersQuery.rows[0].new_customers || 0,
            lowStock: lowStockQuery.rows[0].low_stock || 0,
            recentOrders: recentOrders.rows
        });
    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getOrders = async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = 'SELECT * FROM orders WHERE 1=1';
        const params = [];
        let paramIdx = 1;

        if (status) {
            query += ` AND status = $${paramIdx++}`;
            params.push(status);
        }

        if (search) {
            query += ` AND (id::text ILIKE $${paramIdx} OR guest_email ILIKE $${paramIdx})`;
            params.push(`%${search}%`);
            paramIdx++;
        }

        query += ' ORDER BY created_at DESC LIMIT 50';

        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, comment } = req.body;

        const { rows } = await pool.query(
            'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });

        // Insert history
        await pool.query(
            'INSERT INTO order_status_history (order_id, status, comment) VALUES ($1, $2, $3)',
            [id, status, comment || 'Status updated by admin']
        );

        res.json(rows[0]);
    } catch (error) {
        console.error('Update Order Status Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getCustomers = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, email, full_name, created_at FROM users WHERE role = \'customer\' ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image provided' });
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'semms_ecom'
        });

        // Remove local file
        fs.unlinkSync(req.file.path);

        res.json({
            url: result.secure_url,
            public_id: result.public_id
        });
    } catch (error) {
        console.error('Image Upload Error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};
