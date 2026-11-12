import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  Clock, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  ChevronRight, 
  ArrowLeft, 
  Flame, 
  Bike, 
  CreditCard, 
  Receipt,
  Sparkles,
  Search,
  Check,
  AlertCircle
} from 'lucide-react';
import { formatSum } from './KanbanBoard';

export default function CustomerStorefront({ products, categories, branches, activeOrders, onOrderCreated }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Active tracked order (if customer just placed an order or tracks one)
  const [trackedOrder, setTrackedOrder] = useState(null);

  // Checkout form fields
  const [customerName, setCustomerName] = useState('Akmal Yusupov');
  const [customerPhone, setCustomerPhone] = useState('+998 90 987 65 43');
  const [customerAddress, setCustomerAddress] = useState('Toshkent sh., Yunusobod 7-mavze, 12-uy');
  const [selectedBranchId, setSelectedBranchId] = useState(branches.length > 0 ? branches[0].id : 1);
  const [paymentMethod, setPaymentMethod] = useState('payme');
  const [notes, setNotes] = useState('Iltimos qo\'shimcha salfetka soling');
  const [submitting, setSubmitting] = useState(false);

  // Sync tracked order with real-time updates from parent (via SSE)
  useEffect(() => {
    if (trackedOrder) {
      const updated = activeOrders.find(o => o.id === trackedOrder.id || o.order_number === trackedOrder.order_number);
      if (updated) {
        setTrackedOrder(updated);
      }
    }
  }, [activeOrders]);

  // Cart operations
  const addToCart = (product) => {
    if (product.is_available === 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prev, { product, quantity: 1 }];
      }
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const deliveryFee = cart.length > 0 ? 15000 : 0;
  const cartTotal = cartSubtotal + deliveryFee;

  // Filter products for client view
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'all' || String(p.category_id) === String(selectedCategory);
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Submit order
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setSubmitting(true);
    try {
      const payload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        branch_id: selectedBranchId,
        payment_method: paymentMethod,
        notes: notes,
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity
        }))
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setTrackedOrder(data.data);
        setCart([]);
        setIsCartOpen(false);
        if (onOrderCreated) {
          onOrderCreated(data.data);
        }
      } else {
        alert(data.error || 'Buyurtma berishda xatolik yuz berdi.');
      }
    } catch (err) {
      alert('Server bilan bog\'lanishda xatolik: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // If viewing tracked order, render the Live Customer Tracking View
  if (trackedOrder) {
    const steps = [
      { key: 'pending', label: 'Qabul qilindi', desc: 'Buyurtmangiz tizimda qayd etildi', icon: Clock },
      { key: 'preparing', label: 'Tayyorlanmoqda', desc: 'Oshxonada taom tayyorlanmoqda', icon: Flame },
      { key: 'on_the_way', label: 'Kuryer yo\'lda', desc: 'Issiq holda siz tomon oshiqmoqda', icon: Bike },
      { key: 'delivered', label: 'Yetkazildi', desc: 'Yoqimli ishtaha tilaymiz!', icon: CheckCircle2 }
    ];

    const getStepIndex = (status) => {
      switch (status) {
        case 'pending': return 0;
        case 'preparing': return 1;
        case 'on_the_way': return 2;
        case 'delivered': return 3;
        default: return 0;
      }
    };

    const currentStepIndex = getStepIndex(trackedOrder.status);
    const isCancelled = trackedOrder.status === 'cancelled';

    return (
      <div className="max-w-2xl mx-auto space-y-6 py-4 animate-in fade-in duration-200">
        <button
          onClick={() => setTrackedOrder(null)}
          className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white px-3.5 py-2 rounded-xl border border-gray-200 shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Menyuga qaytish</span>
        </button>

        {/* Live Order Tracker Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Jonli Buyurtma Nazorati</span>
              <h2 className="text-2xl font-extrabold text-gray-900 mt-0.5">
                Buyurtma #{trackedOrder.order_number}
              </h2>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-red-100 text-[#E31E24]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E31E24]"></span>
                </span>
                Jonli SSE Aloqa
              </span>
              <p className="text-[11px] text-gray-400 mt-1 font-mono">{trackedOrder.created_at}</p>
            </div>
          </div>

          {/* Stepper Progress */}
          {!isCancelled ? (
            <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
              {steps.map((st, idx) => {
                const Icon = st.icon;
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div key={st.key} className="relative flex items-start gap-4">
                    {/* Step Icon */}
                    <div className={`-ml-6 w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-white z-10 transition-colors ${
                      isPassed
                        ? 'bg-[#E31E24] text-white shadow-md shadow-red-200'
                        : 'bg-gray-200 text-gray-400'
                    } ${isCurrent ? 'scale-110 pulse-glow' : ''}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Step Details */}
                    <div>
                      <h4 className={`text-sm font-bold ${isPassed ? 'text-gray-900' : 'text-gray-400'}`}>
                        {st.label}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">{st.desc}</p>
                      {isCurrent && trackedOrder.estimated_ready_at && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Taxminiy tayyor bo'lish: {new Date(trackedOrder.estimated_ready_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center">
              <p className="text-sm font-bold text-rose-800">Ushbu buyurtma bekor qilingan</p>
              <p className="text-xs text-rose-600 mt-1">Savollar bo'lsa call-markazimizga qo'ng'iroq qiling: +998 71 200 22 11</p>
            </div>
          )}

          {/* Customer & Delivery Information */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2 border border-gray-100 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Mijoz:</span>
              <span className="font-bold text-gray-900">{trackedOrder.customer_name}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Telefon:</span>
              <span className="font-bold text-gray-900">{trackedOrder.customer_phone}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Yetkazish manzili:</span>
              <span className="font-bold text-gray-900 text-right max-w-xs">{trackedOrder.customer_address}</span>
            </div>
            <div className="flex justify-between text-gray-600 pt-2 border-t border-gray-200">
              <span>To'lov usuli:</span>
              <span className="font-bold uppercase text-gray-900">{trackedOrder.payment_method}</span>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-2 pt-2 border-t">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Buyurtma tarkibi:</h4>
            {trackedOrder.items && trackedOrder.items.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1">
                <span className="font-medium text-gray-800">
                  <span className="font-bold text-gray-900">{it.quantity}x</span> {it.product_name}
                </span>
                <span className="font-bold text-gray-900 font-mono">{formatSum(it.total_price)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-xs text-gray-500 py-1">
              <span>Yetkazib berish xizmati:</span>
              <span className="font-mono">{formatSum(trackedOrder.delivery_fee)}</span>
            </div>
            <div className="flex items-center justify-between text-base font-extrabold text-[#E31E24] pt-2 border-t">
              <span>Jami:</span>
              <span>{formatSum(trackedOrder.total_price)}</span>
            </div>
          </div>

          {/* Call center button */}
          <div className="pt-2">
            <a
              href="tel:+998712002211"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition-colors shadow-xs"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>Call-markaz: +998 71 200 22 11</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feedup Banner matching https://feedup.uz/en */}
      <div className="relative rounded-3xl bg-linear-to-r from-[#E31E24] via-[#EB3323] to-[#FF4500] text-white p-6 sm:p-8 overflow-hidden shadow-lg shadow-red-500/10">
        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 backdrop-blur-xs text-xs font-extrabold text-amber-300">
            <Sparkles className="w-3.5 h-3.5" /> Tez va mazali yetkazib berish
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            FeedUp — Har bir luqmada haqiqiy lazzat!
          </h1>
          <p className="text-xs sm:text-sm text-red-100 font-medium">
            Go'shtli lavashlar, shirali burgerlar va yangi qovurilgan kombolar 30 daqiqa ichida eshigingiz oldida.
          </p>
          <div className="flex items-center gap-4 pt-1 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-300" />
              <span>20 - 35 daqiqa</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-300" />
              <span>Toshkent bo'ylab 50+ filial</span>
            </div>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
      </div>

      {/* Category Pills & Search */}
      <div className="sticky top-28 z-30 bg-gray-50/95 backdrop-blur-sm py-2 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-[#E31E24] text-white shadow-md shadow-red-200'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Barcha taomlar
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  String(selectedCategory) === String(c.id)
                    ? 'bg-[#E31E24] text-white shadow-md shadow-red-200'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span>{c.icon}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Taom qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#E31E24]/30"
            />
          </div>
        </div>
      </div>

      {/* Dishes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredProducts.map((p) => {
          const isAvailable = p.is_available === 1;
          const cartItem = cart.find(ci => ci.product.id === p.id);

          return (
            <div
              key={p.id}
              className={`bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group ${
                !isAvailable ? 'opacity-60 bg-gray-50' : ''
              }`}
            >
              <div>
                {/* Food Image */}
                <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-white/90 backdrop-blur-xs rounded-full text-[11px] font-extrabold text-gray-800 shadow-xs">
                      {p.category_icon || '🍽️'} {p.category_name}
                    </span>
                  </div>

                  {!isAvailable && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center">
                      <span className="px-3 py-1.5 rounded-full bg-rose-600 text-white font-extrabold text-xs">
                        Ayni paytda tugagan
                      </span>
                    </div>
                  )}

                  {isAvailable && p.old_price && Number(p.old_price) > Number(p.price) && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-full bg-[#E31E24] text-white text-[11px] font-black shadow-sm">
                        -{Math.round(((p.old_price - p.price) / p.old_price) * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 space-y-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-gray-900 group-hover:text-[#E31E24] transition-colors line-clamp-1">
                    {p.name}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {p.description || 'FeedUp maxsus taomi'}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-1">
                    <span className="flex items-center gap-1 font-medium">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      {p.calories} kcal
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      {p.prep_time_min} daq
                    </span>
                  </div>
                </div>
              </div>

              {/* Price & Add to Cart button */}
              <div className="p-4 pt-0 flex items-center justify-between">
                <div className="flex flex-col">
                  {p.old_price && Number(p.old_price) > Number(p.price) && (
                    <span className="text-xs text-gray-400 line-through font-medium leading-tight">
                      {formatSum(p.old_price)}
                    </span>
                  )}
                  <span className="text-base sm:text-lg font-black text-[#E31E24] leading-tight">
                    {formatSum(p.price)}
                  </span>
                </div>

                {isAvailable ? (
                  cartItem ? (
                    <div className="flex items-center gap-1 bg-red-50 p-1 rounded-xl border border-red-200">
                      <button
                        onClick={() => updateQuantity(p.id, -1)}
                        className="w-7 h-7 rounded-lg bg-white text-[#E31E24] flex items-center justify-center hover:bg-gray-100 shadow-2xs"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-black text-[#E31E24]">{cartItem.quantity}</span>
                      <button
                        onClick={() => updateQuantity(p.id, 1)}
                        className="w-7 h-7 rounded-lg bg-[#E31E24] text-white flex items-center justify-center hover:bg-[#C91A1F] shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(p)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E31E24] hover:bg-[#C91A1F] text-white text-xs font-extrabold transition-all shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Savatga</span>
                    </button>
                  )
                ) : (
                  <span className="text-xs text-gray-400 font-bold">Mavjud emas</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Cart Button (when cart has items) */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-6 right-6 z-40 animate-in slide-in-from-bottom duration-200">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#E31E24] text-white font-extrabold shadow-2xl shadow-red-500/40 hover:bg-[#C91A1F] transition-all hover:scale-105"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 bg-white text-[#E31E24] text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            </div>
            <span>Savatni ko'rish</span>
            <span className="pl-2 border-l border-white/30 font-mono text-sm">{formatSum(cartTotal)}</span>
          </button>
        </div>
      )}

      {/* Cart & Checkout Slide-Over Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full flex flex-col justify-between p-6 shadow-2xl animate-in slide-in-from-right duration-200 overflow-y-auto">
            {/* Drawer Header */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#E31E24]" />
                  <h3 className="font-extrabold text-lg text-gray-900">Savat ({cart.length} taom)</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>

              {/* Cart Items List */}
              <div className="divide-y divide-gray-100 my-4 max-h-56 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <p className="text-xs text-gray-400 py-6 text-center">Savatingiz bo'sh</p>
                ) : (
                  cart.map(({ product, quantity }) => (
                    <div key={product.id} className="py-3 flex items-center justify-between gap-3">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-12 h-12 rounded-xl object-cover bg-gray-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-extrabold text-gray-900 truncate">{product.name}</h4>
                        <p className="text-[11px] font-bold text-[#E31E24]">{formatSum(product.price)}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(product.id, -1)}
                          className="w-6 h-6 rounded-md bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-bold hover:bg-gray-200"
                        >
                          -
                        </button>
                        <span className="w-5 text-center text-xs font-bold">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, 1)}
                          className="w-6 h-6 rounded-md bg-[#E31E24] text-white flex items-center justify-center text-xs font-bold hover:bg-[#C91A1F]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Checkout Form */}
            {cart.length > 0 && (
              <form onSubmit={handleCheckout} className="space-y-4 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Yetkazib berish ma'lumotlari</h4>
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Ismingiz</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E31E24]/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Telefon raqamingiz</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E31E24]/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Yetkazish manzili</label>
                  <input
                    type="text"
                    required
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E31E24]/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Eng yaqin filial</label>
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(parseInt(e.target.value, 10))}
                      className="w-full px-2 py-2 text-xs rounded-xl border border-gray-300 bg-white"
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">To'lov turi</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-2 py-2 text-xs rounded-xl border border-gray-300 bg-white"
                    >
                      <option value="payme">Payme</option>
                      <option value="click">Click</option>
                      <option value="cash">Naqd pul</option>
                      <option value="terminal">Karta (Terminal)</option>
                    </select>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="bg-gray-50 rounded-2xl p-3.5 space-y-1.5 border border-gray-100 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Taomlar summasi:</span>
                    <span className="font-mono">{formatSum(cartSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Yetkazib berish (Standart):</span>
                    <span className="font-mono">{formatSum(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-[#E31E24] pt-2 border-t border-gray-200">
                    <span>Jami to'lov:</span>
                    <span className="font-mono">{formatSum(cartTotal)}</span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-2xl bg-[#E31E24] hover:bg-[#C91A1F] text-white font-extrabold text-sm transition-all shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <span>Buyurtma yuborilmoqda...</span>
                  ) : (
                    <>
                      <span>Buyurtma berish</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

