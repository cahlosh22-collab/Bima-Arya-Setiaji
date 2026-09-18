import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  X, 
  Check, 
  QrCode, 
  Printer, 
  ArrowRight,
  UserCheck,
  CreditCard,
  Luggage,
  Calendar
} from 'lucide-react';
import { 
  Passenger, 
  TicketStatus, 
  TicketClass, 
  PassengerCategory, 
  Ship, 
  PortRoute, 
  Voyage 
} from '../types';
import { dbManager } from '../services/dbManager';
import { useToast } from './Toast';

interface TransaksiPenumpangProps {
  passengers: Passenger[];
  ships: Ship[];
  routes: PortRoute[];
  voyages: Voyage[];
}

export const TransaksiPenumpang: React.FC<TransaksiPenumpangProps> = ({
  passengers,
  ships,
  routes,
  voyages
}) => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterShip, setFilterShip] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPassenger, setEditingPassenger] = useState<Passenger | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Passenger | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Passenger | null>(null);

  const [formData, setFormData] = useState({
    voyageId: voyages[0]?.id || '',
    passengerName: '',
    idCardNumber: '',
    gender: 'L' as 'L' | 'P',
    age: 30,
    category: 'Dewasa' as PassengerCategory,
    classType: 'Ekonomi' as TicketClass,
    seatOrCabin: 'Kamar E-01',
    fare: 150000,
    bookingDate: new Date().toISOString().split('T')[0],
    status: 'Booked' as TicketStatus,
    luggageWeightKg: 15
  });

  const openAddModal = () => {
    setEditingPassenger(null);
    const defVoyage = voyages[0];
    const defShip = ships.find(s => s.id === defVoyage?.shipId);
    const defRoute = routes.find(r => r.id === defVoyage?.routeId);

    setFormData({
      voyageId: defVoyage?.id || '',
      passengerName: '',
      idCardNumber: '',
      gender: 'L',
      age: 28,
      category: 'Dewasa',
      classType: 'Ekonomi',
      seatOrCabin: 'Dek Ekonomi ' + Math.floor(10 + Math.random() * 80),
      fare: defRoute?.basePassengerFare || 120000,
      bookingDate: new Date().toISOString().split('T')[0],
      status: 'Check-in',
      luggageWeightKg: 10
    });
    setIsModalOpen(true);
  };

  const openEditModal = (pax: Passenger) => {
    setEditingPassenger(pax);
    setFormData({
      voyageId: pax.voyageId,
      passengerName: pax.passengerName,
      idCardNumber: pax.idCardNumber,
      gender: pax.gender,
      age: pax.age,
      category: pax.category,
      classType: pax.classType,
      seatOrCabin: pax.seatOrCabin,
      fare: pax.fare,
      bookingDate: pax.bookingDate,
      status: pax.status,
      luggageWeightKg: pax.luggageWeightKg
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.passengerName.trim() || !formData.idCardNumber.trim()) {
      showToast('Nama Penumpang dan NIK/No Identitas wajib diisi!', 'error');
      return;
    }

    const voyage = voyages.find(v => v.id === formData.voyageId);
    const ship = ships.find(s => s.id === voyage?.shipId);
    const route = routes.find(r => r.id === voyage?.routeId);

    const shipId = ship?.id || ships[0]?.id || '';
    const shipName = ship?.name || 'KM Express';
    const routeId = route?.id || routes[0]?.id || '';
    const routeName = route ? `${route.originPort} -> ${route.destinationPort}` : 'Rute Reguler';

    if (editingPassenger) {
      dbManager.updatePassenger(editingPassenger.id, {
        ...formData,
        shipId,
        shipName,
        routeId,
        routeName
      });
      showToast(`Data tiket "${editingPassenger.ticketNumber}" berhasil diperbarui.`, 'success');
    } else {
      const ticketNumber = `TIX-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(100 + Math.random() * 900)}`;
      dbManager.addPassenger({
        ...formData,
        ticketNumber,
        shipId,
        shipName,
        routeId,
        routeName
      });
      showToast(`Tiket penumpang baru ${ticketNumber} berhasil diterbitkan.`, 'success');
    }
    setIsModalOpen(false);
  };

  const handleQuickStatus = (pax: Passenger, newStatus: TicketStatus) => {
    dbManager.updatePassenger(pax.id, { status: newStatus });
    showToast(`Status penumpang ${pax.passengerName} diubah menjadi: ${newStatus}`, 'info');
  };

  const handleDelete = () => {
    if (deleteTarget) {
      dbManager.deletePassenger(deleteTarget.id);
      showToast(`Tiket ${deleteTarget.ticketNumber} berhasil dihapus.`, 'info');
      setDeleteTarget(null);
    }
  };

  const filteredPassengers = passengers.filter(p => {
    const matchesSearch = p.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.idCardNumber.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchesShip = filterShip === 'all' || p.shipId === filterShip;
    return matchesSearch && matchesStatus && matchesShip;
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
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Transaksi Manifest & Tiket Penumpang</h2>
            <p className="text-xs text-slate-500">Penerbitan tiket, verifikasi identitas (NIK), alokasi kabin, dan pemantauan boarding</p>
          </div>
        </div>

        <button
          id="btn-add-passenger"
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Terbitkan Tiket Baru
        </button>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-search-passengers"
            type="text"
            placeholder="Cari nama penumpang, No Tiket, atau NIK..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            id="select-filter-pax-ship"
            value={filterShip}
            onChange={e => setFilterShip(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Semua Kapal</option>
            {ships.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            id="select-filter-pax-status"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Semua Status Tiket</option>
            <option value="Booked">Booked (Dipesan)</option>
            <option value="Check-in">Check-in</option>
            <option value="Boarded">Boarded (On-Board)</option>
            <option value="Cancelled">Cancelled (Dibatalkan)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">No. Tiket & Penumpang</th>
                <th className="py-3 px-4 font-semibold">NIK & Kategori</th>
                <th className="py-3 px-4 font-semibold">Pelayaran & Kapal</th>
                <th className="py-3 px-4 font-semibold">Kelas & Kursi</th>
                <th className="py-3 px-4 font-semibold">Tarif Tiket</th>
                <th className="py-3 px-4 font-semibold">Status Boarding</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPassengers.length > 0 ? (
                filteredPassengers.map(pax => (
                  <tr key={pax.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-mono text-blue-600 font-bold text-[11px] block">
                          {pax.ticketNumber}
                        </span>
                        <p className="font-bold text-slate-900 text-sm mt-0.5">{pax.passengerName}</p>
                        <p className="text-[10px] text-slate-500">
                          {pax.gender === 'L' ? 'Laki-laki' : 'Perempuan'} ({pax.age} Thn)
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-mono text-slate-700">{pax.idCardNumber}</p>
                      <span className="inline-block mt-0.5 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                        {pax.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{pax.shipName}</p>
                      <p className="text-[11px] text-slate-500">{pax.routeName}</p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      <p className="font-medium text-slate-900">{pax.classType}</p>
                      <p className="text-[11px] text-blue-600 font-mono font-medium">{pax.seatOrCabin}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-mono font-bold text-emerald-600">{formatIDR(pax.fare)}</p>
                      <p className="text-[10px] text-slate-500">Bagasi: {pax.luggageWeightKg} Kg</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border w-fit ${
                          pax.status === 'Boarded'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : pax.status === 'Check-in'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : pax.status === 'Booked'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {pax.status}
                        </span>

                        {/* Quick switch actions */}
                        {pax.status === 'Booked' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatus(pax, 'Check-in')}
                            className="text-[10px] text-blue-600 hover:underline text-left font-medium"
                          >
                            &rarr; Set Check-in
                          </button>
                        )}
                        {pax.status === 'Check-in' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatus(pax, 'Boarded')}
                            className="text-[10px] text-emerald-600 hover:underline text-left font-medium"
                          >
                            &rarr; Set Boarded
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`btn-view-ticket-${pax.id}`}
                          type="button"
                          onClick={() => setSelectedTicket(pax)}
                          className="p-1.5 bg-slate-50 hover:bg-blue-50 text-blue-600 border border-slate-200 rounded-lg transition-colors"
                          title="Cetak Boarding Pass"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-edit-pax-${pax.id}`}
                          type="button"
                          onClick={() => openEditModal(pax)}
                          className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 rounded-lg transition-colors"
                          title="Edit Tiket"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-delete-pax-${pax.id}`}
                          type="button"
                          onClick={() => setDeleteTarget(pax)}
                          className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 rounded-lg transition-colors"
                          title="Hapus Tiket"
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
                    Tidak ditemukan data manifest penumpang.
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
                {editingPassenger ? 'Edit Tiket Penumpang' : 'Penerbitan Tiket Manifest Penumpang Baru'}
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
                    onChange={e => {
                      const vId = e.target.value;
                      const selectedV = voyages.find(v => v.id === vId);
                      const route = routes.find(r => r.id === selectedV?.routeId);
                      setFormData({
                        ...formData,
                        voyageId: vId,
                        fare: route?.basePassengerFare || formData.fare
                      });
                    }}
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap Penumpang</label>
                  <input
                    type="text"
                    required
                    placeholder="Sesuai KTP / Paspor"
                    value={formData.passengerName}
                    onChange={e => setFormData({ ...formData, passengerName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Identitas (NIK / Paspor)</label>
                  <input
                    type="text"
                    required
                    placeholder="16 Digit NIK KTP"
                    value={formData.idCardNumber}
                    onChange={e => setFormData({ ...formData, idCardNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Usia & Kategori</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      value={formData.age}
                      onChange={e => setFormData({ ...formData, age: Number(e.target.value) })}
                      className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500 font-mono"
                    />
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
                    >
                      <option value="Dewasa">Dewasa (&gt;12 Thn)</option>
                      <option value="Anak">Anak (2-11 Thn)</option>
                      <option value="Bayi">Bayi (&lt;2 Thn)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas Tiket</label>
                  <select
                    value={formData.classType}
                    onChange={e => setFormData({ ...formData, classType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
                  >
                    <option value="Ekonomi">Ekonomi</option>
                    <option value="Bisnis">Bisnis</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Kursi / Kabin</label>
                  <input
                    type="text"
                    placeholder="Contoh: Kabin B-14 atau Kursi E-32"
                    value={formData.seatOrCabin}
                    onChange={e => setFormData({ ...formData, seatOrCabin: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Biaya Tiket (IDR)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.fare}
                    onChange={e => setFormData({ ...formData, fare: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Tiket</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
                  >
                    <option value="Booked">Booked (Pemesanan)</option>
                    <option value="Check-in">Check-in</option>
                    <option value="Boarded">Boarded (On-Board)</option>
                    <option value="Cancelled">Cancelled (Dibatalkan)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Berat Bagasi (Kg)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.luggageWeightKg}
                    onChange={e => setFormData({ ...formData, luggageWeightKg: Number(e.target.value) })}
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
                  Simpan & Cetak Tiket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOARDING PASS / PRINT PREVIEW MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
            {/* Ticket Header */}
            <div className="bg-blue-600 text-white p-5 flex items-center justify-between border-b-4 border-blue-800">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-100 block">
                  BOARDING PASS RESMI KAPAL LAUT
                </span>
                <h3 className="text-lg font-bold">{selectedTicket.shipName}</h3>
                <p className="text-xs text-blue-100">{selectedTicket.routeName}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                <QrCode className="w-6 h-6" />
              </div>
            </div>

            {/* Ticket Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="flex justify-between pb-3 border-b border-dashed border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Nama Penumpang</span>
                  <p className="font-bold text-sm text-slate-900">{selectedTicket.passengerName}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block uppercase">No. Tiket</span>
                  <p className="font-mono font-bold text-blue-600">{selectedTicket.ticketNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pb-3 border-b border-dashed border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Kelas</span>
                  <p className="font-bold text-slate-800">{selectedTicket.classType}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Kabin / Seat</span>
                  <p className="font-bold font-mono text-blue-600">{selectedTicket.seatOrCabin}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block uppercase">Status</span>
                  <span className="font-bold text-emerald-600">{selectedTicket.status}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>NIK: {selectedTicket.idCardNumber}</span>
                <span className="font-mono font-bold text-slate-900">{formatIDR(selectedTicket.fare)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
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
                Cetak Boarding Pass
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
              <h4 className="text-base font-bold text-slate-900">Batalkan & Hapus Tiket</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus tiket <strong className="text-slate-900">{deleteTarget.ticketNumber}</strong> ({deleteTarget.passengerName})?
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
                Hapus Tiket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
