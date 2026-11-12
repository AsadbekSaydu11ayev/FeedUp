import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from './components/Navbar';
import KanbanBoard from './components/KanbanBoard';
import ProductManager from './components/ProductManager';
import CategoryManager from './components/CategoryManager';
import BranchManager from './components/BranchManager';
import DashboardStats from './components/DashboardStats';
import CustomerStorefront from './components/CustomerStorefront';
import SwiftUIDocsModal from './components/SwiftUIDocsModal';

// Web Audio API Ding chime for incoming orders
function playNewOrderSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.15); // D6

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.6);
    osc2.stop(ctx.currentTime + 0.6);
  } catch (err) {
    console.warn('Could not play order chime:', err);
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSwiftUIDocsOpen, setIsSwiftUIDocsOpen] = useState(false);

  // Load initial data
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordRes, prodRes, catRes, brRes, stRes] = await Promise.all([
        fetch('/api/orders').then(r => r.json()),
        fetch('/api/products').then(r => r.json()),
        fetch('/api/categories').then(r => r.json()),
        fetch('/api/branches').then(r => r.json()),
        fetch('/api/stats').then(r => r.json())
      ]);

      if (ordRes.success) setOrders(ordRes.data);
      if (prodRes.success) setProducts(prodRes.data);
      if (catRes.success) setCategories(catRes.data);
      if (brRes.success) setBranches(brRes.data);
      if (stRes.success) setStats(stRes.data);
    } catch (err) {
      console.error('Data loading error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Server-Sent Events (SSE) Real-time Connection
  useEffect(() => {
    let eventSource;

    function connectSSE() {
      eventSource = new EventSource('/api/orders/stream');

      eventSource.onopen = () => {
        setOnline(true);
      };

      eventSource.addEventListener('order_created', (e) => {
        try {
          const newOrder = JSON.parse(e.data);
          setOrders(prev => {
            const exists = prev.find(o => o.id === newOrder.id);
            if (exists) return prev;
            return [newOrder, ...prev];
          });
          if (soundEnabled) {
            playNewOrderSound();
          }
          // Refresh stats
          fetch('/api/stats').then(r => r.json()).then(res => {
            if (res.success) setStats(res.data);
          });
        } catch (err) {
          console.error('Error handling order_created:', err);
        }
      });

      eventSource.addEventListener('order_status_changed', (e) => {
        try {
          const { orderId, order } = JSON.parse(e.data);
          setOrders(prev => prev.map(o => (o.id === orderId ? order : o)));
          // Refresh stats
          fetch('/api/stats').then(r => r.json()).then(res => {
            if (res.success) setStats(res.data);
          });
        } catch (err) {
          console.error('Error handling order_status_changed:', err);
        }
      });

      eventSource.addEventListener('order_prep_time_updated', (e) => {
        try {
          const { orderId, order } = JSON.parse(e.data);
          setOrders(prev => prev.map(o => (o.id === orderId ? order : o)));
        } catch (err) {
          console.error('Error handling order_prep_time_updated:', err);
        }
      });

      eventSource.addEventListener('order_deleted', (e) => {
        try {
          const { orderId } = JSON.parse(e.data);
          setOrders(prev => prev.filter(o => o.id !== orderId));
        } catch (err) {
          console.error('Error handling order_deleted:', err);
        }
      });

      eventSource.onerror = () => {
        setOnline(false);
        eventSource.close();
        setTimeout(connectSSE, 4000); // Reconnect after 4 seconds
      };
    }

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [soundEnabled]);

  // Order Actions
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      // Optimistic UI update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? data.data : o));
      }
    } catch (err) {
      console.error('Status update failed:', err);
      loadAllData();
    }
  };

  const handleUpdatePrepTime = async (orderId, minutes) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/prep-time`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prep_time_min: minutes })
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? data.data : o));
      }
    } catch (err) {
      console.error('Prep time update failed:', err);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      setOrders(prev => prev.filter(o => o.id !== orderId));
      await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Delete order failed:', err);
      loadAllData();
    }
  };

  // Product Actions
  const handleAddProduct = async (productData) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      const data = await res.json();
      if (data.success) {
        setProducts(prev => [data.data, ...prev]);
        loadAllData();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Mahsulot qo\'shishda xatolik: ' + err.message);
    }
  };

  const handleUpdateProduct = async (productId, productData) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      const data = await res.json();
      if (data.success) {
        setProducts(prev => prev.map(p => p.id === productId ? data.data : p));
        loadAllData();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Mahsulotni yangilashda xatolik: ' + err.message);
    }
  };

  const handleToggleAvailability = async (productId) => {
    try {
      // Optimistic update
      setProducts(prev => prev.map(p => {
        if (p.id === productId) {
          return { ...p, is_available: p.is_available === 1 ? 0 : 1 };
        }
        return p;
      }));

      const res = await fetch(`/api/products/${productId}/toggle-availability`, { method: 'PATCH' });
      const data = await res.json();
      if (!data.success) {
        loadAllData();
      }
    } catch (err) {
      console.error('Toggle availability failed:', err);
      loadAllData();
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      setProducts(prev => prev.filter(p => p.id !== productId));
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Mahsulotni o\'chirishda xatolik');
      }
      loadAllData();
    } catch (err) {
      console.error('Delete product failed:', err);
      loadAllData();
    }
  };

  const handleBulkDeleteProducts = async (productIds) => {
    try {
      setProducts(prev => prev.filter(p => !productIds.includes(p.id)));
      const res = await fetch('/api/products/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: productIds })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Mahsulotlarni o\'chirishda xatolik');
      }
      loadAllData();
    } catch (err) {
      console.error('Bulk delete failed:', err);
      loadAllData();
    }
  };

  // Category Actions
  const handleAddCategory = async (catData) => {
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catData)
      });
      const data = await res.json();
      if (data.success) {
        setCategories(prev => [...prev, data.data]);
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Kategoriya qo\'shishda xatolik: ' + err.message);
    }
  };

  const handleUpdateCategory = async (catId, catData) => {
    try {
      const res = await fetch(`/api/categories/${catId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catData)
      });
      const data = await res.json();
      if (data.success) {
        setCategories(prev => prev.map(c => c.id === catId ? data.data : c));
      }
    } catch (err) {
      alert('Kategoriyani yangilashda xatolik: ' + err.message);
    }
  };

  const handleDeleteCategory = async (catId) => {
    try {
      setCategories(prev => prev.filter(c => c.id !== catId));
      await fetch(`/api/categories/${catId}`, { method: 'DELETE' });
    } catch (err) {
      alert('Kategoriyani o\'chirishda xatolik: ' + err.message);
      loadAllData();
    }
  };

  // Branch Actions
  const handleAddBranch = async (branchData) => {
    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branchData)
      });
      const data = await res.json();
      if (data.success) {
        setBranches(prev => [...prev, data.data]);
      }
    } catch (err) {
      alert('Filial qo\'shishda xatolik: ' + err.message);
    }
  };

  const handleUpdateBranch = async (branchId, branchData) => {
    try {
      const res = await fetch(`/api/branches/${branchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branchData)
      });
      const data = await res.json();
      if (data.success) {
        setBranches(prev => prev.map(b => b.id === branchId ? data.data : b));
      }
    } catch (err) {
      alert('Filialni yangilashda xatolik: ' + err.message);
    }
  };

  const handleDeleteBranch = async (branchId) => {
    try {
      setBranches(prev => prev.filter(b => b.id !== branchId));
      await fetch(`/api/branches/${branchId}`, { method: 'DELETE' });
    } catch (err) {
      alert('Filialni o\'chirishda xatolik: ' + err.message);
      loadAllData();
    }
  };

  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col selection:bg-red-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        online={online}
        pendingCount={pendingOrdersCount}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onOpenSwiftUIDocs={() => setIsSwiftUIDocsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'orders' && (
          <KanbanBoard
            orders={orders}
            onUpdateStatus={handleUpdateOrderStatus}
            onUpdatePrepTime={handleUpdatePrepTime}
            onDeleteOrder={handleDeleteOrder}
            onRefresh={loadAllData}
            loading={loading}
          />
        )}

        {activeTab === 'products' && (
          <ProductManager
            products={products}
            categories={categories}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onToggleAvailability={handleToggleAvailability}
            onDeleteProduct={handleDeleteProduct}
            onBulkDeleteProducts={handleBulkDeleteProducts}
          />
        )}

        {activeTab === 'categories' && (
          <CategoryManager
            categories={categories}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}

        {activeTab === 'branches' && (
          <BranchManager
            branches={branches}
            onAddBranch={handleAddBranch}
            onUpdateBranch={handleUpdateBranch}
            onDeleteBranch={handleDeleteBranch}
          />
        )}

        {activeTab === 'stats' && (
          <DashboardStats stats={stats} orders={orders} />
        )}

        {activeTab === 'client' && (
          <CustomerStorefront
            products={products}
            categories={categories}
            branches={branches}
            activeOrders={orders}
            onOrderCreated={(newOrder) => {
              setOrders(prev => [newOrder, ...prev]);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-500">
        <div className="max-w-[1700px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} FeedUp Fast Food Delivery System. Barcha huquqlar himoyalangan.</p>
          <div className="flex items-center gap-3">
            <span>Server: <strong className="text-gray-800">Node.js + Express + SQLite</strong></span>
            <span>•</span>
            <span>Frontend: <strong className="text-gray-800">React + Tailwind CSS</strong></span>
            <span>•</span>
            <span>SwiftUI Ready: <strong className="text-emerald-600">✓ iOS 16+</strong></span>
          </div>
        </div>
      </footer>

      {/* SwiftUI Integration Docs Modal */}
      <SwiftUIDocsModal
        isOpen={isSwiftUIDocsOpen}
        onClose={() => setIsSwiftUIDocsOpen(false)}
      />
    </div>
  );
}

