const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'data', 'feedup.db');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new Database(dbPath);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize database schema
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT DEFAULT '🍽️',
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      old_price REAL DEFAULT NULL,
      calories INTEGER DEFAULT 0,
      prep_time_min INTEGER DEFAULT 15,
      image_url TEXT NOT NULL,
      is_available INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      opening_hours TEXT DEFAULT '09:00 - 03:00',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_address TEXT NOT NULL,
      branch_id INTEGER REFERENCES branches(id),
      status TEXT NOT NULL DEFAULT 'pending',
      total_price REAL NOT NULL,
      delivery_fee REAL DEFAULT 15000,
      payment_method TEXT DEFAULT 'cash',
      prep_time_min INTEGER DEFAULT 20,
      estimated_ready_at DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      product_name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      total_price REAL NOT NULL
    );
  `);

  // Ensure old_price column exists in pre-existing databases
  const productCols = db.prepare('PRAGMA table_info(products)').all();
  if (!productCols.some((col) => col.name === 'old_price')) {
    db.exec('ALTER TABLE products ADD COLUMN old_price REAL DEFAULT NULL;');
  }

  // Check if categories already seeded
  const count = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  if (count === 0 || process.argv.includes('--force')) {
    if (process.argv.includes('--force')) {
      db.exec('DELETE FROM order_items; DELETE FROM orders; DELETE FROM products; DELETE FROM branches; DELETE FROM categories;');
    }
    seedDatabase();
  }
}

function seedDatabase() {
  console.log('Seeding initial FeedUp data...');

  const insertCategory = db.prepare(`
    INSERT INTO categories (name, slug, icon, sort_order)
    VALUES (@name, @slug, @icon, @sort_order)
  `);

  const categories = [
    { name: 'Lavashlar', slug: 'lavash', icon: '🌯', sort_order: 1 },
    { name: 'Burgerlar', slug: 'burger', icon: '🍔', sort_order: 2 },
    { name: 'Kombo To\'plamlar', slug: 'combo', icon: '🍟', sort_order: 3 },
    { name: 'Xot-Dog & Sendvichlar', slug: 'hotdog', icon: '🌭', sort_order: 4 },
    { name: 'Qarsildoq Gazaklar', slug: 'snacks', icon: '🍗', sort_order: 5 },
    { name: 'Ichimliklar', slug: 'drinks', icon: '🥤', sort_order: 6 },
    { name: 'Souslar', slug: 'sauces', icon: '🥫', sort_order: 7 }
  ];

  const catMap = {};
  for (const cat of categories) {
    const res = insertCategory.run(cat);
    catMap[cat.slug] = res.lastInsertRowid;
  }

  // Insert Branches
  const insertBranch = db.prepare(`
    INSERT INTO branches (name, address, phone, latitude, longitude, opening_hours, is_active)
    VALUES (@name, @address, @phone, @latitude, @longitude, @opening_hours, @is_active)
  `);

  const branches = [
    { name: 'FeedUp Chilonzor (Farhod)', address: 'Chilonzor tumani, Farhod bozori ro\'parasi, Gagarina 12', phone: '+998 71 200 22 11', latitude: 41.2721, longitude: 69.2014, opening_hours: '09:00 - 03:00', is_active: 1 },
    { name: 'FeedUp Yunusobod (Krug)', address: 'Yunusobod tumani, 11-mavze, Amir Temur ko\'chasi', phone: '+998 71 200 22 11', latitude: 41.3654, longitude: 69.2891, opening_hours: '09:00 - 03:00', is_active: 1 },
    { name: 'FeedUp Beruniy', address: 'Olmazor tumani, Beruniy metro bekati, Shifokorlar ko\'chasi', phone: '+998 71 200 22 11', latitude: 41.3452, longitude: 69.2064, opening_hours: '09:00 - 02:00', is_active: 1 },
    { name: 'FeedUp Tashkent City', address: 'Shayxontohur tumani, Tashkent City Park Boulevard', phone: '+998 71 200 22 11', latitude: 41.3115, longitude: 69.2483, opening_hours: '10:00 - 03:00', is_active: 1 },
    { name: 'FeedUp Algoritm', address: 'Uchtepa tumani, Qovunchi ko\'chasi 45-uy', phone: '+998 71 200 22 11', latitude: 41.2612, longitude: 69.1724, opening_hours: '09:00 - 02:30', is_active: 1 }
  ];

  const branchIds = [];
  for (const b of branches) {
    const res = insertBranch.run(b);
    branchIds.push(res.lastInsertRowid);
  }

  // Insert Products
  const insertProduct = db.prepare(`
    INSERT INTO products (category_id, name, description, price, old_price, calories, prep_time_min, image_url, is_available)
    VALUES (@category_id, @name, @description, @price, @old_price, @calories, @prep_time_min, @image_url, @is_available)
  `);

  const products = [
    // Lavashlar
    {
      category_id: catMap['lavash'],
      name: 'FeedUp Go\'shtli Lavash (Standart)',
      description: 'Shirali mol go\'shti, qarsildoq chipslar, yangi bodring va pomidor, maxsus FeedUp sousi va yupqa xamirda o\'ralgan klassik lazzat.',
      price: 38000,
      old_price: 44000,
      calories: 680,
      prep_time_min: 12,
      image_url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80',
      is_available: 1
    },
    {
      category_id: catMap['lavash'],
      name: 'Pishloqli Go\'shtli Lavash',
      description: 'Mol go\'shti va eritilgan mozzarella hamda cheddar pishloqlari bilan to\'yintirilgan unutilmas ta\'m.',
      price: 43000,
      calories: 780,
      prep_time_min: 14,
      image_url: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=800&q=80',
      is_available: 1
    },
    {
      category_id: catMap['lavash'],
      name: 'Tovuqli Lavash (Chicken Lavash)',
      description: 'Ziravorlar bilan qovurilgan yumshoq tovuq filesi, yangi sabzavotlar va sarimsoqli sous.',
      price: 34000,
      calories: 590,
      prep_time_min: 10,
      image_url: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=800&q=80',
      is_available: 1
    },
    {
      category_id: catMap['lavash'],
      name: 'Mini Go\'shtli Lavash',
      description: 'Yengil tamaddi uchun mo\'ljallangan ixcham hacmdagi go\'shtli lavash.',
      price: 29000,
      calories: 450,
      prep_time_min: 8,
      image_url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
      is_available: 1
    },

    // Burgerlar
    {
      category_id: catMap['burger'],
      name: 'XL BBQ Burger',
      description: 'Katta shirali mol go\'shti kotleti, qovurilgan piyoz halqalari, BBQ sousi, eritilgan pishloq va barra aysberg barglari.',
      price: 45000,
      old_price: 52000,
      calories: 820,
      prep_time_min: 15,
      image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      is_available: 1
    },
    {
      category_id: catMap['burger'],
      name: 'Chicken Zinger Burger',
      description: 'Qarsildoq qilib qovurilgan o\'tkir tovuq filesi, aysberg salati va mayin mayonezli sous bilan yumshoq bulochkada.',
      price: 36000,
      calories: 630,
      prep_time_min: 12,
      image_url: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=800&q=80',
      is_available: 1
    },
    {
      category_id: catMap['burger'],
      name: 'Double Cheese Burger',
      description: 'Ikkita mol go\'shti kotleti, ikki qavat eritilgan cheddar pishlog\'i, tuzlangan bodring va maxsus sous.',
      price: 49000,
      calories: 910,
      prep_time_min: 15,
      image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80',
      is_available: 1
    },

    // Kombo to'plamlar
    {
      category_id: catMap['combo'],
      name: 'Klassik Kombo',
      description: 'FeedUp Standart Go\'shtli Lavash + Oltin rangli Fri kartoshkasi + 0.5L Muzdek Coca-Cola.',
      price: 55000,
      old_price: 65000,
      calories: 1050,
      prep_time_min: 15,
      image_url: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80',
      is_available: 1
    },
    {
      category_id: catMap['combo'],
      name: 'To\'yimli Kombo',
      description: 'XL BBQ Burger + 3 dona qarsildoq qanotcha + Fri kartoshkasi + 0.5L Coca-Cola.',
      price: 68000,
      calories: 1350,
      prep_time_min: 18,
      image_url: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=800&q=80',
      is_available: 1
    },
    {
      category_id: catMap['combo'],
      name: 'Kids Kombo (Bolalar uchun)',
      description: 'Mini burger yoki chikin nuggets + kichik fri + mevali sharbat + syurpriz sovg\'a!',
      price: 39000,
      calories: 620,
      prep_time_min: 12,
      image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
      is_available: 1
    },

    // Xot-Dog & Sendvich
    {
      category_id: catMap['hotdog'],
      name: 'Daniyacha Katta Xot-Dog',
      description: 'Qovurilgan sersuv sosiska, qarsildoq piyoz, tuzlangan bodring, xantal va pomidor sousi.',
      price: 25000,
      calories: 480,
      prep_time_min: 8,
      image_url: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&w=800&q=80',
      is_available: 1
    },
    {
      category_id: catMap['hotdog'],
      name: 'FeedUp Klub Sendvich',
      description: 'Uch qavatli tushgan tost noni, tovuq filesi, pishloq, tuxum, bodring va aysberg.',
      price: 37000,
      calories: 590,
      prep_time_min: 14,
      image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
      is_available: 1
    },

    // Qarsildoq Gazaklar
    {
      category_id: catMap['snacks'],
      name: 'Qarsildoq Tovuq Qanotchalari (6 dona)',
      description: 'Oltinrang karsillovchi qobiqda pishirilgan achchiq-shirin tovuq qanotchalari.',
      price: 36000,
      calories: 540,
      prep_time_min: 12,
      image_url: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80',
      is_available: 1
    },
    {
      category_id: catMap['snacks'],
      name: 'Oltinrang Kartoshka Fri (Katta)',
      description: 'Tashqarisi qarsildoq, ichi mayin kartoshka bo\'lakchalari dengiz tuzi bilan.',
      price: 19000,
      calories: 390,
      prep_time_min: 7,
      image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',
      is_available: 1
    },
    {
      category_id: catMap['snacks'],
      name: 'Qishloqcha Kartoshka (Derevenskiy)',
      description: 'Ziravorlar va bibariya bilan pechda pishirilgan to\'yimli kartoshka tillari.',
      price: 21000,
      calories: 420,
      prep_time_min: 9,
      image_url: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=800&q=80',
      is_available: 1
    },
    {
      category_id: catMap['snacks'],
      name: 'Chikin Nuggets (9 dona)',
      description: '100% mayin tovuq go\'shtidan tayyorlangan karsillovchi nagetslar.',
      price: 28000,
      calories: 460,
      prep_time_min: 8,
      image_url: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80',
      is_available: 1
    },

    // Ichimliklar
    {
      category_id: catMap['drinks'],
      name: 'Coca-Cola 0.5L (Muzdek)',
      description: 'Muzdek tetiklashtiruvchi klassik gazlangan ichimlik.',
      price: 10000,
      calories: 140,
      prep_time_min: 2,
      image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
      is_available: 1
    },
    {
      category_id: catMap['drinks'],
      name: 'FeedUp Muzdek Ayis-ti Limon (0.5L)',
      description: 'Tabiiy qora choy ekstrakti va yangi limon sharbati bilan tayyorlangan salqin ichimlik.',
      price: 12000,
      calories: 85,
      prep_time_min: 2,
      image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80',
      is_available: 1
    },
    {
      category_id: catMap['drinks'],
      name: 'Qulupnayli Mojito 0.4L',
      description: 'Yalpiz, laym, qulupnay mevalari va muz bilan aralashtirilgan tetiklantiruvchi kokteyl.',
      price: 16000,
      calories: 110,
      prep_time_min: 4,
      image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
      is_available: 1
    },

    // Souslar
    {
      category_id: catMap['sauces'],
      name: 'Maxsus FeedUp Pishloqli Sous',
      description: 'Issiq va quyuq eritilgan pishloq ta\'midagi sous.',
      price: 5000,
      calories: 95,
      prep_time_min: 1,
      image_url: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=800&q=80',
      is_available: 1
    },
    {
      category_id: catMap['sauces'],
      name: 'Barbequ (BBQ) Dudlangan Sous',
      description: 'Dudlangan shirin-achchiq amerika uslubidagi sous.',
      price: 5000,
      calories: 70,
      prep_time_min: 1,
      image_url: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?auto=format&fit=crop&w=800&q=80',
      is_available: 1
    }
  ];

  const productIds = [];
  for (const p of products) {
    const res = insertProduct.run({ old_price: null, ...p });
    productIds.push(res.lastInsertRowid);
  }

  // Insert Sample Orders for Live Kanban
  const insertOrder = db.prepare(`
    INSERT INTO orders (
      order_number, customer_name, customer_phone, customer_address,
      branch_id, status, total_price, delivery_fee, payment_method,
      prep_time_min, estimated_ready_at, notes, created_at, updated_at
    ) VALUES (
      @order_number, @customer_name, @customer_phone, @customer_address,
      @branch_id, @status, @total_price, @delivery_fee, @payment_method,
      @prep_time_min, @estimated_ready_at, @notes, @created_at, @updated_at
    )
  `);

  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_name, price, quantity, total_price)
    VALUES (@order_id, @product_id, @product_name, @price, @quantity, @total_price)
  `);

  const now = new Date();
  const formatTime = (minutesAgo) => new Date(now.getTime() - minutesAgo * 60000).toISOString();
  const formatFuture = (minutesAhead) => new Date(now.getTime() + minutesAhead * 60000).toISOString();

  const sampleOrders = [
    {
      order_number: 'FD-1041',
      customer_name: 'Jasur Aliyev',
      customer_phone: '+998 90 123 45 67',
      customer_address: 'Chilonzor 7-mavze, 14-uy, 28-xonadon',
      branch_id: branchIds[0],
      status: 'pending',
      total_price: 93000,
      delivery_fee: 15000,
      payment_method: 'payme',
      prep_time_min: 20,
      estimated_ready_at: formatFuture(20),
      notes: 'Iltimos lavashga mayonez solinmasin, eshik qo\'ng\'irog\'i ishlamaydi.',
      created_at: formatTime(2),
      updated_at: formatTime(2),
      items: [
        { product_id: productIds[0], product_name: 'FeedUp Go\'shtli Lavash (Standart)', price: 38000, quantity: 2, total_price: 76000 },
        { product_id: productIds[15], product_name: 'Coca-Cola 0.5L (Muzdek)', price: 10000, quantity: 1, total_price: 10000 },
        { product_id: productIds[18], product_name: 'Maxsus FeedUp Pishloqli Sous', price: 5000, quantity: 1, total_price: 5000 }
      ]
    },
    {
      order_number: 'FD-1040',
      customer_name: 'Malika Rustamova',
      customer_phone: '+998 97 765 43 21',
      customer_address: 'Yunusobod 4-mavze, 3-bino, 12-xonadon',
      branch_id: branchIds[1],
      status: 'preparing',
      total_price: 123000,
      delivery_fee: 15000,
      payment_method: 'click',
      prep_time_min: 15,
      estimated_ready_at: formatFuture(10),
      notes: 'Issiq yetib kelsin iltimos.',
      created_at: formatTime(8),
      updated_at: formatTime(5),
      items: [
        { product_id: productIds[7], product_name: 'Klassik Kombo', price: 55000, quantity: 1, total_price: 55000 },
        { product_id: productIds[4], product_name: 'XL BBQ Burger', price: 45000, quantity: 1, total_price: 45000 },
        { product_id: productIds[13], product_name: 'Kartoshka Fri (Katta)', price: 19000, quantity: 1, total_price: 19000 }
      ]
    },
    {
      order_number: 'FD-1039',
      customer_name: 'Bobur Mirzayev',
      customer_phone: '+998 93 555 77 88',
      customer_address: 'Beruniy ko\'chasi, 22-uy, 4-qavat',
      branch_id: branchIds[2],
      status: 'on_the_way',
      total_price: 68000,
      delivery_fee: 15000,
      payment_method: 'cash',
      prep_time_min: 25,
      estimated_ready_at: formatTime(5),
      notes: 'Kuryer yetib kelgach telefon qilsin.',
      created_at: formatTime(28),
      updated_at: formatTime(10),
      items: [
        { product_id: productIds[8], product_name: 'To\'yimli Kombo', price: 68000, quantity: 1, total_price: 68000 }
      ]
    },
    {
      order_number: 'FD-1038',
      customer_name: 'Dilnoza Karimova',
      customer_phone: '+998 99 811 22 33',
      customer_address: 'Tashkent City Boulevard, 5-blok, 88-kvartira',
      branch_id: branchIds[3],
      status: 'delivered',
      total_price: 82000,
      delivery_fee: 15000,
      payment_method: 'payme',
      prep_time_min: 15,
      estimated_ready_at: formatTime(40),
      notes: 'Rahmat, o\'z vaqtida yetib keldi.',
      created_at: formatTime(65),
      updated_at: formatTime(35),
      items: [
        { product_id: productIds[1], product_name: 'Pishloqli Go\'shtli Lavash', price: 43000, quantity: 1, total_price: 43000 },
        { product_id: productIds[5], product_name: 'Chicken Zinger Burger', price: 36000, quantity: 1, total_price: 36000 }
      ]
    }
  ];

  for (const o of sampleOrders) {
    const res = insertOrder.run({
      order_number: o.order_number,
      customer_name: o.customer_name,
      customer_phone: o.customer_phone,
      customer_address: o.customer_address,
      branch_id: o.branch_id,
      status: o.status,
      total_price: o.total_price,
      delivery_fee: o.delivery_fee,
      payment_method: o.payment_method,
      prep_time_min: o.prep_time_min,
      estimated_ready_at: o.estimated_ready_at,
      notes: o.notes,
      created_at: o.created_at,
      updated_at: o.updated_at
    });

    const orderId = res.lastInsertRowid;
    for (const it of o.items) {
      insertOrderItem.run({
        order_id: orderId,
        product_id: it.product_id,
        product_name: it.product_name,
        price: it.price,
        quantity: it.quantity,
        total_price: it.total_price
      });
    }
  }

  console.log('Seed completed successfully!');
}

initDatabase();

module.exports = db;

