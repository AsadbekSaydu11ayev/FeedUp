const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all categories
router.get('/', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.id ASC
    `).all();

    res.json({ success: true, count: categories.length, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single category
router.get('/:id', (req, res) => {
  try {
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Kategoriya topilmadi' });
    }
    res.json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create category
router.post('/', (req, res) => {
  try {
    const { name, slug, icon, sort_order } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Kategoriya nomi kiritilishi shart' });
    }

    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const finalIcon = icon || '🍽️';
    const finalSort = sort_order ? parseInt(sort_order, 10) : 0;

    const stmt = db.prepare(`
      INSERT INTO categories (name, slug, icon, sort_order)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(name, finalSlug, finalIcon, finalSort);
    const newCategory = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ success: true, message: 'Kategoriya yaratildi', data: newCategory });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ success: false, error: 'Ushbu slug bilan kategoriya allaqachon mavjud' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update category
router.put('/:id', (req, res) => {
  try {
    const { name, slug, icon, sort_order } = req.body;
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Kategoriya topilmadi' });
    }

    const finalName = name || category.name;
    const finalSlug = slug || category.slug;
    const finalIcon = icon !== undefined ? icon : category.icon;
    const finalSort = sort_order !== undefined ? parseInt(sort_order, 10) : category.sort_order;

    db.prepare(`
      UPDATE categories
      SET name = ?, slug = ?, icon = ?, sort_order = ?
      WHERE id = ?
    `).run(finalName, finalSlug, finalIcon, finalSort, req.params.id);

    const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    res.json({ success: true, message: 'Kategoriya yangilandi', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE category
router.delete('/:id', (req, res) => {
  try {
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Kategoriya topilmadi' });
    }

    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Kategoriya o\'chirildi', id: req.params.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

