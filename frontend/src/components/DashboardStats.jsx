import React, { useState } from 'react';
import { 
  ShoppingBag, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Flame, 
  Store,
  FileText,
  Printer,
  X,
  CreditCard,
  Banknote,
  Receipt
} from 'lucide-react';
import { formatSum } from './KanbanBoard';

export default function DashboardStats({ stats, orders }) {
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [shiftData, setShiftData] = useState(null);
  const [loadingShift, setLoadingShift] = useState(false);

  if (!stats) return null;

  const { totalOrders, totalRevenue, activeOrders, statusBreakdown, topProducts, totalProducts, totalBranches } = stats;

  const handleOpenShiftReport = async () => {
    setLoadingShift(true);
    setShiftModalOpen(true);
    try {
      const res = await fetch('/api/stats/shift-report');
      const data = await res.json();
      if (data.success) {
        setShiftData(data.data);
      }
    } catch (err) {
      console.error('Shift report load error:', err);
    } finally {
      setLoadingShift(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Title and Shift Report Button */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-gray-900">Analitika va Savdo Ko'rsatkichlari</h2>
          <p className="text-xs text-gray-500">Fast Food tarmog'ining kunlik va umumiy moliyaviy hisobotlari</p>
        </div>

        <button
          onClick={handleOpenShiftReport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <FileText className="w-4 h-4 text-amber-400" />
          <span>Kunlik Smena Hisoboti (Z-Otchyot)</span>
        </button>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Jami Tushum</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{formatSum(totalRevenue)}</h3>
            <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Barcha muvaffaqiyatli buyurtmalar
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Jami Buyurtmalar</p>
            <h3 className="text-2xl font-extrabold text-[#E31E24] mt-1">{totalOrders} ta</h3>
            <p className="text-[11px] text-gray-500 font-medium mt-1">
              Bugungi va avvalgi buyurtmalar
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-[#E31E24] flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Aktiv Buyurtmalar</p>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{activeOrders} ta</h3>
            <p className="text-[11px] text-amber-600 font-medium mt-1">
              Hozir jarayonda / kuryerda
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Total Products & Branches */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Menyu & Filiallar</p>
            <h3 className="text-2xl font-extrabold text-blue-600 mt-1">{totalProducts} ta taom</h3>
            <p className="text-[11px] text-gray-500 font-medium mt-1">
              {totalBranches} ta faol filial
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Store className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Two columns: Status Breakdown & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Buyurtmalar Holati Bo'yicha Taqsimot
          </h3>

          <div className="space-y-3">
            {[
              { label: 'Kutilmoqda (Pending)', count: statusBreakdown.pending, color: 'bg-amber-400', text: 'text-amber-800' },
              { label: 'Tayyorlanmoqda (Preparing)', count: statusBreakdown.preparing, color: 'bg-blue-400', text: 'text-blue-800' },
              { label: 'Yo\'lda (On the Way)', count: statusBreakdown.on_the_way, color: 'bg-purple-400', text: 'text-purple-800' },
              { label: 'Yetkazildi (Delivered)', count: statusBreakdown.delivered, color: 'bg-emerald-500', text: 'text-emerald-800' },
              { label: 'Bekor qilindi (Cancelled)', count: statusBreakdown.cancelled, color: 'bg-rose-400', text: 'text-rose-800' }
            ].map((item, idx) => {
              const pct = totalOrders > 0 ? Math.round((item.count / totalOrders) * 100) : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-700">{item.label}</span>
                    <span className="font-mono text-gray-900">{item.count} ta ({pct}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Selling Dishes */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#E31E24]" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Eng Ko'p Sotilgan Taomlar (TOP 5)
            </h3>
          </div>

          <div className="space-y-3">
            {topProducts && topProducts.length > 0 ? (
              topProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-red-100 text-[#E31E24] font-extrabold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{p.product_name}</p>
                      <p className="text-[11px] text-gray-500">{p.total_sold} ta buyurtma qilingan</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-[#E31E24]">{formatSum(p.total_revenue)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 text-center py-6">Hozircha sotuvlar yo'q</p>
            )}
          </div>
        </div>
      </div>

      {/* SHIFT REPORT MODAL (Z-OTCHYOT) */}
      {shiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-xl p-6 space-y-5 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#E31E24]" />
                  <span>Kunlik Smena Hisoboti (Z-Otchyot)</span>
                </h3>
                <p className="text-xs text-gray-500">Kassani topshirish va to'lov turlari bo'yicha xulosa</p>
              </div>
              <button
                onClick={() => setShiftModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingShift ? (
              <div className="py-12 text-center text-xs text-gray-500">Hisobot yuklanmoqda...</div>
            ) : shiftData ? (
              <div id="printable-shift-report" className="space-y-4 text-xs">
                {/* Summary Box */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <span className="text-[11px] text-gray-500 block">Sof Tushum</span>
                    <strong className="text-sm text-[#E31E24] font-black">{formatSum(shiftData.summary.net_revenue)}</strong>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <span className="text-[11px] text-gray-500 block">Yetkazilgan Buyurtmalar</span>
                    <strong className="text-sm text-emerald-700 font-bold">{shiftData.summary.delivered_count} ta</strong>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <span className="text-[11px] text-gray-500 block">O'rtacha Chek</span>
                    <strong className="text-sm text-gray-900 font-bold">{formatSum(Math.round(shiftData.summary.avg_check))}</strong>
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">To'lov turlari bo'yicha tushum:</h4>
                  <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                    {shiftData.paymentBreakdown.map((pm, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {pm.payment_method === 'cash' ? <Banknote className="w-4 h-4 text-emerald-600" /> : <CreditCard className="w-4 h-4 text-blue-600" />}
                          <span className="font-bold uppercase text-gray-800">{pm.payment_method}</span>
                          <span className="text-[11px] text-gray-400 font-normal">({pm.order_count} ta buyurtma)</span>
                        </div>
                        <span className="font-bold font-mono text-gray-900">{formatSum(pm.total_amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Branch Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filiallar bo'yicha ulush:</h4>
                  <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                    {shiftData.branchBreakdown.map((br, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-800">{br.branch_name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400">{br.orders_count} ta</span>
                          <span className="font-bold font-mono text-gray-900">{formatSum(br.total_revenue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setShiftModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
              >
                Yopish
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#E31E24] hover:bg-[#C91A1F] rounded-xl shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Chop etish</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
