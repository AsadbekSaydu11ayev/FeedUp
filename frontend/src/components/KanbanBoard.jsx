import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  ChefHat, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  PlusCircle, 
  ChevronRight, 
  Search, 
  Filter, 
  DollarSign, 
  Receipt, 
  Timer, 
  RefreshCw, 
  Printer, 
  LayoutGrid, 
  Columns3, 
  List, 
  Flame, 
  ArrowRight 
} from 'lucide-react';

// Format Uzbek sum (e.g., 38,000 so'm)
export const formatSum = (amount) => {
  return new Intl.NumberFormat('uz-UZ').format(amount || 0) + " so'm";
};

// Component for Countdown and Elapsed Timer
function OrderTimerDisplay({ createdAt, estimatedReadyAt, status }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isOverdue, setIsOverdue] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const created = new Date(createdAt).getTime();
      const elapsed = Math.max(0, Math.floor((now - created) / 60000));
      setElapsedMinutes(elapsed);

      if (!estimatedReadyAt || status === 'delivered' || status === 'cancelled') {
        setTimeLeft(null);
        return;
      }

      const target = new Date(estimatedReadyAt).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setIsOverdue(true);
        const overdueMin = Math.floor(Math.abs(diff) / 60000);
        const overdueSec = Math.floor((Math.abs(diff) % 60000) / 1000);
        setTimeLeft(`-${overdueMin}:${overdueSec < 10 ? '0' : ''}${overdueSec}`);
      } else {
        setIsOverdue(false);
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [createdAt, estimatedReadyAt, status]);

  if (status === 'delivered') {
    return (
      <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
        <CheckCircle2 className="w-4 h-4" />
        <span>Muvaffaqiyatli yetkazildi ({elapsedMinutes} daqiqada)</span>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
        <XCircle className="w-4 h-4" />
        <span>Buyurtma bekor qilingan</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
      <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
        <Clock className="w-3.5 h-3.5 text-gray-400" />
        <span>Tushgan: <strong className="text-gray-900">{elapsedMinutes} daqiqa oldin</strong></span>
      </div>

      {timeLeft && (
        <div
          className={`flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-lg shadow-2xs ${
            isOverdue
              ? 'bg-rose-100 text-rose-800 animate-pulse border border-rose-300'
              : 'bg-amber-100 text-amber-900 border border-amber-300'
          }`}
          title={isOverdue ? 'Vaqt yetib keldi yoki kechikmoqda!' : 'Tayyor bo\'lishiga qolgan vaqt'}
        >
          <Timer className="w-3.5 h-3.5" />
          <span>{isOverdue ? `Kechikmoqda: ${timeLeft}` : `Tayyor bo'lishi: ${timeLeft}`}</span>
        </div>
      )}
    </div>
  );
}

