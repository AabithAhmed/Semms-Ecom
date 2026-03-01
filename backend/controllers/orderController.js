const { pool } = require('../config/db');

exports.createPaymentIntent = async (req, res) => {
    // Stub for Razorpay/future payment gateway
    try {
        res.json({
            clientSecret: 'razorpay_stubbed_intent',
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.createOrder = async (req, res) => {
    try {
        const {
            guest_email, shipping_address, items,
            subtotal, tax, shipping_cost, total, payment_intent_id
        } = req.body;

        let userId = req.user ? req.user.userId : null;

        let paymentStatus = 'pending';
        let paymentMethodName = 'Razorpay (stubbed)';

        const { rows } = await pool.query(
            `INSERT INTO orders 
       (user_id, guest_email, shipping_address, items, subtotal, tax, shipping_cost, total, payment_status, payment_intent_id, payment_method) 
       VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [userId, guest_email, JSON.stringify(shipping_address), JSON.stringify(items), subtotal, tax, shipping_cost, total, paymentStatus, payment_intent_id || 'stubbed_id', paymentMethodName]
        );

        const order = rows[0];

        // Clear user cart if authenticated
        if (userId) {
            await pool.query('UPDATE carts SET items = \'[]\'::jsonb WHERE user_id = $1', [userId]);
        }

        res.status(201).json(order);
    } catch (error) {
        console.error('Create Order Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
