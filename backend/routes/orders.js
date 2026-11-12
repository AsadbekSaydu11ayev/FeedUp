const express = require('express');
const router = express.Router();
const db = require('../database');
const { addClient, broadcastEvent } = require('../events');
const { sendTelegramNotification } = require('../telegram');
const { resolveImageUrl } = require('../utils/url');

function formatOrderResponse(req, order) {
  if (!order || !Array.isArray(order.items)) return order;
  return {
    ...order,
    items: order.items.map((item) => ({
      ...item,
      image_url: resolveImageUrl(req, item.image_url)
    }))
  };
}

// Helper to fetch full order details with items and branch info
function getFullOrder(orderId) {
  const order = db.prepare(`
    SELECT o.*, b.name as branch_name, b.address as branch_address, b.phone as branch_phone
    FROM orders o
    LEFT JOIN branches b ON o.branch_id = b.id
    WHERE o.id = ?
  `).get(orderId);

  if (!order) return null;

  const items = db.prepare(`
    SELECT oi.*, p.image_url, p.calories
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `).all(orderId);

  return { ...order, items };
}

// SSE Real-time Order Stream Endpoint
router.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE Stream connected' })}\n\n`);

  addClient(res);

  // Keep connection alive with periodic heartbeat ping
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

// GET all orders (supports status, branch, and search filters)
router.get('/', (req, res) => {
  try {
    const { status, branch_id, search } = req.query;
    let query = `
      SELECT o.*, b.name as branch_name, b.phone as branch_phone
      FROM orders o
      LEFT JOIN branches b ON o.branch_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND o.status = ?`;
      params.push(status);
    }

    if (branch_id) {
      query += ` AND o.branch_id = ?`;
      params.push(branch_id);
    }

    if (search) {
      query += ` AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY o.id DESC`;

    const orders = db.prepare(query).all(...params);

    // Attach items to each order
    const getItems = db.prepare(`
      SELECT oi.*, p.image_url
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `);

    const result = orders.map(order => ({
      ...order,
      items: getItems.all(order.id)
    }));

    res.json({
      success: true,
      count: result.length,
      data: result.map((order) => formatOrderResponse(req, order))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single order by ID or order_number
router.get('/:idOrNumber', (req, res) => {
  try {
    const param = req.params.idOrNumber;
    let order;

    if (!isNaN(param)) {
      order = getFullOrder(parseInt(param, 10));
    } else {
      const row = db.prepare('SELECT id FROM orders WHERE order_number = ?').get(param.toUpperCase());
      if (row) {
        order = getFullOrder(row.id);
      }
    }

    if (!order) {
      return res.status(404).json({ success: false, error: 'Buyurtma topilmadi' });
    }

    res.json({ success: true, data: formatOrderResponse(req, order) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create a new order (from Web Storefront or iOS SwiftUI app)
router.post('/', (req, res) => {
  try {
    const {
      customer_name,
      customer_phone,
      customer_address,
      branch_id,
      items,
      payment_method = 'cash',
      notes = ''
    } = req.body;

    if (!customer_name || !customer_phone || !customer_address || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Mijoz ismi, telefon raqami, manzili va buyurtma mahsulotlari kiritilishi shart.'
      });
    }

    // Determine branch (default to first active branch if not provided)
    let finalBranchId = branch_id;
    if (!finalBranchId) {
      const firstBranch = db.prepare('SELECT id FROM branches WHERE is_active = 1 LIMIT 1').get();
      finalBranchId = firstBranch ? firstBranch.id : null;
    }

    // Calculate items and total price, and find max preparation time
    let subtotal = 0;
    let maxPrepTime = 15;
    const validatedItems = [];

    const getProduct = db.prepare('SELECT * FROM products WHERE id = ?');

    for (const item of items) {
      const product = getProduct.get(item.product_id);
      if (!product) {
        return res.status(400).json({
          success: false,
          error: `Mahsulot topilmadi (ID: ${item.product_id})`
        });
      }

      if (product.is_available !== 1) {
        return res.status(400).json({
          success: false,
          error: `"${product.name}" mahsuloti ayni paytda tugagan.`
        });
      }

      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const itemTotal = product.price * qty;
      subtotal += itemTotal;

      if (product.prep_time_min > maxPrepTime) {
        maxPrepTime = product.prep_time_min;
      }

      validatedItems.push({
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity: qty,
        total_price: itemTotal
      });
    }

    const deliveryFee = 15000;
    const totalPrice = subtotal + deliveryFee;
    const prepTimeMin = maxPrepTime + 5; // buffer for packing and preparation
    const now = new Date();
    const estimatedReadyAt = new Date(now.getTime() + prepTimeMin * 60000).toISOString();

    // Generate unique order number (e.g. FD-1043)
    const lastOrder = db.prepare('SELECT id FROM orders ORDER BY id DESC LIMIT 1').get();
    const nextSeq = lastOrder ? 1040 + lastOrder.id + 1 : 1045;
    const orderNumber = `FD-${nextSeq}`;

    // Insert order in a transaction
    const insertTransaction = db.transaction(() => {
      const orderInsert = db.prepare(`
        INSERT INTO orders (
          order_number, customer_name, customer_phone, customer_address,
          branch_id, status, total_price, delivery_fee, payment_method,
          prep_time_min, estimated_ready_at, notes, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `).run(
        orderNumber,
        customer_name,
        customer_phone,
        customer_address,
        finalBranchId,
        totalPrice,
        deliveryFee,
        payment_method,
        prepTimeMin,
        estimatedReadyAt,
        notes
      );

      const newOrderId = orderInsert.lastInsertRowid;

      const itemInsert = db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, price, quantity, total_price)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const vItem of validatedItems) {
        itemInsert.run(
          newOrderId,
          vItem.product_id,
          vItem.product_name,
          vItem.price,
          vItem.quantity,
          vItem.total_price
        );
      }

      return newOrderId;
    });

    const newOrderId = insertTransaction();
    const createdOrder = getFullOrder(newOrderId);

    // Broadcast real-time event to all connected admin panels & clients
    broadcastEvent('order_created', createdOrder);

    // Send Telegram notification if configured in .env
    sendTelegramNotification(createdOrder).catch(e => console.warn('Telegram async notification error:', e));

    res.status(201).json({
      success: true,
      message: 'Buyurtma muvaffaqiyatli qabul qilindi!',
      data: formatOrderResponse(req, createdOrder)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH change order status (Kanban drag-and-drop or status buttons)
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'preparing', 'on_the_way', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Noto'g'ri holat. Ruxsat etilgan holatlar: ${validStatuses.join(', ')}`
      });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Buyurtma topilmadi' });
    }

    // If transitioning to preparing, update estimated ready time from current moment
    let estimatedReadyAt = order.estimated_ready_at;
    if (status === 'preparing' && order.status === 'pending') {
      const now = new Date();
      estimatedReadyAt = new Date(now.getTime() + order.prep_time_min * 60000).toISOString();
    }

    db.prepare(`
      UPDATE orders
      SET status = ?, estimated_ready_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, estimatedReadyAt, req.params.id);

    const updatedOrder = getFullOrder(req.params.id);

    // Broadcast SSE update
    broadcastEvent('order_status_changed', {
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.order_number,
      status: updatedOrder.status,
      order: updatedOrder
    });

    res.json({
      success: true,
      message: `Buyurtma holati "${status}" ga o'zgartirildi`,
      data: formatOrderResponse(req, updatedOrder)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH update preparation time (dynamic timer adjustment)
router.patch('/:id/prep-time', (req, res) => {
  try {
    const { prep_time_min } = req.body;
    const minutes = parseInt(prep_time_min, 10);

    if (isNaN(minutes) || minutes <= 0) {
      return res.status(400).json({ success: false, error: 'Vaqt musbat son bo\'lishi kerak (minutda).' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Buyurtma topilmadi' });
    }

    // Recalculate estimated ready time from now
    const now = new Date();
    const newEstimatedReady = new Date(now.getTime() + minutes * 60000).toISOString();

    db.prepare(`
      UPDATE orders
      SET prep_time_min = ?, estimated_ready_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(minutes, newEstimatedReady, req.params.id);

    const updatedOrder = getFullOrder(req.params.id);

    // Broadcast SSE update
    broadcastEvent('order_prep_time_updated', {
      orderId: updatedOrder.id,
      prep_time_min: minutes,
      estimated_ready_at: newEstimatedReady,
      order: updatedOrder
    });

    res.json({
      success: true,
      message: `Tayyorlanish vaqti ${minutes} minutga yangilandi`,
      data: formatOrderResponse(req, updatedOrder)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE order
router.delete('/:id', (req, res) => {
  try {
    const order = db.prepare('SELECT id FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Buyurtma topilmadi' });
    }

    db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);

    broadcastEvent('order_deleted', { orderId: parseInt(req.params.id, 10) });

    res.json({ success: true, message: 'Buyurtma o\'chirildi', id: req.params.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

