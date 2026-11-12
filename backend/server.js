const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Initialize database
require('./database');

const categoriesRouter = require('./routes/categories');
const productsRouter = require('./routes/products');
const branchesRouter = require('./routes/branches');
const ordersRouter = require('./routes/orders');
const uploadRouter = require('./routes/upload');
const statsRouter = require('./routes/stats');
const endpointsRouter = require('./routes/endpoints');

const app = express();
const PORT = process.env.PORT || 5001;

// Trust reverse proxy headers (e.g. ngrok / Railway / Nginx)
app.set('trust proxy', 1);

// Middlewares
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static file serving for uploaded images
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));
app.use('/api/uploads', express.static(uploadsPath));

// API routes
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/branches', branchesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/stats', statsRouter);
app.use('/api/endpoints', endpointsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'FeedUp Fast Food Backend API',
    version: '1.0.0'
  });
});

// Serve frontend static files if built
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/(api|uploads)).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  // Root welcome & API info fallback if frontend is not built
  app.get('/', (req, res) => {
    res.json({
      message: 'Xush kelibsiz! FeedUp Fast Food yetkazib berish xizmati REST API serveri faoliyat yuritmoqda.',
      endpoints: {
        categories: '/api/categories',
        products: '/api/products',
        orders: '/api/orders',
        orders_stream: '/api/orders/stream (SSE real-time)',
        branches: '/api/branches',
        upload: '/api/upload (POST multipart/form-data)',
        stats: '/api/stats',
        endpoints: '/api/endpoints',
        health: '/api/health'
      }
    });
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Serverda ichki xatolik yuz berdi'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 FeedUp API Server ishga tushdi: http://localhost:${PORT}`);
  console.log(`🍔 Mahsulotlar: http://localhost:${PORT}/api/products`);
  console.log(`📦 Buyurtmalar: http://localhost:${PORT}/api/orders`);
  console.log(`⚡ Real-time SSE: http://localhost:${PORT}/api/orders/stream`);
  console.log(`📁 Statik fayllar: http://localhost:${PORT}/uploads`);
  console.log(`=======================================================`);
});

