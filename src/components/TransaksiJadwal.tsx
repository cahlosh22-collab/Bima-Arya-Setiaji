import React, { useState } from 'react';
import { 
  CalendarClock, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  X, 
  Check, 
  Ship, 
  Clock, 
  Users, 
  Package, 
  Compass,
  ArrowRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { Voyage, VoyageStatus, Ship as ShipType, PortRoute } from '../types';
import { dbManager } from '../services/dbManager';
import { useToast } from './Toast';

interface TransaksiJadwalProps {
  voyages: Voyage[];
  ships: ShipType[];
  routes: PortRoute[];
}

export const TransaksiJadwal: React.FC<TransaksiJadwalProps> = ({
  voyages,
  ships,
  routes
}) => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoyage, setEditingVoyage] = useState<Voyage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Voyage | null>(null);

  const [formData, setFormData] = useState({
    voyageNumber: '',
    shipId: ships[0]?.id || '',
    routeId: routes[0]?.id || '',
    departureTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    estimatedArrivalTime: new Date(Date.now() + 14400000).toISOString().slice(0, 16),
    status: 'Persiapan / Sandar' as VoyageStatus,
    notes: ''
  });

  const openAddModal = () => {
    setEditingVoyage(null);
    const defShip = ships[0];
    const defRoute = routes[0];
    const now = new Date();
    const depTime = new Date(now.getTime() + 2 * 3600000);
    const arrTime = new Date(depTime.getTime() + (defRoute?.estimatedHours || 2) * 3600000);

    setFormData({
      voyageNumber: `VYG-${now.getFullYear()}/IX/${Math.floor(100 + Math.random() * 900)}`,
      shipId: defShip?.id || '',
      routeId: defRoute?.id || '',
      departureTime: depTime.toISOString().slice(0, 16),
      estimatedArrivalTime: arrTime.toISOString().slice(0, 16),
      status: 'Persiapan / Sandar',
      notes: 'Pemeriksaan manifest & kargo dermaga sebelum keberangkatan.'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (v: Voyage) => {
    setEditingVoyage(v);
    setFormData({
      voyageNumber: v.voyageNumber,
      shipId: v.shipId,
      routeId: v.routeId,
      departureTime: new Date(v.departureTime).toISOString().slice(0, 16),
      estimatedArrivalTime: new Date(v.estimatedArrivalTime).toISOString().slice(0, 16),
      status: v.status,
      notes: v.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.voyageNumber.trim()) {
      showToast('Nomor Pelayaran wajib diisi!', 'error');
      return;
    }

    const ship = ships.find(s => s.id === formData.shipId);
    const route = routes.find(r => r.id === formData.routeId);

    const shipName = ship?.name || 'KM Express';
    const originPort = route?.originPort || 'Pelabuhan Asal';
    const destinationPort = route?.destinationPort || 'Pelabuhan Tujuan';

    if (editingVoyage) {
      dbManager.updateVoyage(editingVoyage.id, {
        ...formData,
        shipName,
        originPort,
        destinationPort
      });
      showToast(`Jadwal pelayaran "${formData.voyageNumber}" berhasil diperbarui.`, 'success');
    } else {
      dbManager.addVoyage({
        ...formData,
        shipName,
        originPort,
        destinationPort
      });
      showToast(`Jadwal pelayaran baru ${formData.voyageNumber} berhasil dijadwalkan.`, 'success');
    }
    setIsModalOpen(false);
  };

  const handleQuickStatus = (v: Voyage, newStatus: VoyageStatus) => {
    dbManager.updateVoyage(v.id, { status: newStatus });
    showToast(`Status pelayaran ${v.voyageNumber} diubah ke: ${newStatus}`, 'info');
  };

  const handleDelete = () => {
    if (deleteTarget) {
      dbManager.deleteVoyage(deleteTarget.id);
      showToast(`Pelayaran ${deleteTarget.voyageNumber} berhasil dihapus.`, 'info');
      setDeleteTarget(null);
    }
  };

  const filteredVoyages = voyages.filter(v => {
    const matchesSearch = v.voyageNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.shipName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.originPort.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.destinationPort.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || v.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Jadwal & Status Pelayaran Kapal (Voyage Dispatch)</h2>
            <p className="text-xs text-slate-500">Jadwal keberangkatan, tracking status berlayar, kapasitas keterisian, dan izin sandar</p>
          </div>
        </div>

        <button
          id="btn-add-voyage"
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Jadwalkan Pelayaran Baru
        </button>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-search-voyages"
            type="text"
            placeholder="Cari No. Pelayaran, kapal, atau rute tujuan..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          id="select-filter-voyage-status"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500"
        >
          <option value="all">Semua Status Pelayaran</option>
          <option value="Persiapan / Sandar">Persiapan / Sandar</option>
          <option value="Boarding & Loading">Boarding & Loading</option>
          <option value="Sedang Berlayar">Sedang Berlayar</option>
          <option value="Tiba di Pelabuhan">Tiba di Pelabuhan</option>
          <option value="Selesai">Selesai</option>
        </select>
      </div>

      {/* Cards & Table */}
      <div className="grid grid-cols-1 gap-4">
        {filteredVoyages.map(v => {
          const ship = ships.find(s => s.id === v.shipId);
          const maxPax = ship?.passengerCapacity || 1000;
          const maxTon = ship?.cargoCapacityTon || 2000;
          const paxPct = Math.min(100, Math.round((v.passengerCount / maxPax) * 100));
          const cargoPct = Math.min(100, Math.round((v.cargoWeightTon / maxTon) * 100));
          const isOverloaded = cargoPct > 95 || paxPct > 98;

          return (
            <div 
              key={v.id} 
              className="bg-white border border-slate-200 hover:border-blue-300 p-5 rounded-2xl shadow-sm transition-all space-y-4"
            >
              {/* Header Voyage Row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-mono font-bold shrink-0">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-blue-600 font-bold text-xs">{v.voyageNumber}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        v.status === 'Sedang Berlayar'
                          ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                          : v.status === 'Boarding & Loading'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : v.status === 'Tiba di Pelabuhan'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {v.status}
                      </span>
                      {isOverloaded && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" /> Peringatan Beban Kritis
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
                      {v.shipName}
                    </h3>
                  </div>
                </div>

                {/* Quick Status Changers */}
                <div className="flex items-center gap-1.5 self-start md:self-auto">
                  {v.status === 'Persiapan / Sandar' && (
                    <button
                      type="button"
                      onClick={() => handleQuickStatus(v, 'Boarding & Loading')}
                      className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-colors"
                    >
                      Mulai Boarding & Loading
                    </button>
                  )}
                  {v.status === 'Boarding & Loading' && (
                    <button
                      type="button"
                      onClick={() => handleQuickStatus(v, 'Sedang Berlayar')}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                    >
                      Lepas Tali & Berlayar
                    </button>
                  )}
                  {v.status === 'Sedang Berlayar' && (
                    <button
                      type="button"
                      onClick={() => handleQuickStatus(v, 'Tiba di Pelabuhan')}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors"
                    >
                      Konfirmasi Sandar (Tiba)
                    </button>
                  )}

                  <button
                    id={`btn-edit-voyage-${v.id}`}
                    type="button"
                    onClick={() => openEditModal(v)}
                    className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    id={`btn-delete-voyage-${v.id}`}
                    type="button"
                    onClick={() => setDeleteTarget(v)}
                    className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Voyage Route & Schedule Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Ports */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Koridor Pelayaran</span>
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <span>{v.originPort}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{v.destinationPort}</span>
                  </div>
                </div>

                {/* Departure & Arrival */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Waktu Keberangkatan & Estimasi Tiba</span>
                  <div className="space-y-0.5 text-slate-700">
                    <p>Berangkat: <strong className="text-slate-900 font-mono">{new Date(v.departureTime).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })} WIB</strong></p>
                    <p>Estimasi Tiba: <span className="font-mono text-slate-500">{new Date(v.estimatedArrivalTime).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })} WIB</span></p>
                  </div>
                </div>

                {/* Capacity Gauges */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Users className="w-3 h-3 text-blue-600" /> Penumpang Terdaftar:
                      </span>
                      <span className="font-mono text-slate-900 font-bold">{v.passengerCount} / {maxPax} ({paxPct}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${paxPct > 90 ? 'bg-rose-500' : 'bg-blue-600'}`} 
                        style={{ width: `${paxPct}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Package className="w-3 h-3 text-teal-600" /> Muatan Kargo:
                      </span>
                      <span className="font-mono text-slate-900 font-bold">{v.cargoWeightTon} / {maxTon} Ton ({cargoPct}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${cargoPct > 90 ? 'bg-amber-500' : 'bg-teal-600'}`} 
                        style={{ width: `${cargoPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {v.notes && (
                <p className="text-[11px] text-slate-500 italic">
                  Catatan Operasional: {v.notes}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-800 my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <h3 className="text-base font-bold text-slate-900">
                {editingVoyage ? 'Edit Jadwal Pelayaran' : 'Jadwalkan Pelayaran Kapal Baru'}
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
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Pelayaran (Voyage No)</label>
                  <input
                    type="text"
                    required
                    value={formData.voyageNumber}
                    onChange={e => setFormData({ ...formData, voyageNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Kapal Bertugas</label>
                  <select
                    value={formData.shipId}
                    onChange={e => setFormData({ ...formData, shipId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
                  >
                    {ships.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rute Pelayaran</label>
                  <select
                    value={formData.routeId}
                    onChange={e => setFormData({ ...formData, routeId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
                  >
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.originPort} &rarr; {r.destinationPort}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Waktu Keberangkatan</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.departureTime}
                    onChange={e => setFormData({ ...formData, departureTime: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estimasi Waktu Tiba</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.estimatedArrivalTime}
                    onChange={e => setFormData({ ...formData, estimatedArrivalTime: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Operasional</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as VoyageStatus })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
                  >
                    <option value="Persiapan / Sandar">Persiapan / Sandar</option>
                    <option value="Boarding & Loading">Boarding & Loading</option>
                    <option value="Sedang Berlayar">Sedang Berlayar</option>
                    <option value="Tiba di Pelabuhan">Tiba di Pelabuhan</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Cuaca / Navigasi</label>
                  <textarea
                    rows={2}
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
                  Simpan Jadwal
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
              <h4 className="text-base font-bold text-slate-900">Batalkan Jadwal Pelayaran</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus jadwal pelayaran <strong className="text-slate-900">{deleteTarget.voyageNumber}</strong> ({deleteTarget.shipName})?
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
                Hapus Jadwal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
