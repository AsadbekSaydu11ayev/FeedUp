const express = require('express');
const router = express.Router();
const db = require('../database');

// GET dashboard statistics
router.get('/', (req, res) => {
  try {
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;

    const totalRevenue = db.prepare(`
      SELECT COALESCE(SUM(total_price), 0) as total
      FROM orders
      WHERE status != 'cancelled'
    `).get().total;

    const statusCounts = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
    `).all();

    const statusMap = {
      pending: 0,
      preparing: 0,
      on_the_way: 0,
      delivered: 0,
      cancelled: 0
    };
    for (const sc of statusCounts) {
      statusMap[sc.status] = sc.count;
    }

    const activeOrders = statusMap.pending + statusMap.preparing + statusMap.on_the_way;

    // Top selling items
    const topProducts = db.prepare(`
      SELECT oi.product_name, SUM(oi.quantity) as total_sold, SUM(oi.total_price) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY oi.product_name
      ORDER BY total_sold DESC
      LIMIT 5
    `).all();

    // Products and branches count
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    const totalBranches = db.prepare('SELECT COUNT(*) as count FROM branches WHERE is_active = 1').get().count;

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        activeOrders,
        statusBreakdown: statusMap,
        topProducts,
        totalProducts,
        totalBranches
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET shift report (Z-Report / Smena yopish xulosasi)
router.get('/shift-report', (req, res) => {
  try {
    // Payment method breakdown
    const paymentBreakdown = db.prepare(`
      SELECT 
        payment_method, 
        COUNT(*) as order_count, 
        COALESCE(SUM(total_price), 0) as total_amount
      FROM orders
      WHERE status != 'cancelled'
      GROUP BY payment_method
    `).all();

    // Delivered orders total vs cancelled
    const summary = db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(CASE WHEN status = 'delivered' THEN total_price ELSE 0 END), 0) as delivered_revenue,
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_price ELSE 0 END), 0) as net_revenue,
        COALESCE(AVG(CASE WHEN status != 'cancelled' THEN total_price ELSE NULL END), 0) as avg_check,
        COALESCE(AVG(prep_time_min), 0) as avg_prep_time,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count
      FROM orders
    `).get();

    // Branch performance
    const branchBreakdown = db.prepare(`
      SELECT 
        b.name as branch_name,
        COUNT(o.id) as orders_count,
        COALESCE(SUM(o.total_price), 0) as total_revenue
      FROM branches b
      LEFT JOIN orders o ON o.branch_id = b.id AND o.status != 'cancelled'
      GROUP BY b.id
    `).all();

    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        summary,
        paymentBreakdown,
        branchBreakdown
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
