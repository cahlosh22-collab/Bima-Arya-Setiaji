import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  X, 
  Check, 
  Printer, 
  Truck, 
  Container, 
  ShieldAlert, 
  Flame, 
  Layers, 
  FileText,
  FileCheck
} from 'lucide-react';
import { 
  CargoItem, 
  CargoStatus, 
  DeckLocation, 
  CargoCategory, 
  Ship, 
  PortRoute, 
  Voyage 
} from '../types';
import { dbManager } from '../services/dbManager';
import { useToast } from './Toast';

interface TransaksiMuatanProps {
  cargoItems: CargoItem[];
  cargoCategories: CargoCategory[];
  ships: Ship[];
  routes: PortRoute[];
  voyages: Voyage[];
}

export const TransaksiMuatan: React.FC<TransaksiMuatanProps> = ({
  cargoItems,
  cargoCategories,
  ships,
  routes,
  voyages
}) => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCargo, setEditingCargo] = useState<CargoItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CargoItem | null>(null);
  const [selectedBL, setSelectedBL] = useState<CargoItem | null>(null);

  const [formData, setFormData] = useState({
    voyageId: voyages[0]?.id || '',
    shipperName: '',
    consigneeName: '',
    categoryId: cargoCategories[0]?.id || '',
    description: '',
    vehiclePlateNumber: '',
    weightTon: 15.0,
    volumeM3: 30.0,
    deckLocation: 'Main Deck' as DeckLocation,
    totalCost: 1500000,
    status: 'Manifested' as CargoStatus,
    isDangerousGoods: false,
    notes: ''
  });

  const openAddModal = () => {
    setEditingCargo(null);
    const defCat = cargoCategories[0];
    const defVoyage = voyages[0];

    setFormData({
      voyageId: defVoyage?.id || '',
      shipperName: '',
      consigneeName: '',
      categoryId: defCat?.id || '',
      description: '',
      vehiclePlateNumber: '',
      weightTon: 12.5,
      volumeM3: 25.0,
      deckLocation: 'Main Deck',
      totalCost: defCat ? defCat.ratePerUnitOrTon : 1500000,
      status: 'Loaded',
      isDangerousGoods: defCat?.type === 'Barang Berbahaya / DG',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: CargoItem) => {
    setEditingCargo(item);
    setFormData({
      voyageId: item.voyageId,
      shipperName: item.shipperName,
      consigneeName: item.consigneeName,
      categoryId: item.categoryId,
      description: item.description,
      vehiclePlateNumber: item.vehiclePlateNumber || '',
      weightTon: item.weightTon,
      volumeM3: item.volumeM3,
      deckLocation: item.deckLocation,
      totalCost: item.totalCost,
      status: item.status,
      isDangerousGoods: item.isDangerousGoods,
      notes: item.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.shipperName.trim() || !formData.consigneeName.trim() || !formData.description.trim()) {
      showToast('Pengirim, Penerima, dan Deskripsi muatan wajib diisi!', 'error');
      return;
    }

    const voyage = voyages.find(v => v.id === formData.voyageId);
    const ship = ships.find(s => s.id === voyage?.shipId);
    const route = routes.find(r => r.id === voyage?.routeId);
    const cat = cargoCategories.find(c => c.id === formData.categoryId);

    const shipId = ship?.id || ships[0]?.id || '';
    const shipName = ship?.name || 'KM Ferry';
    const routeId = route?.id || routes[0]?.id || '';
    const routeName = route ? `${route.originPort} -> ${route.destinationPort}` : 'Rute Reguler';
    const categoryName = cat?.name || 'General Cargo';
    const cargoType = cat?.type || 'General Cargo';

    if (editingCargo) {
      dbManager.updateCargoItem(editingCargo.id, {
        ...formData,
        shipId,
        shipName,
        routeId,
        routeName,
        categoryName,
        cargoType
      });
      showToast(`Data muatan B/L "${editingCargo.blNumber}" berhasil diperbarui.`, 'success');
    } else {
      const blNumber = `BL-${new Date().getFullYear()}-${route?.code || 'EXP'}-${Math.floor(1000 + Math.random() * 9000)}`;
      dbManager.addCargoItem({
        ...formData,
        blNumber,
        shipId,
        shipName,
        routeId,
        routeName,
        categoryName,
        cargoType
      });
      showToast(`Resi muatan baru ${blNumber} berhasil diterbitkan.`, 'success');
    }
    setIsModalOpen(false);
  };

  const handleQuickStatus = (item: CargoItem, newStatus: CargoStatus) => {
    dbManager.updateCargoItem(item.id, { status: newStatus });
    showToast(`Status B/L ${item.blNumber} diubah menjadi: ${newStatus}`, 'info');
  };

  const handleDelete = () => {
    if (deleteTarget) {
      dbManager.deleteCargoItem(deleteTarget.id);
      showToast(`Resi muatan ${deleteTarget.blNumber} berhasil dihapus.`, 'info');
      setDeleteTarget(null);
    }
  };

  const filteredCargo = cargoItems.filter(c => {
    const matchesSearch = c.blNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.shipperName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.consigneeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.vehiclePlateNumber && c.vehiclePlateNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesType = filterType === 'all' || c.cargoType === filterType;
    return matchesSearch && matchesStatus && matchesType;
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
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Transaksi Muatan Kapal (Bill of Lading)</h2>
            <p className="text-xs text-slate-500">Pencatatan muatan kargo, kendaraan, penataan deck, dan pengawasan beban tonase aman</p>
          </div>
        </div>

        <button
          id="btn-add-cargo-manifest"
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tambah Resi Muatan (B/L)
        </button>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-search-cargo"
            type="text"
            placeholder="Cari nomor B/L, pengirim, penerima, plat nomor kendaraan..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            id="select-filter-cargo-type"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Semua Tipe Kargo</option>
            <option value="Kendaraan">Kendaraan</option>
            <option value="Kontainer">Kontainer</option>
            <option value="General Cargo">General Cargo</option>
            <option value="Barang Berbahaya / DG">Barang Berbahaya / DG</option>
          </select>

          <select
            id="select-filter-cargo-status"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Semua Status Muatan</option>
            <option value="Manifested">Manifested</option>
            <option value="Loaded">Loaded (Dimuat)</option>
            <option value="Stowed">Stowed (Tertata/Lashing)</option>
            <option value="Discharged">Discharged (Bongkar)</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">No. B/L & Muatan</th>
                <th className="py-3 px-4 font-semibold">Pengirim & Penerima</th>
                <th className="py-3 px-4 font-semibold">Berat & Volume</th>
                <th className="py-3 px-4 font-semibold">Alokasi Dek</th>
                <th className="py-3 px-4 font-semibold">Biaya Muatan</th>
                <th className="py-3 px-4 font-semibold">Status Muat</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCargo.length > 0 ? (
                filteredCargo.map(item => (
                  <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-blue-600 font-bold text-[11px]">
                            {item.blNumber}
                          </span>
                          {item.isDangerousGoods && (
                            <span className="p-0.5 rounded bg-rose-50 border border-rose-200 text-rose-600" title="Barang Berbahaya IMDG">
                              <Flame className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-slate-900 text-sm mt-0.5">{item.description}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                          <span>{item.categoryName}</span>
                          {item.vehiclePlateNumber && (
                            <span className="bg-slate-100 border border-slate-200 font-mono px-1 rounded text-slate-800 font-semibold">
                              {item.vehiclePlateNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="text-slate-900 font-medium">Shipper: {item.shipperName}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">Consignee: {item.consigneeName}</p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      <p className="font-mono font-bold text-slate-900 text-sm">{item.weightTon} <span className="font-normal text-slate-500 text-xs">Ton</span></p>
                      <p className="text-[11px] text-slate-500 font-mono">{item.volumeM3} m³</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                        <Layers className="w-3 h-3 text-blue-600" />
                        {item.deckLocation}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1">{item.shipName}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-mono font-bold text-emerald-600">{formatIDR(item.totalCost)}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border w-fit ${
                          item.status === 'Stowed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.status === 'Loaded'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : item.status === 'Discharged'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : item.status === 'Manifested'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {item.status}
                        </span>

                        {/* Quick switch actions */}
                        {item.status === 'Manifested' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatus(item, 'Loaded')}
                            className="text-[10px] text-blue-600 hover:underline text-left font-medium"
                          >
                            &rarr; Dimuat (Loaded)
                          </button>
                        )}
                        {item.status === 'Loaded' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatus(item, 'Stowed')}
                            className="text-[10px] text-emerald-600 hover:underline text-left font-medium"
                          >
                            &rarr; Dilashing (Stowed)
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`btn-view-bl-${item.id}`}
                          type="button"
                          onClick={() => setSelectedBL(item)}
                          className="p-1.5 bg-slate-50 hover:bg-blue-50 text-blue-600 border border-slate-200 rounded-lg transition-colors"
                          title="Cetak Surat Muatan B/L"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-edit-cargo-${item.id}`}
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 rounded-lg transition-colors"
                          title="Edit Muatan"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-delete-cargo-${item.id}`}
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 rounded-lg transition-colors"
                          title="Hapus Resi Muatan"
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
                    Tidak ditemukan data muatan kapal.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-800 my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <h3 className="text-base font-bold text-slate-900">
                {editingCargo ? 'Edit Data Muatan Kapal' : 'Penerbitan Surat Muatan Kapal / B/L Baru'}
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Jadwal Pelayaran</label>
                  <select
                    value={formData.voyageId}
                    onChange={e => setFormData({ ...formData, voyageId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
                  >
                    {voyages.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.voyageNumber} - {v.shipName} ({v.originPort} &rarr; {v.destinationPort})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Pengirim (Shipper)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PT Samudera Logistik"
                    value={formData.shipperName}
                    onChange={e => setFormData({ ...formData, shipperName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Penerima (Consignee)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: CV Distribusi Lampung"
                    value={formData.consigneeName}
                    onChange={e => setFormData({ ...formData, consigneeName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Muatan</label>
                  <select
                    value={formData.categoryId}
                    onChange={e => {
                      const cId = e.target.value;
                      const cat = cargoCategories.find(c => c.id === cId);
                      setFormData({
                        ...formData,
                        categoryId: cId,
                        totalCost: cat ? cat.ratePerUnitOrTon : formData.totalCost,
                        isDangerousGoods: cat?.type === 'Barang Berbahaya / DG'
                      });
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
                  >
                    {cargoCategories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Plat Nomor Kendaraan / ID Kontainer</label>
                  <input
                    type="text"
                    placeholder="Contoh: B 9842 UEX atau TEMU 482109"
                    value={formData.vehiclePlateNumber}
                    onChange={e => setFormData({ ...formData, vehiclePlateNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Rinci Muatan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Truk Tronton Box isi Minuman Kemasan & Sembako"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Berat Muatan (Ton)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={formData.weightTon}
                    onChange={e => setFormData({ ...formData, weightTon: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Volume Ruang (m³)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={formData.volumeM3}
                    onChange={e => setFormData({ ...formData, volumeM3: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Alokasi Dek Kapal</label>
                  <select
                    value={formData.deckLocation}
                    onChange={e => setFormData({ ...formData, deckLocation: e.target.value as DeckLocation })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
                  >
                    <option value="Main Deck">Main Deck (Dek Utama)</option>
                    <option value="Lower Deck">Lower Deck (Dek Bawah)</option>
                    <option value="Upper Deck">Upper Deck (Dek Atas)</option>
                    <option value="Weather Deck">Weather Deck (Dek Terbuka / Cuaca)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Biaya Ongkos Muat (IDR)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.totalCost}
                    onChange={e => setFormData({ ...formData, totalCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Muatan</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as CargoStatus })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
                  >
                    <option value="Manifested">Manifested</option>
                    <option value="Loaded">Loaded (Dimuat)</option>
                    <option value="Stowed">Stowed (Tertata & Lashing)</option>
                    <option value="Discharged">Discharged (Bongkar Muat)</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="checkbox-dangerous-goods"
                    type="checkbox"
                    checked={formData.isDangerousGoods}
                    onChange={e => setFormData({ ...formData, isDangerousGoods: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <label htmlFor="checkbox-dangerous-goods" className="text-xs text-rose-700 font-semibold cursor-pointer flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-rose-600" />
                    Muatan Berbahaya (IMDG Dangerous Goods)
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Lashing & Penempatan</label>
                  <textarea
                    rows={2}
                    placeholder="Instruksi pengikatan lashing kawat atau posisi baris dek..."
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
                  Simpan Data Muatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BILL OF LADING PRINT PREVIEW */}
      {selectedBL && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="bg-blue-600 text-white p-5 border-b-4 border-blue-800">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-blue-100 font-bold block">
                    KEMENTERIAN PERHUBUNGAN REPUBLIK INDONESIA
                  </span>
                  <h3 className="text-lg font-bold">SURAT MUATAN KAPAL (BILL OF LADING)</h3>
                  <p className="text-xs text-blue-100 font-mono">No: {selectedBL.blNumber}</p>
                </div>
                <FileCheck className="w-8 h-8 text-blue-200" />
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Pengirim (Shipper)</span>
                  <p className="font-bold text-slate-900">{selectedBL.shipperName}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Penerima (Consignee)</span>
                  <p className="font-bold text-slate-900">{selectedBL.consigneeName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Kapal Pengangkut</span>
                  <p className="font-semibold text-slate-800">{selectedBL.shipName}</p>
                  <p className="text-[11px] text-slate-500">{selectedBL.routeName}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Posisi Dek Muat</span>
                  <p className="font-semibold text-slate-800">{selectedBL.deckLocation}</p>
                  <p className="text-[11px] text-emerald-600 font-bold">Status: {selectedBL.status}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Rincian Muatan</span>
                <p className="font-bold text-slate-900 text-sm">{selectedBL.description}</p>
                <div className="flex gap-4 mt-1 text-slate-600 font-mono">
                  <span>Berat: <strong>{selectedBL.weightTon} Ton</strong></span>
                  <span>Volume: <strong>{selectedBL.volumeM3} m³</strong></span>
                  {selectedBL.vehiclePlateNumber && <span>Plat: <strong>{selectedBL.vehiclePlateNumber}</strong></span>}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500">Total Ongkos Angkut:</span>
                <span className="font-mono text-base font-bold text-slate-900">{formatIDR(selectedBL.totalCost)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedBL(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Surat Muatan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-slate-800">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertCircle className="w-6 h-6" />
              <h4 className="text-base font-bold text-slate-900">Hapus Resi Muatan</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus resi muatan <strong className="text-slate-900">{deleteTarget.blNumber}</strong> ({deleteTarget.description})?
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
                Hapus Resi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
