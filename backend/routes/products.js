const express = require('express');
const router = express.Router();
const db = require('../database');
const { resolveImageUrl, normalizeStoredImageUrl } = require('../utils/url');

function formatProductResponse(req, product) {
  if (!product) return product;
  return {
    ...product,
    image_url: resolveImageUrl(req, product.image_url)
  };
}

function parseOldPrice(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = parseFloat(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

// GET all products with filtering options
router.get('/', (req, res) => {
  try {
    const { category_id, is_available, search } = req.query;
    let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (category_id) {
      query += ` AND p.category_id = ?`;
      params.push(category_id);
    }

    if (is_available !== undefined && is_available !== '') {
      query += ` AND p.is_available = ?`;
      params.push(parseInt(is_available, 10));
    }

    if (search) {
      query += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY p.category_id ASC, p.id DESC`;

    const products = db.prepare(query).all(...params);
    res.json({
      success: true,
      count: products.length,
      data: products.map((p) => formatProductResponse(req, p))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single product
router.get('/:id', (req, res) => {
  try {
    const product = db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, error: 'Mahsulot topilmadi' });
    }

    res.json({ success: true, data: formatProductResponse(req, product) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create product
router.post('/', (req, res) => {
  try {
    const { category_id, name, description, price, old_price, calories, prep_time_min, image_url, is_available } = req.body;

    if (!name || !price || !category_id) {
      return res.status(400).json({
        success: false,
        error: 'Mahsulot nomi, narxi va kategoriyasi kiritilishi shart.'
      });
    }

    // Verify category exists
    const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(category_id);
    if (!category) {
      return res.status(400).json({ success: false, error: 'Bunday kategoriya mavjud emas.' });
    }

    const defaultImg = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80';
    const rawImage = image_url && image_url.trim() !== '' ? image_url.trim() : defaultImg;
    const finalImage = normalizeStoredImageUrl(req, rawImage);
    const finalPrice = parseFloat(price);
    const finalOldPrice = parseOldPrice(old_price);
    const finalCalories = calories ? parseInt(calories, 10) : 0;
    const finalPrep = prep_time_min ? parseInt(prep_time_min, 10) : 15;
    const finalAvailable = is_available !== undefined ? (is_available ? 1 : 0) : 1;

    const stmt = db.prepare(`
      INSERT INTO products (
        category_id, name, description, price, old_price, calories, prep_time_min, image_url, is_available, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `);

    const result = stmt.run(category_id, name, description || '', finalPrice, finalOldPrice, finalCalories, finalPrep, finalImage, finalAvailable);
    const createdProduct = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Mahsulot muvaffaqiyatli qo\'shildi',
      data: formatProductResponse(req, createdProduct)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update product
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Mahsulot topilmadi' });
    }

    const { category_id, name, description, price, old_price, calories, prep_time_min, image_url, is_available } = req.body;

    const finalCategoryId = category_id !== undefined ? category_id : existing.category_id;
    const finalName = name !== undefined ? name : existing.name;
    const finalDesc = description !== undefined ? description : existing.description;
    const finalPrice = price !== undefined ? parseFloat(price) : existing.price;
    const finalOldPrice = old_price !== undefined ? parseOldPrice(old_price) : (existing.old_price ?? null);
    const finalCalories = calories !== undefined ? parseInt(calories, 10) : existing.calories;
    const finalPrep = prep_time_min !== undefined ? parseInt(prep_time_min, 10) : existing.prep_time_min;
    const rawImage = image_url !== undefined && image_url !== '' ? image_url : existing.image_url;
    const finalImage = normalizeStoredImageUrl(req, rawImage);
    const finalAvailable = is_available !== undefined ? (is_available ? 1 : 0) : existing.is_available;

    db.prepare(`
      UPDATE products
      SET category_id = ?, name = ?, description = ?, price = ?, old_price = ?, calories = ?,
          prep_time_min = ?, image_url = ?, is_available = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(finalCategoryId, finalName, finalDesc, finalPrice, finalOldPrice, finalCalories, finalPrep, finalImage, finalAvailable, req.params.id);

    const updatedProduct = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(req.params.id);

    res.json({
      success: true,
      message: 'Mahsulot yangilandi',
      data: formatProductResponse(req, updatedProduct)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH quick toggle availability (Mavjud / Tugagan)
router.patch('/:id/toggle-availability', (req, res) => {
  try {
    const existing = db.prepare('SELECT id, is_available FROM products WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Mahsulot topilmadi' });
    }

    const newStatus = existing.is_available === 1 ? 0 : 1;
    db.prepare(`
      UPDATE products
      SET is_available = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStatus, req.params.id);

    res.json({
      success: true,
      message: `Mahsulot holati ${newStatus === 1 ? 'Mavjud' : 'Tugagan'} holatiga o'tkazildi`,
      is_available: newStatus
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST bulk delete products
router.post('/bulk-delete', (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'O\'chirish uchun hech qanday mahsulot tanlanmadi' });
    }

    const deleteTx = db.transaction(() => {
      const placeholders = ids.map(() => '?').join(',');
      // Unlink from past orders so historical order data remains intact
      db.prepare(`UPDATE order_items SET product_id = NULL WHERE product_id IN (${placeholders})`).run(...ids);
      // Delete products
      const info = db.prepare(`DELETE FROM products WHERE id IN (${placeholders})`).run(...ids);
      return info.changes;
    });

    const deletedCount = deleteTx();
    res.json({
      success: true,
      message: `${deletedCount} ta mahsulot muvaffaqiyatli o'chirildi`,
      count: deletedCount,
      deletedIds: ids
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE product
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Mahsulot topilmadi' });
    }

    const deleteTx = db.transaction(() => {
      // Unlink from past orders so foreign key constraint does not fail
      db.prepare('UPDATE order_items SET product_id = NULL WHERE product_id = ?').run(req.params.id);
      db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    });

    deleteTx();
    res.json({ success: true, message: 'Mahsulot muvaffaqiyatli o\'chirildi', id: req.params.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

