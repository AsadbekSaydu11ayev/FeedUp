import React, { useState } from 'react';
import { Plus, MapPin, Phone, Clock, Edit3, Trash2, CheckCircle2, XCircle, X } from 'lucide-react';

export default function BranchManager({ branches, onAddBranch, onUpdateBranch, onDeleteBranch }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '+998 71 200 22 11',
    opening_hours: '09:00 - 03:00',
    latitude: 41.3110,
    longitude: 69.2405,
    is_active: 1
  });

  const handleOpenAdd = () => {
    setEditingBranch(null);
    setFormData({
      name: '',
      address: '',
      phone: '+998 71 200 22 11',
      opening_hours: '09:00 - 03:00',
      latitude: 41.3110,
      longitude: 69.2405,
      is_active: 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      opening_hours: branch.opening_hours || '09:00 - 03:00',
      latitude: branch.latitude || 41.3110,
      longitude: branch.longitude || 69.2405,
      is_active: branch.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.address || !formData.phone) return;

    if (editingBranch) {
      onUpdateBranch(editingBranch.id, formData);
    } else {
      onAddBranch(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">FeedUp Filiallari</h2>
          <p className="text-xs text-gray-500">Fast Food oshxonalari va kuryer yetkazish markazlari</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#E31E24] hover:bg-[#C91A1F] text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi filial</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((b) => (
          <div
            key={b.id}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between gap-3 hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-gray-900">{b.name}</h3>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    b.is_active === 1
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {b.is_active === 1 ? 'Faol' : 'Nofaol'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-gray-600 mt-2">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  <span>{b.address}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <a href={`tel:${b.phone}`} className="hover:text-[#E31E24] font-medium">
                    {b.phone}
                  </a>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>Ish vaqti: {b.opening_hours}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-1 pt-2 border-t border-gray-100">
              <button
                onClick={() => handleOpenEdit(b)}
                className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`"${b.name}" filialini o'chirishga ishonchingiz komilmi?`)) {
                    onDeleteBranch(b.id);
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
                {editingBranch ? 'Filial ma\'lumotlarini tahrirlash' : 'Yangi filial qo\'shish'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Filial nomi</label>
                <input
                  type="text"
                  required
                  placeholder="FeedUp Chilonzor (Farhod)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E31E24]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Manzil</label>
                <input
                  type="text"
                  required
                  placeholder="Chilonzor tumani, Farhod bozori..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E31E24]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Telefon</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E31E24]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Ish vaqti</label>
                  <input
                    type="text"
                    value={formData.opening_hours}
                    onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E31E24]/30"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-xs font-bold text-gray-700">Faoliyat holati</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: formData.is_active === 1 ? 0 : 1 })}
                  className={`px-3 py-1 text-xs font-bold rounded-lg ${
                    formData.is_active === 1 ? 'bg-emerald-500 text-white' : 'bg-gray-300 text-gray-700'
                  }`}
                >
                  {formData.is_active === 1 ? 'Faol (Ochiq)' : 'Yopiq'}
                </button>
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

