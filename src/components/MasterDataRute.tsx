import React, { useState } from 'react';
import { 
  Compass, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  X, 
  Check, 
  MapPin, 
  Navigation,
  Clock,
  ArrowRight
} from 'lucide-react';
import { PortRoute, RouteStatus } from '../types';
import { dbManager } from '../services/dbManager';
import { useToast } from './Toast';

interface MasterDataRuteProps {
  routes: PortRoute[];
}

export const MasterDataRute: React.FC<MasterDataRuteProps> = ({ routes }) => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<PortRoute | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PortRoute | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    originPort: '',
    destinationPort: '',
    seaDistanceNm: 20,
    estimatedHours: 2.5,
    basePassengerFare: 25000,
    baseCargoFarePerTon: 80000,
    status: 'Aktif' as RouteStatus
  });

  const openAddModal = () => {
    setEditingRoute(null);
    setFormData({
      code: `RTE-${Math.floor(10 + Math.random() * 90)}`,
      originPort: '',
      destinationPort: '',
      seaDistanceNm: 25,
      estimatedHours: 3,
      basePassengerFare: 30000,
      baseCargoFarePerTon: 95000,
      status: 'Aktif'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (route: PortRoute) => {
    setEditingRoute(route);
    setFormData({
      code: route.code,
      originPort: route.originPort,
      destinationPort: route.destinationPort,
      seaDistanceNm: route.seaDistanceNm,
      estimatedHours: route.estimatedHours,
      basePassengerFare: route.basePassengerFare,
      baseCargoFarePerTon: route.baseCargoFarePerTon,
      status: route.status
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.originPort.trim() || !formData.destinationPort.trim()) {
      showToast('Pelabuhan Asal dan Pelabuhan Tujuan wajib diisi!', 'error');
      return;
    }

    if (editingRoute) {
      dbManager.updateRoute(editingRoute.id, formData);
      showToast(`Rute "${formData.originPort} -> ${formData.destinationPort}" berhasil diperbarui.`, 'success');
    } else {
      dbManager.addRoute(formData);
      showToast(`Rute pelayaran baru berhasil ditambahkan.`, 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      dbManager.deleteRoute(deleteTarget.id);
      showToast(`Rute "${deleteTarget.code}" berhasil dihapus.`, 'info');
      setDeleteTarget(null);
    }
  };

  const filteredRoutes = routes.filter(r => {
    const matchesSearch = r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.originPort.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.destinationPort.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Master Data Rute & Pelabuhan</h2>
            <p className="text-xs text-slate-500">Jalur pelayaran antar-pulau, jarak tempuh nautical miles, dan acuan tarif dasar</p>
          </div>
        </div>

        <button
          id="btn-add-route"
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tambah Rute Baru
        </button>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-search-routes"
            type="text"
            placeholder="Cari pelabuhan asal, tujuan, atau kode rute..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          id="select-filter-route-status"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500"
        >
          <option value="all">Semua Status Rute</option>
          <option value="Aktif">Aktif</option>
          <option value="Ditutup Sementara">Ditutup Sementara</option>
          <option value="Cuaca Buruk">Peringatan Cuaca Buruk</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Kode & Koridor Pelayaran</th>
                <th className="py-3 px-4 font-semibold">Jarak Tempuh (NM)</th>
                <th className="py-3 px-4 font-semibold">Estimasi Waktu</th>
                <th className="py-3 px-4 font-semibold">Tarif Dasar Penumpang</th>
                <th className="py-3 px-4 font-semibold">Tarif Dasar Kargo/Ton</th>
                <th className="py-3 px-4 font-semibold">Status Koridor</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRoutes.length > 0 ? (
                filteredRoutes.map(route => (
                  <tr key={route.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded text-[11px]">
                          {route.code}
                        </span>
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                          <span>{route.originPort}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{route.destinationPort}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-mono">
                      {route.seaDistanceNm} <span className="text-slate-400 text-[11px]">NM</span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{route.estimatedHours} Jam</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-emerald-600 font-semibold">
                      {formatIDR(route.basePassengerFare)}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-amber-600 font-semibold">
                      {formatIDR(route.baseCargoFarePerTon)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        route.status === 'Aktif'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : route.status === 'Cuaca Buruk'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {route.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`btn-edit-route-${route.id}`}
                          type="button"
                          onClick={() => openEditModal(route)}
                          className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-delete-route-${route.id}`}
                          type="button"
                          onClick={() => setDeleteTarget(route)}
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
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ditemukan data rute pelayaran.
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
                {editingRoute ? 'Edit Data Rute Pelayaran' : 'Tambah Rute Pelayaran Baru'}
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Rute</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Rute</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as RouteStatus })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Ditutup Sementara">Ditutup Sementara</option>
                    <option value="Cuaca Buruk">Cuaca Buruk</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pelabuhan Asal</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Merak (Banten)"
                    value={formData.originPort}
                    onChange={e => setFormData({ ...formData, originPort: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pelabuhan Tujuan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bakauheni (Lampung)"
                    value={formData.destinationPort}
                    onChange={e => setFormData({ ...formData, destinationPort: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jarak Tempuh (Mil Laut / NM)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={formData.seaDistanceNm}
                    onChange={e => setFormData({ ...formData, seaDistanceNm: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estimasi Waktu Tempuh (Jam)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={formData.estimatedHours}
                    onChange={e => setFormData({ ...formData, estimatedHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tarif Dasar Penumpang (IDR)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.basePassengerFare}
                    onChange={e => setFormData({ ...formData, basePassengerFare: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tarif Kargo per Ton (IDR)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.baseCargoFarePerTon}
                    onChange={e => setFormData({ ...formData, baseCargoFarePerTon: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500 font-mono"
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
                  Simpan Rute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-slate-800">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertCircle className="w-6 h-6" />
              <h4 className="text-base font-bold text-slate-900">Konfirmasi Hapus Rute</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus rute <strong className="text-slate-900">{deleteTarget.originPort} &rarr; {deleteTarget.destinationPort}</strong>?
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
                Hapus Rute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
