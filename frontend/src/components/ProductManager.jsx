import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  UploadCloud, 
  Check, 
  X, 
  Clock, 
  Flame, 
  Sparkles,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  LayoutGrid,
  List,
  CheckSquare,
  Square
} from 'lucide-react';
import { formatSum } from './KanbanBoard';

export default function ProductManager({ 
  products, 
  categories, 
  onAddProduct, 
  onUpdateProduct, 
  onToggleAvailability, 
  onDeleteProduct,
  onBulkDeleteProducts
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Multi-Selection State
  const [selectedIds, setSelectedIds] = useState([]);

  // In-App Delete Confirmation Modal State (replaces native window.confirm)
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: 'single', // 'single' | 'bulk'
    targetId: null,
    targetName: '',
    count: 0
  });

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    description: '',
    price: '',
    old_price: '',
    calories: 500,
    prep_time_min: 15,
    image_url: '',
    is_available: 1
  });

  // Drag and Drop Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'all' || String(p.category_id) === String(selectedCategory);
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesAvail = 
      availabilityFilter === 'all' || 
      (availabilityFilter === 'available' && p.is_available === 1) ||
      (availabilityFilter === 'unavailable' && p.is_available === 0);

    return matchesCat && matchesSearch && matchesAvail;
  });

  // Selection Logic
  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const isAllFilteredSelected = filteredProducts.length > 0 && 
    filteredProducts.every(p => selectedIds.includes(p.id));

  const toggleSelectAll = () => {
    if (isAllFilteredSelected) {
      // Deselect filtered
      const filteredIdSet = new Set(filteredProducts.map(p => p.id));
      setSelectedIds(prev => prev.filter(id => !filteredIdSet.has(id)));
    } else {
      // Select all filtered
      const newIds = new Set([...selectedIds, ...filteredProducts.map(p => p.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  // Open modal for new product
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category_id: categories.length > 0 ? categories[0].id : '',
      description: '',
      price: '',
      old_price: '',
      calories: 500,
      prep_time_min: 15,
      image_url: '',
      is_available: 1
    });
    setUploadError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category_id: product.category_id,
      description: product.description || '',
      price: product.price,
      old_price: product.old_price ?? '',
      calories: product.calories || 0,
      prep_time_min: product.prep_time_min || 15,
      image_url: product.image_url,
      is_available: product.is_available
    });
    setUploadError(null);
    setIsModalOpen(true);
  };

  // Trigger single product delete
  const triggerSingleDelete = (product) => {
    setDeleteModal({
      isOpen: true,
      type: 'single',
      targetId: product.id,
      targetName: product.name,
      count: 1
    });
  };

  // Trigger bulk delete
  const triggerBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setDeleteModal({
      isOpen: true,
      type: 'bulk',
      targetId: null,
      targetName: `${selectedIds.length} ta tanlangan mahsulot`,
      count: selectedIds.length
    });
  };

  // Execute confirmed delete
  const handleExecuteDelete = async () => {
    if (deleteModal.type === 'single') {
      await onDeleteProduct(deleteModal.targetId);
      setSelectedIds(prev => prev.filter(id => id !== deleteModal.targetId));
    } else if (deleteModal.type === 'bulk') {
      await onBulkDeleteProducts(selectedIds);
      setSelectedIds([]);
    }
    setDeleteModal({ isOpen: false, type: 'single', targetId: null, targetName: '', count: 0 });
  };

  // Upload file logic (used by Drag & Drop and manual file picker)
  const handleUploadFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Faqat rasm fayllari (JPG, PNG, WEBP) qabul qilinadi.');
      return;
    }

    setUploadingImage(true);
    setUploadError(null);

    const bodyData = new FormData();
    bodyData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: bodyData
      });
      const data = await res.json();

      if (data.success) {
        setFormData(prev => ({ ...prev, image_url: data.url }));
      } else {
        setUploadError(data.error || 'Rasm yuklashda xatolik yuz berdi.');
      }
    } catch (err) {
      setUploadError('Serverga ulanishda xatolik yuz berdi: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // Drag and Drop Event Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleUploadFile(file);
    }
  };

  // Submit form (Create or Update)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category_id) {
      alert('Iltimos, nom, narx va kategoriyani to\'ldiring!');
      return;
    }

    const parsedOldPrice =
      formData.old_price !== '' && formData.old_price !== null && Number(formData.old_price) > 0
        ? parseFloat(formData.old_price)
        : null;

    const payload = {
      ...formData,
      category_id: parseInt(formData.category_id, 10),
      price: parseFloat(formData.price),
      old_price: parsedOldPrice,
      calories: parseInt(formData.calories, 10) || 0,
      prep_time_min: parseInt(formData.prep_time_min, 10) || 15,
      is_available: formData.is_available ? 1 : 0
    };

    if (editingProduct) {
      onUpdateProduct(editingProduct.id, payload);
    } else {
      onAddProduct(payload);
    }

    setIsModalOpen(false);
  };

  const getDiscountPercent = (price, oldPrice) => {
    const current = Number(price);
    const previous = Number(oldPrice);
    if (!previous || previous <= current || Number.isNaN(previous)) return null;
    return Math.round(((previous - current) / previous) * 100);
  };

  const renderProductPrice = (product, variant = 'grid') => {
    const discountPercent = getDiscountPercent(product.price, product.old_price);
    return (
      <div className="flex flex-col">
        {discountPercent !== null && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 line-through font-medium">
              {formatSum(product.old_price)}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-red-50 text-[#E31E24] text-[10px] font-extrabold">
              -{discountPercent}%
            </span>
          </div>
        )}
        <span
          className={
            variant === 'grid'
              ? 'text-base font-extrabold text-[#E31E24]'
              : 'font-extrabold text-[#E31E24] font-mono'
          }
        >
          {formatSum(product.price)}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top action header: Categories pills & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Taom nomi yoki tavsifi bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E31E24]/30 focus:border-[#E31E24]"
            />
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {/* View Mode Switch */}
            <div className="flex border border-gray-200 rounded-lg p-0.5 bg-gray-50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Katalog ko'rinishi"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                  viewMode === 'table' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Jadval ko'rinishi"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Availability Filter */}
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="text-xs py-2 px-3 rounded-lg border border-gray-300 bg-white font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#E31E24]/30"
            >
              <option value="all">Barcha holatlar</option>
              <option value="available">Faqat Mavjud</option>
              <option value="unavailable">Tugaganlar</option>
            </select>

            {/* Select All Toggle Button */}
            <button
              onClick={toggleSelectAll}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                isAllFilteredSelected 
                  ? 'bg-red-50 text-[#E31E24] border-red-300' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              title="Ro'yxatdagi barcha taomlarni tanlash / bekor qilish"
            >
              {isAllFilteredSelected ? <CheckSquare className="w-4 h-4 text-[#E31E24]" /> : <Square className="w-4 h-4 text-gray-400" />}
              <span>{isAllFilteredSelected ? 'Barchasini bekor qilish' : 'Hammasini tanlash'}</span>
            </button>

            {/* Add New Dish Button */}
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E31E24] hover:bg-[#C91A1F] text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi taom qo'shish</span>
            </button>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-gray-100">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Barchasi ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter(p => p.category_id === cat.id).length;
            const isSelected = String(selectedCategory) === String(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#E31E24] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FLOATING BULK ACTIONS BAR (When 1 or more items are selected) */}
      {selectedIds.length > 0 && (
        <div className="sticky top-20 z-30 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-[#E31E24] text-white font-extrabold text-xs flex items-center justify-center">
              {selectedIds.length}
            </span>
            <span className="text-sm font-bold">
              {selectedIds.length} ta mahsulot tanlandi
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={clearSelection}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Tanlovni bekor qilish
            </button>

            <button
              onClick={triggerBulkDelete}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E31E24] hover:bg-[#C91A1F] text-white text-xs font-extrabold transition-all shadow-md cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Tanlanganlarni o'chirish ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const isAvailable = product.is_available === 1;
            const isSelected = selectedIds.includes(product.id);

            return (
              <div
                key={product.id}
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden group shadow-2xs hover:shadow-md relative ${
                  isSelected 
                    ? 'border-[#E31E24] ring-2 ring-[#E31E24]/30' 
                    : isAvailable 
                    ? 'border-gray-200' 
                    : 'border-gray-300 opacity-75 bg-gray-50/50'
                }`}
              >
                {/* Food Image with Checkbox & Category badge */}
                <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80';
                    }}
                  />

                  {/* Multi-Select Checkbox on Card */}
                  <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(product.id);
                      }}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-md ${
                        isSelected 
                          ? 'bg-[#E31E24] text-white' 
                          : 'bg-white/90 text-transparent hover:text-gray-400 border border-gray-300'
                      }`}
                      title="Tanlash"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>

                    <span className="px-2.5 py-1 bg-white/90 backdrop-blur-xs rounded-full text-[11px] font-bold text-gray-800 shadow-xs flex items-center gap-1">
                      {product.category_icon || '🍽️'} {product.category_name}
                    </span>
                  </div>

                  {/* Availability Badge Overlay */}
                  <div className="absolute top-2.5 right-2.5 z-10">
                    <button
                      onClick={() => onToggleAvailability(product.id)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold shadow-sm flex items-center gap-1 transition-all cursor-pointer ${
                        isAvailable 
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                          : 'bg-rose-500 text-white hover:bg-rose-600'
                      }`}
                      title="Holatni almashtirish uchun bosing"
                    >
                      {isAvailable ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>{isAvailable ? 'Mavjud' : 'Tugagan'}</span>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 group-hover:text-[#E31E24] transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      {product.description || 'Tavsif kiritilmagan'}
                    </p>
                  </div>

                  {/* Stats (Calories & Prep Time) */}
                  <div className="flex items-center gap-3 text-[11px] text-gray-500 border-t border-b border-gray-100 py-2">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span>{product.calories} kcal</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>{product.prep_time_min} daqiqa</span>
                    </span>
                  </div>

                  {/* Bottom: Price & Action Buttons */}
                  <div className="flex items-center justify-between pt-1">
                    {renderProductPrice(product, 'grid')}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Tahrirlash"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => triggerSingleDelete(product)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200 uppercase">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <button
                      onClick={toggleSelectAll}
                      className="cursor-pointer"
                      title="Barchasini tanlash"
                    >
                      {isAllFilteredSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#E31E24]" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3">Rasm va Nomi</th>
                  <th className="px-4 py-3">Kategoriya</th>
                  <th className="px-4 py-3">Narxi</th>
                  <th className="px-4 py-3">Vaqt & Kaloriya</th>
                  <th className="px-4 py-3">Holati</th>
                  <th className="px-4 py-3 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  return (
                    <tr 
                      key={p.id} 
                      className={`hover:bg-gray-50/80 transition-colors ${isSelected ? 'bg-red-50/40' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleSelect(p.id)}
                          className="cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#E31E24]" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-11 h-11 rounded-lg object-cover bg-gray-100"
                          />
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                            <p className="text-[11px] text-gray-500 truncate max-w-xs">{p.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-700">
                        {p.category_icon} {p.category_name}
                      </td>
                      <td className="px-4 py-3">
                        {renderProductPrice(p, 'table')}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>⏱️ {p.prep_time_min} daq</div>
                        <div>🔥 {p.calories} kcal</div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onToggleAvailability(p.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold cursor-pointer transition-colors ${
                            p.is_available === 1 
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {p.is_available === 1 ? 'Mavjud' : 'Tugagan'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => triggerSingleDelete(p)}
                          className="p-1.5 text-gray-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* IN-APP CONFIRMATION MODAL FOR DELETING (Single or Bulk) */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl border border-gray-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-gray-900">
                {deleteModal.type === 'bulk' 
                  ? `${deleteModal.count} ta mahsulotni o'chirishga ishonchingiz komilmi?`
                  : `"${deleteModal.targetName}" taomini o'chirishga ishonchingiz komilmi?`}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Ushbu mahsulot(lar) menyudan butunlay olib tashlanadi. Avvalgi amalga oshirilgan buyurtmalar tarixi buzilmay saqlanib qoladi.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteModal({ isOpen: false, type: 'single', targetId: null, targetName: '', count: 0 })}
                className="flex-1 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleExecuteDelete}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Ha, o'chirilsin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE & EDIT MODAL WITH DRAG AND DROP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingProduct ? 'Taom ma\'lumotlarini tahrirlash' : 'Yangi taom qo\'shish'}
                </h2>
                <p className="text-xs text-gray-500">
                  FeedUp menyusiga taom kiritish yoki mavjudini yangilash
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dish Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Taom nomi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: FeedUp Go'shtli Lavash"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E31E24]/30 focus:border-[#E31E24]"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Kategoriya <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E31E24]/30 focus:border-[#E31E24] bg-white font-medium"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price & Optional Old Price (Discount) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Narxi (so'mda) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="500"
                    placeholder="28000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E31E24]/30 focus:border-[#E31E24] font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700">
                      Eski narx / Chegirmasiz narx (ixtiyoriy)
                    </label>
                    {getDiscountPercent(formData.price, formData.old_price) !== null && (
                      <span className="px-1.5 py-0.5 rounded bg-red-50 text-[#E31E24] text-[10px] font-extrabold">
                        -{getDiscountPercent(formData.price, formData.old_price)}%
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    placeholder="Masalan: 32000"
                    value={formData.old_price}
                    onChange={(e) => setFormData({ ...formData, old_price: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E31E24]/30 focus:border-[#E31E24] font-mono"
                  />
                  {formData.old_price !== '' && formData.price !== '' && Number(formData.old_price) > 0 && Number(formData.old_price) <= Number(formData.price) && (
                    <p className="text-[11px] text-amber-600 mt-1 font-medium">
                      Chegirma ko'rinishi uchun eski narx joriy narxdan katta bo'lishi kerak.
                    </p>
                  )}
                </div>
              </div>

              {/* Calories & Prep Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Kaloriya (kcal)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="650"
                    value={formData.calories}
                    onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E31E24]/30 focus:border-[#E31E24]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Tayyorlanish vaqti (minutda)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="15"
                    value={formData.prep_time_min}
                    onChange={(e) => setFormData({ ...formData, prep_time_min: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E31E24]/30 focus:border-[#E31E24]"
                  />
                </div>
              </div>

              {/* DRAG AND DROP IMAGE UPLOAD AREA */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Taom rasmi (Drag & Drop yoki fayl tanlash)
                </label>

                {/* Dropzone Container */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-4 transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                    isDragging
                      ? 'border-[#E31E24] bg-red-50/50 scale-[1.01]'
                      : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'
                  }`}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleUploadFile(e.target.files[0]);
                      }
                    }}
                  />

                  {uploadingImage ? (
                    <div className="py-4 flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-3 border-[#E31E24] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-bold text-gray-600">Rasm yuklanmoqda...</span>
                    </div>
                  ) : formData.image_url ? (
                    <div className="flex items-center gap-4 w-full">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-20 h-20 rounded-xl object-cover border border-gray-200 shrink-0 shadow-xs"
                      />
                      <div className="text-left flex-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                          <CheckCircle className="w-4 h-4" /> Rasm muvaffaqiyatli yuklandi
                        </div>
                        <p className="text-[11px] text-gray-500 truncate max-w-xs mt-0.5">
                          {formData.image_url}
                        </p>
                        <p className="text-[11px] text-[#E31E24] font-semibold mt-1">
                          Boshqa rasm tashlash yoki almashtirish uchun bosing
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-red-100 text-[#E31E24] flex items-center justify-center mb-2">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-gray-800">
                        Rasmni bu yerga sudrab olib kelib tashlang (Drag & Drop)
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        yoki kompyuterdan fayl tanlash uchun bosing (PNG, JPG, WEBP)
                      </p>
                    </div>
                  )}
                </div>

                {uploadError && (
                  <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {uploadError}
                  </p>
                )}

                {/* Direct URL input fallback */}
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="yoki to'g'ridan-to'g'ri rasm URL manzilini kiriting..."
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E31E24]/30"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tavsif (Masalliqlar va taom haqida)
                </label>
                <textarea
                  rows="2"
                  placeholder="Shirali mol go'shti, qarsildoq sabzavotlar, maxsus sous..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E31E24]/30 focus:border-[#E31E24]"
                />
              </div>

              {/* Availability Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Mavjudlik holati</span>
                  <span className="text-[11px] text-gray-500">Mijozlar ushbu taomga buyurtma bera oladimi?</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_available: formData.is_available === 1 ? 0 : 1 })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.is_available === 1 ? 'bg-[#E31E24]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      formData.is_available === 1 ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#E31E24] hover:bg-[#C91A1F] rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  {editingProduct ? 'Saqlash' : 'Taomni qo\'shish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
