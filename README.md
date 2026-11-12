# 🍔 FeedUp — Fast Food Yetkazib Berish Backend & Admin Panel Tizimi

Ushbu loyiha [Feedup.uz](https://feedup.uz/en) uslubidagi zamonaviy Fast Food yetkazib berish xizmati uchun ishlab chiqilgan to'liq stekli (Full-Stack) platformadir. Tizim yuqori unumdorlikka ega **Node.js / Express** backend, **SQLite (better-sqlite3)** relyatsion ma'lumotlar bazasi, **Server-Sent Events (SSE)** real-vaqt yangilanishlari hamda zamonaviy **React 19 + Tailwind CSS** Admin Panel va Mijoz interfeysidan iborat. Kelajakda tizimga **iOS (SwiftUI)** mobil ilovasi to'g'ridan-to'g'ri ulanadi.

---

## 📌 Asosiy Imkoniyatlar va Arxitektura

### 1. Ma'lumotlar Bazasi va Fayllar (SQLite & Local Storage)
- **Doimiy saqlash:** SQLite relyatsion bazasida barcha `categories`, `products`, `branches`, `orders` va `order_items` saqlanadi. (WAL-mode orqali yuqori o'qish/yozish tezligi).
- **Rasm yuklash (Uploads):** Drag & drop orqali yuklangan barcha taom rasmlari serverning `uploads/` jildida saqlanadi va statik tarzda `/uploads/...` orqali uzatiladi.
- **Initial Data:** FeedUp O'zbekiston filiallari (Chilonzor, Yunusobod, Beruniy, Tashkent City, Algoritm) va real taomlari (Go'shtli lavash, BBQ burger, Kombolar, Qanotchalar, Fri, Ayis-ti va h.k.) avtomatik seed qilingan.

### 2. Admin Panel (React + Tailwind CSS)
- **Mahsulotlarni boshqarish (CRUD):**
  - Yangi taom qo'shish, tahrirlash, o'chirish.
  - Taom narxi, kaloriyasi (kcal), tayyorlanish vaqti (minutda), kategoriyasi va tavsifini belgilash.
  - **Mavjudlik holati (Mavjud / Tugagan):** Har bir taom kartasida yoki jadvalda birgina tugma (toggle) orqali darhol holatni o'zgartirish.
- **Drag-and-Drop rasm yuklash:**
  - Taom qo'shish yoki tahrirlash formasida rasmni dropzone maydoniga sudrab tashlash (Drag & Drop).
  - Avtomatik rasm preview, progress indikator va `/api/upload` ga yuklanib, URL maydonining avtomatik to'ldirilishi.
- **Jonli Buyurtmalar Boshqaruvi (Real-time Kanban Board):**
  - Holatlar bo'yicha dinamik ustunlar:
    `pending` (Kutilmoqda) ➔ `preparing` (Tayyorlanmoqda) ➔ `on_the_way` (Yo‘lda) ➔ `delivered` (Yetkazildi) ➔ `cancelled` (Bekor qilindi)
  - **Dinamik hisoblagich (Timer):** Buyurtma tushgan vaqtdan o'tgan daqiqalar va tayyor bo'lishigacha qolgan vaqt (CountDown) real vaqtda ko'rsatiladi.
  - **Tayyorlanish vaqtini dinamik sozlash:** Oshxona xodimlari bitta tugma bilan vaqtni uzaytirishi (`+5 daq`, `+10 daq` yoki custom) mumkin.
  - **Ovozli signal (Ding chime):** Yangi buyurtma kelib tushganda brauzerda avtomatik ohang yangraydi (Web Audio API).
- **Kategoriyalar va Filiallar:**
  - Filiallar manzili, ish vaqtlari va telefonlarini to'liq boshqarish.
- **Statistika Dashboard:**
  - Jami tushum, faol buyurtmalar soni, statuslar ulushi va eng ko'p sotilgan Top taomlar reytingi.

### 3. Mijoz Interfeysi va Buyurtma Monitoringi (Live Demo)
- Mijozlar kategoriyalar bo'yicha taomlarni ko'rib, savatga qo'shishi va buyurtma berishi mumkin.
- **Real vaqt monitoringi (Live Tracking):** Buyurtma berilgach, mijoz ekranda qadamma-qadam holat (`Qabul qilindi` ➔ `Oshxonada` ➔ `Yo'lda` ➔ `Yetkazildi`) va taxminiy tayyor bo'lish vaqtini **SSE orqali hech qanday sahifani yangilamasdan** ko'rib turadi. Admin Kanban'da buyurtmani surishi bilan mijoz ekrani darhol jonli yangilanadi.

### 4. iOS SwiftUI Integratsiyasiga To'liq Tayyorlik
- REST API barcha ma'lumotlarni toza JSON ko'rinishida taqdim etadi.
- Admin paneldagi **"iOS SwiftUI API"** tugmasi orqali to'liq tayyor Swift kodlari (`FeedUpModels.swift`, `FeedUpAPIService.swift`, `OrderTrackingView.swift`) taqdim etilgan.

---

## 🚀 Loyihani Ishga Tushirish

### 1. Barcha bog'liqliklarni o'rnatish
```bash
# Backend bog'liqliklari
cd backend && npm install

# Frontend bog'liqliklari
cd ../frontend && npm install
cd ..
```

### 2. Loyihani ishga tushirish

#### Variant A: Yagona buyruq orqali (Production rejimida to'liq tizim)
```bash
npm run build:frontend
npm start
```
Browserda oching: **`http://localhost:5001`** (Admin Panel, Mijoz interfeysi va REST API birga ishlaydi).

#### Variant B: Dasturchi (Development) rejimida
Terminal 1 (Backend API):
```bash
npm run dev:backend
# Ishga tushadi: http://localhost:5001
```

Terminal 2 (Frontend Vite Hot-Reload):
```bash
npm run dev:frontend
# Ishga tushadi: http://localhost:3000
```

---

## 📡 REST API Endpointlari

| Metod | Endpoint | Tavsif |
|---|---|---|
| `GET` | `/api/categories` | Barcha kategoriyalar va ulardagi taomlar soni |
| `POST` | `/api/categories` | Yangi kategoriya qo'shish |
| `PUT` | `/api/categories/:id` | Kategoriyani tahrirlash |
| `DELETE` | `/api/categories/:id` | Kategoriyani o'chirish |
| `GET` | `/api/products` | Barcha taomlar (filter: `category_id`, `is_available`, `search`) |
| `GET` | `/api/products/:id` | Bitta taom tafsilotlari |
| `POST` | `/api/products` | Yangi taom qo'shish |
| `PUT` | `/api/products/:id` | Taomni yangilash |
| `PATCH` | `/api/products/:id/toggle-availability` | Taom mavjudlik holatini almashtirish |
| `DELETE` | `/api/products/:id` | Taomni o'chirish |
| `POST` | `/api/upload` | Drag-and-drop rasm yuklash (`multipart/form-data`) |
| `GET` | `/api/orders` | Buyurtmalar ro'yxati (filter: `status`, `branch_id`, `search`) |
| `GET` | `/api/orders/:id` | Buyurtma tafsilotlari (ID yoki `FD-XXXX` raqam bo'yicha) |
| `POST` | `/api/orders` | Yangi buyurtma yaratish (Web yoki SwiftUI mobil) |
| `PATCH` | `/api/orders/:id/status` | Buyurtma holatini yangilash (`pending`, `preparing`, h.k.) |
| `PATCH` | `/api/orders/:id/prep-time` | Tayyorlanish vaqtini (minut) dinamik o'zgartirish |
| `GET` | `/api/orders/stream` | Server-Sent Events (SSE) jonli xabarlar oqimi |
| `GET` | `/api/branches` | FeedUp filiallari ro'yxati |
| `GET` | `/api/stats` | Dashboard statistikasi |
| `GET` | `/api/health` | Server salomatlik holati |

---

## 📱 iOS SwiftUI Swift Namunasi

SwiftUI ilovangizda buyurtma berish:

```swift
let order = try await FeedUpAPIService.shared.createOrder(
    customerName: "Jasur Aliyev",
    phone: "+998 90 123 45 67",
    address: "Chilonzor 7-mavze, 14-uy",
    branchId: 1,
    paymentMethod: "payme",
    notes: "Eshik kodi: 1234",
    cartItems: [(productId: 1, quantity: 2)]
)
```

Real vaqtda holatni tekshirish:
```swift
let tracked = try await FeedUpAPIService.shared.trackOrder(orderNumberOrId: "FD-1045")
print("Hozirgi holat: \\(tracked.status.title)")
```

