const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `${cleanBase}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
  if (allowedMime.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Faqat rasm formatidagi fayllar qabul qilinadi (JPG, PNG, WEBP, GIF).'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter
});

// Single file upload endpoint (Drag & Drop or form picker)
router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Hech qanday rasm fayli yuborilmadi.' });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const relativeUrl = `/uploads/${req.file.filename}`;
    const fullUrl = `${protocol}://${host}${relativeUrl}`;

    res.status(201).json({
      success: true,
      message: 'Rasm muvaffaqiyatli yuklandi',
      url: relativeUrl,
      fullUrl: fullUrl,
      apiUrl: `${protocol}://${host}/api/upload/${req.file.filename}`,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Download / serve uploaded image via API path (/api/upload/:filename)
router.get('/:filename', (req, res) => {
  const safeName = path.basename(req.params.filename || '');
  if (!safeName) {
    return res.status(400).json({ success: false, error: 'Fayl nomi noto\'g\'ri.' });
  }

  const filePath = path.join(uploadDir, safeName);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return res.status(404).json({ success: false, error: 'Rasm topilmadi.' });
  }

  res.setHeader('Cache-Control', 'public, max-age=86400');
  return res.sendFile(filePath);
});

module.exports = router;