// Thermal Receipt Modal
function ReceiptModal({ order, onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-gray-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Printable Area */}
        <div id="thermal-receipt" className="p-4 bg-white font-mono text-xs text-gray-900 border border-dashed border-gray-300 rounded-2xl space-y-3">
          <div className="text-center space-y-1 border-b pb-3">
            <h2 className="text-xl font-black tracking-widest text-[#E31E24]">FEEDUP</h2>
            <p className="text-[10px] text-gray-500 font-sans">Fast Food & Delivery Service</p>
            <p className="text-[11px] font-bold text-gray-700">{order.branch_name || 'FeedUp Filiali'}</p>
            <p className="text-[10px] text-gray-500">Tel: +998 71 200 22 11</p>
          </div>

          <div className="space-y-1 text-[11px] border-b pb-2">
            <div className="flex justify-between">
              <span>BUYURTMA:</span>
              <strong className="text-sm">#{order.order_number}</strong>
            </div>
            <div className="flex justify-between">
              <span>SANA:</span>
              <span>{order.created_at}</span>
            </div>
            <div className="flex justify-between">
              <span>TO'LOV TURI:</span>
              <span className="uppercase font-bold">{order.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span>MIJOZ:</span>
              <span>{order.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span>TEL:</span>
              <span>{order.customer_phone}</span>
            </div>
            <div className="pt-1">
              <span className="text-[10px] text-gray-500">MANZIL:</span>
              <p className="font-sans font-bold leading-tight">{order.customer_address}</p>
            </div>
            {order.notes && (
              <div className="pt-1 bg-amber-50 p-1.5 rounded text-[10px] text-amber-900 italic font-sans">
                Izoh: "{order.notes}"
              </div>
            )}
          </div>

          {/* Items */}
          <div className="space-y-1.5 border-b pb-2">
            <div className="text-[10px] font-bold text-gray-500">TAOMLAR:</div>
            {order.items && order.items.map((it, idx) => (
              <div key={idx} className="flex justify-between items-start text-[11px]">
                <div className="pr-2 font-sans font-medium">
                  <strong>{it.quantity}x</strong> {it.product_name}
                </div>
                <div className="font-mono whitespace-nowrap font-bold">
                  {formatSum(it.total_price)}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 text-[11px] pt-1">
            <div className="flex justify-between">
              <span>Yetkazib berish:</span>
              <span>{formatSum(order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between text-base font-black pt-1 border-t border-dashed">
              <span>JAMI:</span>
              <span className="text-[#E31E24]">{formatSum(order.total_price)}</span>
            </div>
          </div>

          <div className="text-center pt-3 text-[10px] text-gray-400 font-sans">
            <p>Xaridingiz uchun rahmat!</p>
            <p>www.feedup.uz</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Yopish
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-white bg-[#E31E24] hover:bg-[#C91A1F] rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Chop etish</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Single Order Card (Used in both Grid and Kanban views)
function OrderCard({ 
  order, 
  onUpdateStatus, 
  onUpdatePrepTime, 
  onDeleteOrder, 
  onPrintReceipt 
}) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'Kutilmoqda', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock };
      case 'preparing':
        return { label: 'Tayyorlanmoqda', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: ChefHat };
      case 'on_the_way':
        return { label: 'Yo\'lda', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Truck };
      case 'delivered':
        return { label: 'Yetkazildi', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2 };
      case 'cancelled':
        return { label: 'Bekor qilindi', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: XCircle };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Clock };
    }
  };

  const statusBadge = getStatusBadge(order.status);
  const StatusIcon = statusBadge.icon;

  const getNextAction = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'Tayyorlashni boshlash', nextStatus: 'preparing', color: 'bg-blue-600 hover:bg-blue-700 text-white', icon: ChefHat };
      case 'preparing':
        return { label: 'Kuryerga berildi', nextStatus: 'on_the_way', color: 'bg-purple-600 hover:bg-purple-700 text-white', icon: Truck };
      case 'on_the_way':
        return { label: 'Yetkazildi deb belgilash', nextStatus: 'delivered', color: 'bg-emerald-600 hover:bg-emerald-700 text-white', icon: CheckCircle2 };
      default:
        return null;
    }
  };

  const nextAction = getNextAction(order.status);

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between gap-4">
      {/* 1. Header Row */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="font-black text-lg text-[#E31E24] tracking-wide">
            #{order.order_number}
          </span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadge.color}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{statusBadge.label}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700">
            {order.payment_method}
          </span>
          <button
            onClick={() => onPrintReceipt(order)}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Kassa chekini chiqarish"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Customer & Address (Spacious and Vertical) */}
      <div className="space-y-2 bg-gray-50/70 p-3.5 rounded-xl border border-gray-100 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
            <User className="w-4 h-4 text-gray-400 shrink-0" />
            <span>{order.customer_name}</span>
          </div>

          <div className="flex items-center gap-1.5 text-gray-700">
            <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <a href={`tel:${order.customer_phone}`} className="hover:text-[#E31E24] font-semibold font-mono">
              {order.customer_phone}
            </a>
          </div>
        </div>

        <div className="flex items-start gap-2 text-gray-700 pt-1 border-t border-gray-200/60">
          <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <span className="text-gray-500 text-[11px] block">Yetkazish manzili:</span>
            <p className="font-semibold text-gray-900 text-xs leading-relaxed">{order.customer_address}</p>
          </div>
        </div>

        {order.branch_name && (
          <div className="text-[11px] text-gray-500 font-medium pt-1">
            Filial: <strong className="text-gray-800">{order.branch_name}</strong>
          </div>
        )}

        {order.notes && (
          <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
            💬 <span className="font-bold">Mijoz izohi:</span> "{order.notes}"
          </div>
        )}
      </div>

      {/* 3. Ordered Food Items List (Fully readable, no truncation!) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
          <span>Buyurtma tarkibi ({order.items ? order.items.length : 0} taom):</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden text-xs">
          {order.items && order.items.map((item, idx) => (
            <div key={idx} className="p-2.5 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-6 h-6 rounded-md bg-red-100 text-[#E31E24] font-black text-xs flex items-center justify-center shrink-0">
                  {item.quantity}x
                </span>
                <span className="font-semibold text-gray-900 truncate">
                  {item.product_name}
                </span>
              </div>
              <span className="font-bold text-gray-800 font-mono shrink-0">
                {formatSum(item.total_price)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Timer & Dynamic Prep Time Adjustment */}
      <div className="space-y-2">
        <OrderTimerDisplay
          createdAt={order.created_at}
          estimatedReadyAt={order.estimated_ready_at}
          status={order.status}
        />

        {/* Dynamic Kitchen Prep Time extension buttons */}
        {['pending', 'preparing'].includes(order.status) && (
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs">
            <span className="font-bold text-amber-900 text-xs">
              Vaqt: {order.prep_time_min} daq
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onUpdatePrepTime(order.id, (order.prep_time_min || 15) + 5)}
                className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 font-extrabold text-[11px] hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
                title="+5 daqiqa qo'shish"
              >
                +5 daq
              </button>
              <button
                onClick={() => onUpdatePrepTime(order.id, (order.prep_time_min || 15) + 10)}
                className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 font-extrabold text-[11px] hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
                title="+10 daqiqa qo'shish"
              >
                +10 daq
              </button>
              <button
                onClick={() => {
                  const custom = prompt('Tayyorlanish vaqtini kiriting (minutda):', order.prep_time_min);
                  if (custom && !isNaN(custom)) {
                    onUpdatePrepTime(order.id, parseInt(custom, 10));
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 font-extrabold text-[11px] hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
                title="Boshqa vaqt belgilash"
              >
                ✏️
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Bottom: Total Sum and Actions */}
      <div className="pt-3 border-t border-gray-100 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500">Jami to'lov:</span>
          <span className="text-lg font-black text-[#E31E24]">
            {formatSum(order.total_price)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {nextAction && (
            <button
              onClick={() => onUpdateStatus(order.id, nextAction.nextStatus)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer ${nextAction.color}`}
            >
              <span>{nextAction.label}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {order.status !== 'cancelled' && order.status !== 'delivered' && (
            <button
              onClick={() => {
                if (confirm('Ushbu buyurtmani bekor qilmoqchimisiz?')) {
                  onUpdateStatus(order.id, 'cancelled');
                }
              }}
              className="px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
              title="Buyurtmani bekor qilish"
            >
              Bekor qilish
            </button>
          )}

          <button
            onClick={() => {
              if (confirm('Buyurtmani butunlay o\'chirmoqchimisiz?')) {
                onDeleteOrder(order.id);
              }
            }}
            className="p-2.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            title="O'chirish"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

export default function KanbanBoard({ 
  orders, 
  onUpdateStatus, 
  onUpdatePrepTime, 
  onDeleteOrder, 
  onRefresh, 
  loading 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState('active'); // 'active' | 'all' | 'pending' | 'preparing' | 'on_the_way' | 'delivered' | 'cancelled'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' (Spacious vertical grid) | 'kanban' (Horizontal columns) | 'table' (List)
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [receiptOrder, setReceiptOrder] = useState(null);

  // Status Definitions
  const statusTabs = [
    { id: 'active', label: '⚡ Faol buyurtmalar', count: orders.filter(o => ['pending', 'preparing', 'on_the_way'].includes(o.status)).length, badgeColor: 'bg-red-500 text-white' },
    { id: 'all', label: 'Barchasi', count: orders.length, badgeColor: 'bg-gray-800 text-white' },
    { id: 'pending', label: '🟡 Kutilmoqda', count: orders.filter(o => o.status === 'pending').length, badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'preparing', label: '🔵 Tayyorlanmoqda', count: orders.filter(o => o.status === 'preparing').length, badgeColor: 'bg-blue-100 text-blue-800' },
    { id: 'on_the_way', label: '🟣 Yo\'lda', count: orders.filter(o => o.status === 'on_the_way').length, badgeColor: 'bg-purple-100 text-purple-800' },
    { id: 'delivered', label: '🟢 Yetkazildi', count: orders.filter(o => o.status === 'delivered').length, badgeColor: 'bg-emerald-100 text-emerald-800' },
    { id: 'cancelled', label: '🔴 Bekor qilindi', count: orders.filter(o => o.status === 'cancelled').length, badgeColor: 'bg-gray-100 text-gray-700' }
  ];

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone.includes(searchTerm);

    const matchesBranch = selectedBranch === 'all' || String(order.branch_id) === String(selectedBranch);

    let matchesTab = true;
    if (selectedStatusTab === 'active') {
      matchesTab = ['pending', 'preparing', 'on_the_way'].includes(order.status);
    } else if (selectedStatusTab !== 'all') {
      matchesTab = order.status === selectedStatusTab;
    }

    return matchesSearch && matchesBranch && matchesTab;
  });

  return (
    <div className="space-y-5">
      {/* Top Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buyurtma ID, mijoz ismi yoki telefon raqami..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E31E24]/30 focus:border-[#E31E24]"
            />
          </div>

          {/* Right Controls: View Switch & Refresh */}
          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex border border-gray-200 rounded-xl p-1 bg-gray-50">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Qulay vertikal kartalar ko'rinishi (Keng va qulay)"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Qulay Kartalar</span>
              </button>

              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'kanban' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Klassik Kanban taxtasi (Gorizontal ustunlar)"
              >
                <Columns3 className="w-4 h-4" />
                <span>Kanban Taxtasi</span>
              </button>

              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Jadval ro'yxati"
              >
                <List className="w-4 h-4" />
                <span>Jadval</span>
              </button>
            </div>

            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Yangilash</span>
            </button>
          </div>
        </div>

        {/* Status Filter Tabs (In 'cards' and 'table' mode) */}
        {viewMode !== 'kanban' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-gray-100">
            {statusTabs.map((tab) => {
              const isSelected = selectedStatusTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatusTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#E31E24] text-white shadow-md shadow-red-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 text-[11px] rounded-full font-black ${
                    isSelected ? 'bg-white text-[#E31E24]' : 'bg-gray-200 text-gray-800'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* VIEW MODE 1: SPACIOUS VERTICAL CARDS (DEFAULT & HIGHLY ERGONOMIC) */}
      {viewMode === 'cards' && (
        <div>
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400 space-y-2">
              <Clock className="w-10 h-10 mx-auto text-gray-300" />
              <h3 className="font-bold text-gray-700 text-base">Hozircha buyurtma mavjud emas</h3>
              <p className="text-xs text-gray-500">Ushbu holatda yangi buyurtmalar kelib tushsa shu yerda ko'rinadi.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={onUpdateStatus}
                  onUpdatePrepTime={onUpdatePrepTime}
                  onDeleteOrder={onDeleteOrder}
                  onPrintReceipt={(o) => setReceiptOrder(o)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: CLASSIC HORIZONTAL KANBAN (WITH ROOMY MIN-WIDTH SO NOTHING SQUISHES) */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-6 items-start scrollbar-thin">
          {[
            { id: 'pending', title: 'Kutilmoqda', subtitle: 'Yangi buyurtmalar', icon: Clock, badgeColor: 'bg-amber-100 text-amber-800' },
            { id: 'preparing', title: 'Tayyorlanmoqda', subtitle: 'Oshxonada jarayonda', icon: ChefHat, badgeColor: 'bg-blue-100 text-blue-800' },
            { id: 'on_the_way', title: 'Yo\'lda', subtitle: 'Kuryer yetkazmoqda', icon: Truck, badgeColor: 'bg-purple-100 text-purple-800' },
            { id: 'delivered', title: 'Yetkazildi', subtitle: 'Muvaffaqiyatli yakunlangan', icon: CheckCircle2, badgeColor: 'bg-emerald-100 text-emerald-800' },
            { id: 'cancelled', title: 'Bekor qilindi', subtitle: 'Rad etilgan buyurtmalar', icon: XCircle, badgeColor: 'bg-gray-100 text-gray-700' }
          ].map((col) => {
            const colOrders = orders.filter(o => o.status === col.id);
            const Icon = col.icon;

            return (
              <div
                key={col.id}
                className="w-[380px] shrink-0 bg-gray-100/90 rounded-2xl p-3.5 border border-gray-200/80 flex flex-col min-h-[620px] shadow-2xs"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-xl ${col.badgeColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-900">{col.title}</h3>
                      <p className="text-[11px] text-gray-500">{col.subtitle}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 text-xs font-black rounded-full ${col.badgeColor}`}>
                    {colOrders.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[750px] pr-1">
                  {colOrders.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center text-center text-gray-400 border border-dashed border-gray-300 rounded-xl bg-white/50 p-4">
                      <p className="text-xs font-medium">Hozircha buyurtma yo'q</p>
                    </div>
                  ) : (
                    colOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onUpdateStatus={onUpdateStatus}
                        onUpdatePrepTime={onUpdatePrepTime}
                        onDeleteOrder={onDeleteOrder}
                        onPrintReceipt={(o) => setReceiptOrder(o)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 3: TABLE LIST */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200 uppercase">
                <tr>
                  <th className="px-4 py-3.5">Buyurtma ID</th>
                  <th className="px-4 py-3.5">Mijoz va Telefon</th>
                  <th className="px-4 py-3.5">Yetkazish Manzili</th>
                  <th className="px-4 py-3.5">Tarkibi</th>
                  <th className="px-4 py-3.5">Summa & To'lov</th>
                  <th className="px-4 py-3.5">Holati</th>
                  <th className="px-4 py-3.5 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-black text-sm text-[#E31E24]">
                      #{o.order_number}
                      <span className="block text-[10px] text-gray-400 font-mono font-normal mt-0.5">{o.created_at}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-gray-900">{o.customer_name}</p>
                      <p className="text-[11px] text-gray-500 font-mono">{o.customer_phone}</p>
                    </td>
                    <td className="px-4 py-3.5 max-w-xs text-gray-700 font-medium">
                      {o.customer_address}
                    </td>
                    <td className="px-4 py-3.5">
                      <ul className="space-y-0.5">
                        {o.items && o.items.map((it, i) => (
                          <li key={i} className="text-[11px] text-gray-600">
                            <strong>{it.quantity}x</strong> {it.product_name}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-extrabold text-[#E31E24] text-sm font-mono">{formatSum(o.total_price)}</p>
                      <span className="text-[10px] uppercase font-bold text-gray-500">{o.payment_method}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-800">
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => setReceiptOrder(o)}
                        className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 cursor-pointer"
                        title="Chek chiqarish"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteOrder(o.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="O'chirish"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Thermal Receipt Print Modal */}
      {receiptOrder && (
        <ReceiptModal
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}
    </div>
  );
}
