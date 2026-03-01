const { pool } = require('../config/db');

exports.getProducts = async (req, res) => {
    try {
        const { category, min_price, max_price, search, sort, page = 1, limit = 12 } = req.query;

        let query = 'SELECT * FROM products WHERE is_active = true';
        const params = [];
        let paramIdx = 1;

        if (category) {
            query += ` AND category_id = $${paramIdx++}`;
            params.push(category);
        }

        if (min_price) {
            query += ` AND price >= $${paramIdx++}`;
            params.push(min_price);
        }

        if (max_price) {
            query += ` AND price <= $${paramIdx++}`;
            params.push(max_price);
        }

        if (search) {
            query += ` AND (name ILIKE $${paramIdx} OR description ILIKE $${paramIdx})`;
            params.push(`%${search}%`);
            paramIdx++;
        }

        // Determine sorting
        if (sort === 'price_asc') query += ' ORDER BY price ASC';
        else if (sort === 'price_desc') query += ' ORDER BY price DESC';
        else if (sort === 'newest') query += ' ORDER BY created_at DESC';
        else query += ' ORDER BY created_at DESC';

        // Pagination
        const offset = (page - 1) * limit;
        query += ` LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
        params.push(limit, offset);

        const { rows } = await pool.query(query, params);

        // Total count for pagination
        const countQuery = query.split('ORDER BY')[0].replace('SELECT *', 'SELECT COUNT(*)');
        const countParams = params.slice(0, params.length - 2);
        const { rows: countRows } = await pool.query(countQuery, countParams);

        res.json({
            products: rows,
            total: parseInt(countRows[0].count, 10),
            page: parseInt(page, 10),
            limit: parseInt(limit, 10)
        });

    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

        if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        res.json(rows[0]);
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Admin Endpoints
exports.getAllProductsAdmin = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, compare_at_price, sku, stock_quantity, images, category_id, is_active } = req.body;

        const { rows } = await pool.query(
            `INSERT INTO products (name, description, price, compare_at_price, sku, stock_quantity, images, category_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, COALESCE($9, true)) RETURNING *`,
            [name, description, price, compare_at_price, sku, stock_quantity, JSON.stringify(images || []), category_id, is_active]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, compare_at_price, sku, stock_quantity, images, category_id, is_active } = req.body;

        const { rows } = await pool.query(
            `UPDATE products 
       SET name = $1, description = $2, price = $3, compare_at_price = $4, sku = $5, 
           stock_quantity = $6, images = $7::jsonb, category_id = $8, is_active = COALESCE($9, is_active), updated_at = NOW()
       WHERE id = $10 RETURNING *`,
            [name, description, price, compare_at_price, sku, stock_quantity, JSON.stringify(images || []), category_id, is_active, id]
        );

        if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        res.json(rows[0]);
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteProduct = async (req, res) => {
    // Soft delete
    try {
        const { id } = req.params;
        const { rows } = await pool.query(
            'UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *',
            [id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        res.json({ message: 'Product soft deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
