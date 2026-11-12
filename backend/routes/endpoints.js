const express = require('express');
const router = express.Router();

const API_CATALOG = [
  {
    group: 'categories',
    title: 'Kategoriyalar API',
    endpoints: [
      {
        method: 'GET',
        path: '/api/categories',
        purpose: 'Barcha kategoriyalar va ulardagi taomlar sonini olish',
        query: [],
        body: null,
        returns: '{ success: true, count: number, data: Category[] }'
      },
      {
        method: 'GET',
        path: '/api/categories/:id',
        purpose: 'Bitta kategoriya tafsilotlarini olish',
        query: [],
        body: null,
        returns: '{ success: true, data: Category }'
      },
      {
        method: 'POST',
        path: '/api/categories',
        purpose: 'Yangi kategoriya yaratish',
        query: [],
        body: { name: 'string (required)', slug: 'string?', icon: 'string?', sort_order: 'number?' },
        returns: '{ success: true, message: string, data: Category }'
      },
      {
        method: 'PUT',
        path: '/api/categories/:id',
        purpose: 'Mavjud kategoriyani tahrirlash',
        query: [],
        body: { name: 'string?', slug: 'string?', icon: 'string?', sort_order: 'number?' },
        returns: '{ success: true, message: string, data: Category }'
      },
      {
        method: 'DELETE',
        path: '/api/categories/:id',
        purpose: 'Kategoriyani o\'chirish',
        query: [],
        body: null,
        returns: '{ success: true, message: string, id: string }'
      }
    ]
  },
  {
    group: 'products',
    title: 'Mahsulotlar (Menyu) API',
    endpoints: [
      {
        method: 'GET',
        path: '/api/products',
        purpose: 'Taomlar ro\'yxatini olish (kategoriya, mavjudlik va qidiruv filtrlari bilan)',
        query: ['category_id', 'is_available', 'search'],
        body: null,
        returns: '{ success: true, count: number, data: Product[] }'
      },
      {
        method: 'GET',
        path: '/api/products/:id',
        purpose: 'Bitta taom tafsilotlarini olish',
        query: [],
        body: null,
        returns: '{ success: true, data: Product }'
      },
      {
        method: 'POST',
        path: '/api/products',
        purpose: 'Yangi taom qo\'shish',
        query: [],
        body: {
          category_id: 'number (required)',
          name: 'string (required)',
          description: 'string?',
          price: 'number (required)',
          old_price: 'number | null?',
          calories: 'number?',
          prep_time_min: 'number?',
          image_url: 'string?',
          is_available: '0 | 1'
        },
        returns: '{ success: true, message: string, data: Product }'
      },
      {
        method: 'PUT',
        path: '/api/products/:id',
        purpose: 'Taom ma\'lumotlarini yangilash',
        query: [],
        body: { category_id: 'number?', name: 'string?', description: 'string?', price: 'number?', old_price: 'number | null?', calories: 'number?', prep_time_min: 'number?', image_url: 'string?', is_available: '0 | 1' },
        returns: '{ success: true, message: string, data: Product }'
      },
      {
        method: 'PATCH',
        path: '/api/products/:id/toggle-availability',
        purpose: 'Taom mavjudlik holatini tezkor almashtirish (Mavjud <-> Tugagan)',
        query: [],
        body: null,
        returns: '{ success: true, message: string, is_available: 0 | 1 }'
      },
      {
        method: 'DELETE',
        path: '/api/products/:id',
        purpose: 'Bitta taomni o\'chirish (tarixiy buyurtmalarni saqlagan holda)',
        query: [],
        body: null,
        returns: '{ success: true, message: string, id: string }'
      },
      {
        method: 'POST',
        path: '/api/products/bulk-delete',
        purpose: 'Bir nechta tanlangan taomlarni bittada o\'chirish',
        query: [],
        body: { ids: 'number[] (required)' },
        returns: '{ success: true, message: string, count: number, deletedIds: number[] }'
      }
    ]
  },
  {
    group: 'upload',
    title: 'Rasm Yuklash va Yuklab Olish API',
    endpoints: [
      {
        method: 'POST',
        path: '/api/upload',
        purpose: 'Taom rasmini serverga yuklash (multipart/form-data, field: image)',
        query: [],
        body: { image: 'File (JPG/PNG/WEBP/GIF, max 10MB)' },
        returns: '{ success: true, message: string, url: string, fullUrl: string, apiUrl: string, filename: string, size: number, mimetype: string }'
      },
      {
        method: 'GET',
        path: '/api/upload/:filename',
        purpose: 'Yuklangan rasmni fayl nomi orqali yuklab olish (SwiftUI / mobil ilova uchun)',
        query: [],
        body: null,
        returns: 'Binary image stream (image/jpeg, image/png, image/webp, ...)'
      }
    ]
  },
  {
    group: 'orders',
    title: 'Buyurtmalar va Monitoring API',
    endpoints: [
      {
        method: 'GET',
        path: '/api/orders',
        purpose: 'Buyurtmalar ro\'yxatini olish',
        query: ['status', 'branch_id', 'search'],
        body: null,
        returns: '{ success: true, count: number, data: Order[] }'
      },
      {
        method: 'GET',
        path: '/api/orders/:idOrNumber',
        purpose: 'ID yoki FD-XXXX raqami bo\'yicha buyurtma holatini ko\'rish',
        query: [],
        body: null,
        returns: '{ success: true, data: Order }'
      },
      {
        method: 'POST',
        path: '/api/orders',
        purpose: 'Yangi buyurtma yaratish (Web yoki SwiftUI ilovadan)',
        query: [],
        body: {
          customer_name: 'string (required)',
          customer_phone: 'string (required)',
          customer_address: 'string (required)',
          branch_id: 'number?',
          payment_method: 'cash | payme | click | terminal',
          notes: 'string?',
          items: '[{ product_id: number, quantity: number }]'
        },
        returns: '{ success: true, message: string, data: Order }'
      },
      {
        method: 'PATCH',
        path: '/api/orders/:id/status',
        purpose: 'Buyurtma holatini o\'zgartirish',
        query: [],
        body: { status: 'pending | preparing | on_the_way | delivered | cancelled' },
        returns: '{ success: true, message: string, data: Order }'
      },
      {
        method: 'PATCH',
        path: '/api/orders/:id/prep-time',
        purpose: 'Tayyorlanish vaqtini (minutda) dinamik o\'zgartirish',
        query: [],
        body: { prep_time_min: 'number (required)' },
        returns: '{ success: true, message: string, data: Order }'
      },
      {
        method: 'DELETE',
        path: '/api/orders/:id',
        purpose: 'Buyurtmani o\'chirish',
        query: [],
        body: null,
        returns: '{ success: true, message: string, id: string }'
      },
      {
        method: 'GET',
        path: '/api/orders/stream',
        purpose: 'Server-Sent Events (SSE) real-time voqealar oqimi (order_created, order_status_changed, order_prep_time_updated, order_deleted)',
        query: [],
        body: null,
        returns: 'text/event-stream'
      }
    ]
  },
  {
    group: 'branches',
    title: 'Filiallar API',
    endpoints: [
      {
        method: 'GET',
        path: '/api/branches',
        purpose: 'Filiallar ro\'yxatini olish',
        query: ['is_active'],
        body: null,
        returns: '{ success: true, count: number, data: Branch[] }'
      },
      {
        method: 'GET',
        path: '/api/branches/:id',
        purpose: 'Bitta filial tafsilotlarini olish',
        query: [],
        body: null,
        returns: '{ success: true, data: Branch }'
      },
      {
        method: 'POST',
        path: '/api/branches',
        purpose: 'Yangi filial qo\'shish',
        query: [],
        body: { name: 'string', address: 'string', phone: 'string', latitude: 'number?', longitude: 'number?', opening_hours: 'string?', is_active: '0 | 1' },
        returns: '{ success: true, message: string, data: Branch }'
      },
      {
        method: 'PUT',
        path: '/api/branches/:id',
        purpose: 'Filial ma\'lumotlarini tahrirlash',
        query: [],
        body: { name: 'string?', address: 'string?', phone: 'string?', latitude: 'number?', longitude: 'number?', opening_hours: 'string?', is_active: '0 | 1' },
        returns: '{ success: true, message: string, data: Branch }'
      },
      {
        method: 'DELETE',
        path: '/api/branches/:id',
        purpose: 'Filialni o\'chirish',
        query: [],
        body: null,
        returns: '{ success: true, message: string, id: string }'
      }
    ]
  },
  {
    group: 'stats',
    title: 'Statistika va Hisobot API',
    endpoints: [
      {
        method: 'GET',
        path: '/api/stats',
        purpose: 'Dashboard statistikasi (jami tushum, buyurtmalar, TOP-5 taomlar)',
        query: [],
        body: null,
        returns: '{ success: true, data: StatsData }'
      },
      {
        method: 'GET',
        path: '/api/stats/shift-report',
        purpose: 'Kunlik smena yopish xulosasi (Z-Otchyot)',
        query: [],
        body: null,
        returns: '{ success: true, data: ShiftReportData }'
      }
    ]
  },
  {
    group: 'system',
    title: 'Tizim API',
    endpoints: [
      {
        method: 'GET',
        path: '/api/health',
        purpose: 'Server salomatligi va holatini tekshirish',
        query: [],
        body: null,
        returns: '{ status: "healthy", timestamp: string, service: string, version: string }'
      },
      {
        method: 'GET',
        path: '/api/endpoints',
        purpose: 'Barcha mavjud REST API endpointlar katalogini olish',
        query: [],
        body: null,
        returns: '{ success: true, baseUrl: string, totalEndpoints: number, groups: EndpointGroup[] }'
      }
    ]
  }
];

// GET all API endpoints catalog
router.get('/', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const totalEndpoints = API_CATALOG.reduce((sum, g) => sum + g.endpoints.length, 0);

  res.json({
    success: true,
    baseUrl,
    apiBaseUrl: `${baseUrl}/api`,
    totalEndpoints,
    groups: API_CATALOG
  });
});

// GET endpoints for a specific group (e.g., /api/endpoints/products)
router.get('/:group', (req, res) => {
  const group = API_CATALOG.find(g => g.group === req.params.group.toLowerCase());
  if (!group) {
    return res.status(404).json({
      success: false,
      error: `Guruh topilmadi. Mavjud guruhlar: ${API_CATALOG.map(g => g.group).join(', ')}`
    });
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.json({
    success: true,
    baseUrl,
    apiBaseUrl: `${baseUrl}/api`,
    data: group
  });
});

module.exports = router;

