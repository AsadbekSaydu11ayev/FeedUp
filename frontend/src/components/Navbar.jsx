import React from 'react';
import { 
  Flame, 
  ShoppingBag, 
  UtensilsCrossed, 
  FolderTree, 
  MapPin, 
  BarChart3, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Volume2, 
  VolumeX,
  Code
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  online, 
  pendingCount, 
  soundEnabled, 
  setSoundEnabled,
  onOpenSwiftUIDocs
}) {
  const tabs = [
    { id: 'orders', label: 'Buyurtmalar (Kanban)', icon: ShoppingBag, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'products', label: 'Mahsulotlar (Menu)', icon: UtensilsCrossed },
    { id: 'categories', label: 'Kategoriyalar', icon: FolderTree },
    { id: 'branches', label: 'Filiallar', icon: MapPin },
    { id: 'stats', label: 'Statistika', icon: BarChart3 },
    { id: 'client', label: 'Mijoz Buyurtma Berish (Live Demo)', icon: Smartphone, highlight: true }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
      {/* Top bar with FeedUp Identity */}
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E31E24] flex items-center justify-center text-white shadow-md shadow-red-200">
              <Flame className="w-6 h-6 text-[#FFC700] fill-[#FFC700]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-2xl tracking-wider text-[#E31E24]">FEED<span className="text-[#1E1E1E]">UP</span></span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-[#E31E24] font-semibold border border-red-200">
                  ADMIN v1.0
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">Fast Food boshqaruv va yetkazib berish tizimi</p>
            </div>
          </div>

          {/* Right Status & Controls */}
          <div className="flex items-center gap-3">
            {/* Real-time SSE indicator */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
              online ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              <span className="relative flex h-2 w-2">
                {online && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${online ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              </span>
              {online ? 'Real-time Jonli' : 'Ulanmagan'}
            </div>

            {/* Sound alert toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Ovozli bildirishnoma yoqilgan' : 'Ovozli bildirishnoma o\'chirilgan'}
              className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                soundEnabled 
                  ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' 
                  : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* SwiftUI Code / Docs Modal button */}
            <button
              onClick={onOpenSwiftUIDocs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 text-xs font-semibold transition-all shadow-xs"
            >
              <Code className="w-4 h-4 text-emerald-400" />
              <span>iOS SwiftUI API</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-t border-gray-100 bg-gray-50/70">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#E31E24] text-white shadow-sm'
                      : tab.highlight
                      ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.highlight ? 'text-amber-700' : 'text-gray-500'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`px-1.5 py-0.5 text-[11px] font-bold rounded-full ${
                      isActive ? 'bg-white text-[#E31E24]' : 'bg-[#E31E24] text-white'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}

