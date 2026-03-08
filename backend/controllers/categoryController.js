const { pool } = require('../config/db');

// Build tree structure
const buildTree = (categories, parentId = null) => {
    return categories
        .filter(cat => cat.parent_id === parentId)
        .map(cat => ({
            ...cat,
            children: buildTree(categories, cat.id)
        }));
};

exports.getAllCategories = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT c.*, COUNT(p.id)::int as product_count 
            FROM categories c 
            LEFT JOIN products p ON c.id = p.category_id 
            GROUP BY c.id 
            ORDER BY c.name ASC
        `);
        const tree = buildTree(rows);
        res.json(tree);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, slug, parent_id } = req.body;
        if (!name || !slug) return res.status(400).json({ error: 'Name and slug are required' });

        const { rows } = await pool.query(
            'INSERT INTO categories (name, slug, parent_id) VALUES ($1, $2, $3) RETURNING *',
            [name, slug, parent_id || null]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Create category error:', error);
        if (error.code === '23505') {
            return res.status(400).json({ error: 'A category with this name already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, parent_id } = req.body;

        const { rows } = await pool.query(
            'UPDATE categories SET name = $1, slug = $2, parent_id = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
            [name, slug, parent_id || null, id]
        );

        if (rows.length === 0) return res.status(404).json({ error: 'Category not found' });
        res.json(rows[0]);
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { rowCount } = await pool.query('DELETE FROM categories WHERE id = $1', [id]);

        if (rowCount === 0) return res.status(404).json({ error: 'Category not found' });
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Failed to delete category (it may have products or subcategories)' });
    }
};
