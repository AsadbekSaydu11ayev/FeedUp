# 📱 FeedUp iOS (SwiftUI) Mobil Ilovasi

Ushbu jildda FeedUp Fast Food yetkazib berish xizmati uchun **100% toza SwiftUI (iOS 16+)** ilovasi kodlari joylashgan.

---

## 📂 Loyiha Strukturasi

```
ios/FeedUp/
├── Models/
│   └── Models.swift           # Codable modellari (Product, Category, Order, Branch, OrderStatus)
├── Services/
│   ├── APIEndpoint.swift      # Barcha REST endpointlar routeri (path, method, query, body)
│   └── FeedUpAPIService.swift # async/await URLSession REST mijoz (Backend bilan to'liq integratsiya)
├── ViewModels/
│   ├── CartManager.swift      # Savat holati, soni va hisob-kitob (@MainActor ObservableObject)
│   └── MenuViewModel.swift    # Taomlar va kategoriyalarni filtrlash va qidirish
├── Views/
│   ├── RootView.swift         # Asosiy TabBar (Menyu, Savat, Filiallar)
│   ├── HomeMenuView.swift     # Bosh menyu, kategoriya karuseli, qidiruv va AsyncImage kartalari
│   ├── CartView.swift         # Savat ro'yxati, to'lov turi va Checkout formasi
│   ├── OrderTrackingView.swift# Jonli buyurtma monitoringi (stepper, status va taymer)
│   └── BranchListView.swift   # Filiallar ro'yxati, manzillar va qo'ng'iroq qilish
└── FeedUpApp.swift            # SwiftUI @main ilova kirish nuqtasi
```

---

## 🚀 Xcode'da Ishga Tushirish

1. **Yangi Xcode loyihasi oching:**
   - Xcode ➔ `File` ➔ `New` ➔ `Project...`
   - **iOS** ➔ **App** ➔ `Next`
   - Product Name: **`FeedUp`**
   - Interface: **SwiftUI**, Language: **Swift**
2. **Fayllarni loyihaga qo'shing:**
   - Ushbu `ios/FeedUp/` ichidagi barcha fayllarni Xcode Navigator paneliga sudrab tashlang (Drag & Drop).
3. **Backend IP manzilini sozlash:**
   - `ios/FeedUp/Services/FeedUpAPIService.swift` faylida:
     ```swift
     // Agar Mac'dagi Simulator'da tekshirayotgan bo'lsangiz:
     public var baseURL = "http://localhost:5001/api"

     // Agar jismoniy iPhone'da tekshirayotgan bo'lsangiz (Mac va iPhone bir xil Wi-Fi'da bo'lishi kerak):
     public var baseURL = "http://192.168.1.X:5001/api"
     ```
4. **Ishga tushirish:**
   - `Cmd + R` tugmasini bosing va ilovani Simulator'da yoki iPhone'da sinab ko'ring!

