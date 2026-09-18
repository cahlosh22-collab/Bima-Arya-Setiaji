import React, { useState } from 'react';
import { 
  Boxes, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  X, 
  Check, 
  ShieldAlert, 
  Truck, 
  Package, 
  Container, 
  Flame
} from 'lucide-react';
import { CargoCategory, CargoType } from '../types';
import { dbManager } from '../services/dbManager';
import { useToast } from './Toast';

interface MasterDataKategoriProps {
  categories: CargoCategory[];
}

export const MasterDataKategori: React.FC<MasterDataKategoriProps> = ({ categories }) => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CargoCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CargoCategory | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'Kendaraan' as CargoType,
    ratePerUnitOrTon: 500000,
    unit: 'Unit' as 'Ton' | 'Unit' | 'm³' | 'TEU',
    requiresSpecialHandling: false,
    notes: ''
  });

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({
      code: `CTG-${Math.floor(10 + Math.random() * 90)}`,
      name: '',
      type: 'Kendaraan',
      ratePerUnitOrTon: 750000,
      unit: 'Unit',
      requiresSpecialHandling: false,
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CargoCategory) => {
    setEditingCategory(cat);
    setFormData({
      code: cat.code,
      name: cat.name,
      type: cat.type,
      ratePerUnitOrTon: cat.ratePerUnitOrTon,
      unit: cat.unit,
      requiresSpecialHandling: cat.requiresSpecialHandling,
      notes: cat.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      showToast('Kode dan Nama Kategori wajib diisi!', 'error');
      return;
    }

    if (editingCategory) {
      dbManager.updateCargoCategory(editingCategory.id, formData);
      showToast(`Kategori "${formData.name}" berhasil diperbarui.`, 'success');
    } else {
      dbManager.addCargoCategory(formData);
      showToast(`Kategori muatan baru berhasil ditambahkan.`, 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      dbManager.deleteCargoCategory(deleteTarget.id);
      showToast(`Kategori "${deleteTarget.name}" berhasil dihapus.`, 'info');
      setDeleteTarget(null);
    }
  };

  const filteredCategories = categories.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || c.type === filterType;
    return matchesSearch && matchesType;
  });

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getTypeIcon = (type: CargoType) => {
    switch (type) {
      case 'Kendaraan':
        return <Truck className="w-4 h-4 text-sky-400" />;
      case 'Kontainer':
        return <Container className="w-4 h-4 text-emerald-400" />;
      case 'Barang Berbahaya / DG':
        return <Flame className="w-4 h-4 text-amber-400" />;
      default:
        return <Package className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Master Kategori Muatan & Tarif</h2>
            <p className="text-xs text-slate-500">Klasifikasi jenis kargo, tarif per satuan/ton, dan regulasi penanganan khusus IMO</p>
          </div>
        </div>

        <button
          id="btn-add-cargo-category"
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tambah Kategori Baru
        </button>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-search-categories"
            type="text"
            placeholder="Cari nama kargo atau kode kategori..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          id="select-filter-category-type"
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500"
        >
          <option value="all">Semua Jenis Kargo</option>
          <option value="Kendaraan">Kendaraan</option>
          <option value="Kontainer">Kontainer</option>
          <option value="General Cargo">General Cargo</option>
          <option value="Curah">Curah</option>
          <option value="Barang Berbahaya / DG">Barang Berbahaya / DG</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Kode & Nama Kategori</th>
                <th className="py-3 px-4 font-semibold">Tipe Kargo</th>
                <th className="py-3 px-4 font-semibold">Tarif Dasar / Satuan</th>
                <th className="py-3 px-4 font-semibold">Penanganan Khusus</th>
                <th className="py-3 px-4 font-semibold">Catatan Operasional</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCategories.length > 0 ? (
                filteredCategories.map(cat => (
                  <tr key={cat.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                          {getTypeIcon(cat.type)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm tracking-tight">{cat.name}</p>
                          <span className="font-mono text-[10px] text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                            {cat.code}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-slate-700 font-medium">{cat.type}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-mono font-bold text-emerald-600 text-sm">{formatIDR(cat.ratePerUnitOrTon)}</p>
                      <p className="text-[10px] text-slate-500">per {cat.unit}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      {cat.requiresSpecialHandling ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <ShieldAlert className="w-3 h-3 text-amber-600" />
                          Wajib Lashing / Pengawasan
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Standar Operasional</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 text-[11px] max-w-xs truncate">
                      {cat.notes || '-'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`btn-edit-category-${cat.id}`}
                          type="button"
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-delete-category-${cat.id}`}
                          type="button"
                          onClick={() => setDeleteTarget(cat)}
                          className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ditemukan data kategori muatan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-800 my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <h3 className="text-base font-bold text-slate-900">
                {editingCategory ? 'Edit Kategori Muatan' : 'Tambah Kategori Muatan Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Kategori</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kargo</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as CargoType })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
                  >
                    <option value="Kendaraan">Kendaraan</option>
                    <option value="Kontainer">Kontainer</option>
                    <option value="General Cargo">General Cargo</option>
                    <option value="Curah">Curah</option>
                    <option value="Barang Berbahaya / DG">Barang Berbahaya / DG</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kategori Kargo</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Golongan V - Truk Sedang / Kendaraan Box"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tarif (IDR)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.ratePerUnitOrTon}
                    onChange={e => setFormData({ ...formData, ratePerUnitOrTon: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Satuan Ukur</label>
                  <select
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
                  >
                    <option value="Ton">Ton (Berat)</option>
                    <option value="Unit">Unit (Kendaraan)</option>
                    <option value="m³">m³ (Volume)</option>
                    <option value="TEU">TEU (Kontainer)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                  <input
                    id="checkbox-special-handling"
                    type="checkbox"
                    checked={formData.requiresSpecialHandling}
                    onChange={e => setFormData({ ...formData, requiresSpecialHandling: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="checkbox-special-handling" className="text-xs text-slate-700 cursor-pointer">
                    Kategori ini memerlukan penanganan khusus (Lashing kuat / Pemisahan Dek / Sertifikat IMDG)
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Operasional</label>
                  <textarea
                    rows={2}
                    placeholder="Instruksi pemuatan atau ketentuan penataan di dermaga..."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20"
                >
                  <Check className="w-4 h-4" />
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-slate-800">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertCircle className="w-6 h-6" />
              <h4 className="text-base font-bold text-slate-900">Konfirmasi Hapus Kategori</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus kategori <strong className="text-slate-900">{deleteTarget.name}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Kategori
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
