const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all branches
router.get('/', (req, res) => {
  try {
    const { is_active } = req.query;
    let query = 'SELECT * FROM branches';
    const params = [];

    if (is_active !== undefined) {
      query += ' WHERE is_active = ?';
      params.push(parseInt(is_active, 10));
    }

    query += ' ORDER BY id ASC';
    const branches = db.prepare(query).all(...params);

    res.json({ success: true, count: branches.length, data: branches });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single branch
router.get('/:id', (req, res) => {
  try {
    const branch = db.prepare('SELECT * FROM branches WHERE id = ?').get(req.params.id);
    if (!branch) {
      return res.status(404).json({ success: false, error: 'Filial topilmadi' });
    }
    res.json({ success: true, data: branch });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create branch
router.post('/', (req, res) => {
  try {
    const { name, address, phone, latitude, longitude, opening_hours, is_active } = req.body;
    if (!name || !address || !phone) {
      return res.status(400).json({ success: false, error: 'Filial nomi, manzili va telefon raqami kiritilishi shart' });
    }

    const stmt = db.prepare(`
      INSERT INTO branches (name, address, phone, latitude, longitude, opening_hours, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name,
      address,
      phone,
      latitude ? parseFloat(latitude) : null,
      longitude ? parseFloat(longitude) : null,
      opening_hours || '09:00 - 03:00',
      is_active !== undefined ? (is_active ? 1 : 0) : 1
    );

    const newBranch = db.prepare('SELECT * FROM branches WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, message: 'Filial qo\'shildi', data: newBranch });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update branch
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM branches WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Filial topilmadi' });
    }

    const { name, address, phone, latitude, longitude, opening_hours, is_active } = req.body;

    db.prepare(`
      UPDATE branches
      SET name = ?, address = ?, phone = ?, latitude = ?, longitude = ?, opening_hours = ?, is_active = ?
      WHERE id = ?
    `).run(
      name || existing.name,
      address || existing.address,
      phone || existing.phone,
      latitude !== undefined ? parseFloat(latitude) : existing.latitude,
      longitude !== undefined ? parseFloat(longitude) : existing.longitude,
      opening_hours || existing.opening_hours,
      is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM branches WHERE id = ?').get(req.params.id);
    res.json({ success: true, message: 'Filial yangilandi', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE branch
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM branches WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Filial topilmadi' });
    }

    db.prepare('DELETE FROM branches WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Filial o\'chirildi', id: req.params.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

