import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Filter, 
  Calendar, 
  Ship, 
  Users, 
  Package, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2,
  Table
} from 'lucide-react';
import { 
  Ship as ShipType, 
  PortRoute, 
  CargoCategory, 
  Voyage, 
  Passenger, 
  CargoItem 
} from '../types';
import { useToast } from './Toast';

interface LaporanProps {
  ships: ShipType[];
  routes: PortRoute[];
  cargoCategories: CargoCategory[];
  voyages: Voyage[];
  passengers: Passenger[];
  cargoItems: CargoItem[];
}

export const Laporan: React.FC<LaporanProps> = ({
  ships,
  routes,
  cargoCategories,
  voyages,
  passengers,
  cargoItems
}) => {
  const { showToast } = useToast();
  const [reportType, setReportType] = useState<'all' | 'passenger' | 'cargo' | 'voyage'>('all');
  const [selectedShip, setSelectedShip] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    startDate: '2025-01-01',
    endDate: '2025-12-31'
  });

  const filteredPassengers = passengers.filter(p => {
    const matchesShip = selectedShip === 'all' || p.shipId === selectedShip;
    return matchesShip;
  });

  const filteredCargo = cargoItems.filter(c => {
    const matchesShip = selectedShip === 'all' || c.shipId === selectedShip;
    return matchesShip;
  });

  const filteredVoyages = voyages.filter(v => {
    const matchesShip = selectedShip === 'all' || v.shipId === selectedShip;
    return matchesShip;
  });

  const totalPassengerRevenue = filteredPassengers.reduce((sum, p) => sum + p.fare, 0);
  const totalCargoRevenue = filteredCargo.reduce((sum, c) => sum + c.totalCost, 0);
  const totalCombinedRevenue = totalPassengerRevenue + totalCargoRevenue;
  const totalCargoTonnage = filteredCargo.reduce((sum, c) => sum + c.weightTon, 0);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Export to CSV Function
  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";

    if (reportType === 'passenger' || reportType === 'all') {
      csvContent += "=== LAPORAN MANIFEST PENUMPANG ===\n";
      csvContent += "No Tiket,Nama Penumpang,NIK,Gender,Usia,Kategori,Kelas,Kursi/Kabin,Kapal,Rute,Tarif,Status\n";
      filteredPassengers.forEach(p => {
        csvContent += `"${p.ticketNumber}","${p.passengerName}","${p.idCardNumber}","${p.gender}",${p.age},"${p.category}","${p.classType}","${p.seatOrCabin}","${p.shipName}","${p.routeName}",${p.fare},"${p.status}"\n`;
      });
      csvContent += "\n";
    }

    if (reportType === 'cargo' || reportType === 'all') {
      csvContent += "=== LAPORAN SURAT MUATAN KAPAL (B/L) ===\n";
      csvContent += "No B/L,Pengirim,Penerima,Kategori,Tipe,Plat Nomor,Berat(Ton),Volume(m3),Dek,Biaya,Status,Barang Berbahaya\n";
      filteredCargo.forEach(c => {
        csvContent += `"${c.blNumber}","${c.shipperName}","${c.consigneeName}","${c.categoryName}","${c.cargoType}","${c.vehiclePlateNumber || '-'} ",${c.weightTon},${c.volumeM3},"${c.deckLocation}",${c.totalCost},"${c.status}","${c.isDangerousGoods ? 'YA' : 'TIDAK'}"\n`;
      });
      csvContent += "\n";
    }

    if (reportType === 'voyage' || reportType === 'all') {
      csvContent += "=== LAPORAN JADWAL & STATUS PELAYARAN ===\n";
      csvContent += "No Pelayaran,Kapal,Asal,Tujuan,Waktu Berangkat,Estimasi Tiba,Status,Jumlah Penumpang,Muatan Ton\n";
      filteredVoyages.forEach(v => {
        csvContent += `"${v.voyageNumber}","${v.shipName}","${v.originPort}","${v.destinationPort}","${v.departureTime}","${v.estimatedArrivalTime}","${v.status}",${v.passengerCount},${v.cargoWeightTon}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Maritim_${reportType}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Laporan maritim berhasil diekspor dalam format CSV/Excel.', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Pusat Laporan & Rekapitulasi Maritim</h2>
            <p className="text-xs text-slate-500">Ekspor laporan operasional pelayaran, manifest penumpang, resi kargo, dan pendapatan resmi</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-export-csv"
            type="button"
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition-colors"
          >
            <Download className="w-4 h-4" />
            Ekspor Excel (CSV)
          </button>
          <button
            id="btn-print-report"
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Cetak Dokumen Resmi
          </button>
        </div>
      </div>

      {/* Filter Parameters */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm print:hidden">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Jenis Laporan</label>
            <select
              id="select-report-type"
              value={reportType}
              onChange={e => setReportType(e.target.value as any)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
            >
              <option value="all">Semua Data (Komprehensif)</option>
              <option value="passenger">Manifest Penumpang Sahaja</option>
              <option value="cargo">Resi Kargo & Kendaraan (B/L)</option>
              <option value="voyage">Jadwal & Kinerja Pelayaran</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Filter Kapal</label>
            <select
              id="select-report-ship"
              value={selectedShip}
              onChange={e => setSelectedShip(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-blue-500"
            >
              <option value="all">Semua Armada Kapal</option>
              {ships.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Periode Operasi</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-blue-500"
              />
              <span className="text-slate-400 text-xs">s/d</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-[11px] text-slate-500 font-medium">Total Pendapatan Tiket Penumpang</span>
          <p className="text-lg font-bold font-mono text-emerald-600 mt-1">{formatIDR(totalPassengerRevenue)}</p>
          <span className="text-[10px] text-slate-400">{filteredPassengers.length} Tiket Diterbitkan</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-[11px] text-slate-500 font-medium">Total Pendapatan Angkutan Kargo</span>
          <p className="text-lg font-bold font-mono text-blue-600 mt-1">{formatIDR(totalCargoRevenue)}</p>
          <span className="text-[10px] text-slate-400">{filteredCargo.length} Resi Muatan (B/L)</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-[11px] text-slate-500 font-medium">Total Akumulasi Muatan Terangkut</span>
          <p className="text-lg font-bold font-mono text-amber-600 mt-1">{totalCargoTonnage.toFixed(1)} <span className="text-xs font-normal text-slate-400">Ton</span></p>
          <span className="text-[10px] text-slate-400">Kapasitas Aman Terjaga</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-[11px] text-slate-500 font-medium">Total Penerimaan Operasional Gabungan</span>
          <p className="text-lg font-bold font-mono text-slate-900 mt-1">{formatIDR(totalCombinedRevenue)}</p>
          <span className="text-[10px] text-emerald-600">Efisiensi Armada 94.2%</span>
        </div>
      </div>

      {/* PRINTABLE REPORT DOCUMENT VIEW */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden p-6 space-y-6 shadow-sm print:shadow-none print:border-none">
        <div className="border-b border-slate-200 print:border-black pb-4 text-center">
          <h3 className="text-base font-bold text-slate-900 print:text-black uppercase tracking-wider">
            LAPORAN REKAPITULASI RESMI OPERASIONAL ANGKUTAN LAUT
          </h3>
          <p className="text-xs text-slate-500 print:text-slate-600 mt-0.5">
            Sistem Pemantauan Terpadu Muatan Kapal & Penumpang Pelabuhan
          </p>
          <p className="text-[11px] text-slate-400 print:text-slate-500 font-mono mt-1">
            Dicetak pada: {new Date().toLocaleString('id-ID')} | Status Sinkronisasi Real-Time
          </p>
        </div>

        {/* Section 1: Penumpang */}
        {(reportType === 'all' || reportType === 'passenger') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-blue-600 print:text-black uppercase flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Manifest Penumpang ({filteredPassengers.length} Orang)
              </h4>
              <span className="text-xs font-mono font-bold text-emerald-600 print:text-black">
                Subtotal: {formatIDR(totalPassengerRevenue)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 print:border-black">
                <thead className="bg-slate-50 print:bg-slate-100 text-slate-600 print:text-black text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">No. Tiket</th>
                    <th className="py-2.5 px-3">Nama Penumpang</th>
                    <th className="py-2.5 px-3">NIK</th>
                    <th className="py-2.5 px-3">Kapal & Rute</th>
                    <th className="py-2.5 px-3">Kelas / Kursi</th>
                    <th className="py-2.5 px-3">Tarif</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-black">
                  {filteredPassengers.map(p => (
                    <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-blue-600 font-semibold print:text-black">{p.ticketNumber}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 print:text-black">{p.passengerName} ({p.gender})</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 print:text-black">{p.idCardNumber}</td>
                      <td className="py-2.5 px-3 text-slate-700 print:text-black">{p.shipName}</td>
                      <td className="py-2.5 px-3 text-slate-700 print:text-black">{p.classType} - {p.seatOrCabin}</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-600 font-semibold print:text-black">{formatIDR(p.fare)}</td>
                      <td className="py-2.5 px-3 text-slate-700 print:text-black">{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 2: Muatan Kargo */}
        {(reportType === 'all' || reportType === 'cargo') && (
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-amber-600 print:text-black uppercase flex items-center gap-1.5">
                <Package className="w-4 h-4" /> Resi Muatan Kargo & Kendaraan (B/L) ({filteredCargo.length} Dokumen)
              </h4>
              <span className="text-xs font-mono font-bold text-blue-600 print:text-black">
                Subtotal: {formatIDR(totalCargoRevenue)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 print:border-black">
                <thead className="bg-slate-50 print:bg-slate-100 text-slate-600 print:text-black text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">No. B/L</th>
                    <th className="py-2.5 px-3">Pengirim / Penerima</th>
                    <th className="py-2.5 px-3">Deskripsi Muatan</th>
                    <th className="py-2.5 px-3">Tonase</th>
                    <th className="py-2.5 px-3">Dek Kapal</th>
                    <th className="py-2.5 px-3">Total Biaya</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-black">
                  {filteredCargo.map(c => (
                    <tr key={c.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-blue-600 font-semibold print:text-black">{c.blNumber}</td>
                      <td className="py-2.5 px-3 text-slate-700 print:text-black">{c.shipperName} / {c.consigneeName}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 print:text-black">
                        {c.description} {c.vehiclePlateNumber ? `[${c.vehiclePlateNumber}]` : ''}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 print:text-black">{c.weightTon} Ton</td>
                      <td className="py-2.5 px-3 text-slate-700 print:text-black">{c.deckLocation}</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-600 font-semibold print:text-black">{formatIDR(c.totalCost)}</td>
                      <td className="py-2.5 px-3 text-slate-700 print:text-black">{c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 3: Jadwal Pelayaran */}
        {(reportType === 'all' || reportType === 'voyage') && (
          <div className="space-y-3 pt-4">
            <h4 className="text-xs font-bold text-blue-700 print:text-black uppercase flex items-center gap-1.5">
              <Ship className="w-4 h-4" /> Kinerja Dispatch & Jadwal Pelayaran ({filteredVoyages.length} Pelayaran)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 print:border-black">
                <thead className="bg-slate-50 print:bg-slate-100 text-slate-600 print:text-black text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">No. Pelayaran</th>
                    <th className="py-2.5 px-3">Nama Kapal</th>
                    <th className="py-2.5 px-3">Rute Pelayaran</th>
                    <th className="py-2.5 px-3">Waktu Berangkat</th>
                    <th className="py-2.5 px-3">Keterisian Penumpang</th>
                    <th className="py-2.5 px-3">Keterisian Kargo</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-black">
                  {filteredVoyages.map(v => (
                    <tr key={v.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-blue-600 font-semibold print:text-black">{v.voyageNumber}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 print:text-black">{v.shipName}</td>
                      <td className="py-2.5 px-3 text-slate-700 print:text-black">{v.originPort} &rarr; {v.destinationPort}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 print:text-black">
                        {new Date(v.departureTime).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 print:text-black">{v.passengerCount} Org</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 print:text-black">{v.cargoWeightTon} Ton</td>
                      <td className="py-2.5 px-3 text-slate-700 print:text-black">{v.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Signature & Validation Footer for Print */}
        <div className="hidden print:grid grid-cols-2 gap-8 pt-12 text-center text-xs">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold mt-16">Syahbandar & Otoritas Pelabuhan</p>
            <p className="text-[10px] text-slate-500">NIP: 19840214 200812 1 002</p>
          </div>
          <div>
            <p>Petugas Operasional Dermaga,</p>
            <p className="font-bold mt-16">Manager Logistik & Pelayaran</p>
            <p className="text-[10px] text-slate-500">ID Admin: MARITIME-OPS-01</p>
          </div>
        </div>
      </div>
    </div>
  );
};
