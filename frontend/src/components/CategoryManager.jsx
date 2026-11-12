import React, { useState } from 'react';
import { Plus, Edit3, Trash2, FolderTree, X, Check } from 'lucide-react';

export default function CategoryManager({ categories, onAddCategory, onUpdateCategory, onDeleteCategory }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [formData, setFormData] = useState({ name: '', slug: '', icon: '🍽️', sort_order: 0 });

  const commonIcons = ['🌯', '🍔', '🍟', '🌭', '🍗', '🥤', '🥫', '🍕', '🍰', '☕', '🥗', '🍩'];

  const handleOpenAdd = () => {
    setEditingCat(null);
    setFormData({ name: '', slug: '', icon: '🌯', sort_order: categories.length + 1 });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCat(cat);
    setFormData({ name: cat.name, slug: cat.slug, icon: cat.icon, sort_order: cat.sort_order });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingCat) {
      onUpdateCategory(editingCat.id, formData);
    } else {
      onAddCategory(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">Menyu Kategoriyalari</h2>
          <p className="text-xs text-gray-500">Mijozlar menyusida taomlarni guruhlash bo'limlari</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#E31E24] hover:bg-[#C91A1F] text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi kategoriya</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 bg-gray-50 rounded-xl border border-gray-100">{cat.icon}</span>
              <div>
                <h3 className="text-sm font-bold text-gray-900">{cat.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-mono text-gray-400">slug: {cat.slug}</span>
                  <span className="text-[11px] font-bold text-[#E31E24] bg-red-50 px-2 py-0.5 rounded-full">
                    {cat.product_count || 0} taom
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleOpenEdit(cat)}
                className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`"${cat.name}" kategoriyasini o'chirishga ishonchingiz komilmi?`)) {
                    onDeleteCategory(cat.id);
                  }
                }}
                className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-base text-gray-900">
                {editingCat ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya qo\'shish'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Kategoriya nomi</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Lavashlar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E31E24]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Slug (URL uchun)</label>
                <input
                  type="text"
                  placeholder="masalan: lavash"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E31E24]/30 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Ikonka (Emoji)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {commonIcons.map((ic) => (
                    <button
                      type="button"
                      key={ic}
                      onClick={() => setFormData({ ...formData, icon: ic })}
                      className={`text-xl p-1.5 rounded-lg border transition-all ${
                        formData.icon === ic ? 'border-[#E31E24] bg-red-50 scale-110' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-24 px-3 py-1.5 text-center text-lg rounded-lg border border-gray-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#E31E24] hover:bg-[#C91A1F] rounded-lg"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

