import React, { useState } from 'react';
import { 
  Ship, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Anchor, 
  AlertCircle, 
  X, 
  Check, 
  ShipWheel,
  Layers,
  Gauge
} from 'lucide-react';
import { Ship as ShipType, ShipType as ShipTypeEnum, ShipStatus } from '../types';
import { dbManager } from '../services/dbManager';
import { useToast } from './Toast';

interface MasterDataKapalProps {
  ships: ShipType[];
}

export const MasterDataKapal: React.FC<MasterDataKapalProps> = ({ ships }) => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShip, setEditingShip] = useState<ShipType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ShipType | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'Ferry RORO' as ShipTypeEnum,
    callSign: '',
    registrationNumber: '',
    grossTonnage: 10000,
    deadweightTon: 4000,
    passengerCapacity: 1000,
    cargoCapacityTon: 2500,
    vehicleCapacityUnit: 150,
    yearBuilt: 2018,
    status: 'Beroperasi' as ShipStatus,
    currentPort: 'Pelabuhan Merak'
  });

  const openAddModal = () => {
    setEditingShip(null);
    setFormData({
      code: `KMP-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      type: 'Ferry RORO',
      callSign: 'YD' + Math.random().toString(36).substring(2, 4).toUpperCase(),
      registrationNumber: `ID-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      grossTonnage: 12000,
      deadweightTon: 4500,
      passengerCapacity: 1200,
      cargoCapacityTon: 3000,
      vehicleCapacityUnit: 200,
      yearBuilt: 2019,
      status: 'Beroperasi',
      currentPort: 'Pelabuhan Merak'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (ship: ShipType) => {
    setEditingShip(ship);
    setFormData({
      code: ship.code,
      name: ship.name,
      type: ship.type,
      callSign: ship.callSign,
      registrationNumber: ship.registrationNumber,
      grossTonnage: ship.grossTonnage,
      deadweightTon: ship.deadweightTon,
      passengerCapacity: ship.passengerCapacity,
      cargoCapacityTon: ship.cargoCapacityTon,
      vehicleCapacityUnit: ship.vehicleCapacityUnit,
      yearBuilt: ship.yearBuilt,
      status: ship.status,
      currentPort: ship.currentPort
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      showToast('Kode Kapal dan Nama Kapal wajib diisi!', 'error');
      return;
    }

    if (editingShip) {
      dbManager.updateShip(editingShip.id, formData);
      showToast(`Data kapal "${formData.name}" berhasil diperbarui.`, 'success');
    } else {
      dbManager.addShip(formData);
      showToast(`Kapal baru "${formData.name}" berhasil didaftarkan.`, 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      dbManager.deleteShip(deleteTarget.id);
      showToast(`Kapal "${deleteTarget.name}" berhasil dihapus dari sistem.`, 'info');
      setDeleteTarget(null);
    }
  };

  // Filter & Search
  const filteredShips = ships.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.callSign.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || s.type === filterType;
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Master Data Armada Kapal</h2>
              <p className="text-xs text-slate-500">Registrasi armada, spesifikasi teknis tonase (GT/DWT), dan daya angkut</p>
            </div>
          </div>
        </div>

        <button
          id="btn-add-ship"
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tambah Kapal Baru
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-search-ships"
            type="text"
            placeholder="Cari nama kapal, kode, atau call sign..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            id="select-filter-ship-type"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Semua Tipe Kapal</option>
            <option value="Ferry RORO">Ferry RORO</option>
            <option value="Kapal Penumpang Pelni">Kapal Penumpang Pelni</option>
            <option value="Kapal Kargo Kontainer">Kapal Kargo Kontainer</option>
            <option value="Kapal Cepat / Fast Boat">Kapal Cepat / Fast Boat</option>
          </select>

          <select
            id="select-filter-ship-status"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Semua Status</option>
            <option value="Beroperasi">Beroperasi</option>
            <option value="Bersandar">Bersandar</option>
            <option value="Docking / Perawatan">Docking / Perawatan</option>
            <option value="Siaga">Siaga</option>
          </select>
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Kapal & Identitas</th>
                <th className="py-3 px-4 font-semibold">Tipe & Pangkalan</th>
                <th className="py-3 px-4 font-semibold">Spesifikasi Tonase</th>
                <th className="py-3 px-4 font-semibold">Kapasitas Muat</th>
                <th className="py-3 px-4 font-semibold">Status Operasional</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi (CRUD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShips.length > 0 ? (
                filteredShips.map(ship => (
                  <tr key={ship.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                          <ShipWheel className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm tracking-tight">{ship.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-mono">
                            <span className="bg-blue-50 px-1.5 py-0.5 rounded text-blue-700 border border-blue-100">{ship.code}</span>
                            <span>CS: {ship.callSign}</span>
                            <span>Th: {ship.yearBuilt}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="text-slate-900 font-medium">{ship.type}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">{ship.currentPort}</p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      <p className="font-mono">GT: <strong className="text-slate-900">{ship.grossTonnage.toLocaleString('id-ID')}</strong></p>
                      <p className="font-mono text-slate-500 text-[11px]">DWT: {ship.deadweightTon.toLocaleString('id-ID')} Ton</p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      <p className="font-semibold text-slate-900">{ship.passengerCapacity.toLocaleString('id-ID')} <span className="text-slate-500 font-normal text-[11px]">Pax</span></p>
                      <p className="text-[11px] text-slate-500">
                        Kargo: {ship.cargoCapacityTon.toLocaleString('id-ID')} Ton | Kendaraan: {ship.vehicleCapacityUnit} Unit
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                        ship.status === 'Beroperasi'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : ship.status === 'Bersandar'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : ship.status === 'Docking / Perawatan'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {ship.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`btn-edit-ship-${ship.id}`}
                          type="button"
                          onClick={() => openEditModal(ship)}
                          className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 rounded-lg transition-colors"
                          title="Edit Data Kapal"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-delete-ship-${ship.id}`}
                          type="button"
                          onClick={() => setDeleteTarget(ship)}
                          className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 rounded-lg transition-colors"
                          title="Hapus Kapal"
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
                    Tidak ditemukan data armada kapal sesuai pencarian/filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-800 my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <h3 className="text-base font-bold text-slate-900">
                {editingShip ? 'Edit Data Kapal' : 'Pendaftaran Armada Kapal Baru'}
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Kapal</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kapal</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: KMP Portlink VII"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Kapal</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as ShipTypeEnum })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
                  >
                    <option value="Ferry RORO">Ferry RORO</option>
                    <option value="Kapal Penumpang Pelni">Kapal Penumpang Pelni</option>
                    <option value="Kapal Kargo Kontainer">Kapal Kargo Kontainer</option>
                    <option value="Kapal Cepat / Fast Boat">Kapal Cepat / Fast Boat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Call Sign</label>
                  <input
                    type="text"
                    placeholder="YDYP"
                    value={formData.callSign}
                    onChange={e => setFormData({ ...formData, callSign: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gross Tonnage (GT)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.grossTonnage}
                    onChange={e => setFormData({ ...formData, grossTonnage: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Deadweight Ton (DWT)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.deadweightTon}
                    onChange={e => setFormData({ ...formData, deadweightTon: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kapasitas Penumpang (Pax)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.passengerCapacity}
                    onChange={e => setFormData({ ...formData, passengerCapacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kapasitas Kargo (Ton)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.cargoCapacityTon}
                    onChange={e => setFormData({ ...formData, cargoCapacityTon: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kapasitas Kendaraan (Unit)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.vehicleCapacityUnit}
                    onChange={e => setFormData({ ...formData, vehicleCapacityUnit: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Operasional</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as ShipStatus })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
                  >
                    <option value="Beroperasi">Beroperasi</option>
                    <option value="Bersandar">Bersandar</option>
                    <option value="Docking / Perawatan">Docking / Perawatan</option>
                    <option value="Siaga">Siaga</option>
                  </select>
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
                  Simpan Data Kapal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-slate-800">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertCircle className="w-6 h-6" />
              <h4 className="text-base font-bold text-slate-900">Konfirmasi Hapus Kapal</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus kapal <strong className="text-slate-900">{deleteTarget.name} ({deleteTarget.code})</strong>? Tindakan ini tidak dapat dibatalkan.
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
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
