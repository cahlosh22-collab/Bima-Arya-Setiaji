import React from 'react';
import { 
  Ship, 
  Users, 
  Package, 
  DollarSign, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Anchor, 
  ArrowUpRight, 
  TrendingUp,
  Clock,
  Compass
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  CartesianGrid,
  Legend
} from 'recharts';
import { AppData } from '../services/dbManager';
import { ActiveTab } from '../types';

interface DashboardProps {
  data: AppData;
  onNavigate: (tab: ActiveTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, onNavigate }) => {
  const { ships, voyages, passengers, cargoItems, routes } = data;

  // KPIs
  const totalShips = ships.length;
  const activeShips = ships.filter(s => s.status === 'Beroperasi').length;
  
  const totalPassengers = passengers.filter(p => p.status !== 'Cancelled').length;
  const boardedPassengers = passengers.filter(p => p.status === 'Boarded').length;

  const totalCargoWeightTon = Math.round(
    cargoItems.filter(c => c.status !== 'Cancelled').reduce((sum, c) => sum + (c.weightTon || 0), 0) * 10
  ) / 10;

  const totalRevenue = passengers.reduce((sum, p) => sum + (p.status !== 'Cancelled' ? p.fare : 0), 0) +
    cargoItems.reduce((sum, c) => sum + (c.status !== 'Cancelled' ? c.totalCost : 0), 0);

  // Format IDR Currency
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Fleet Capacity Utilization Data for Bar Chart
  const fleetUtilizationData = ships.map(ship => {
    const shipVoyages = voyages.filter(v => v.shipId === ship.id);
    const totalPaxOnShip = shipVoyages.reduce((sum, v) => sum + v.passengerCount, 0);
    const totalTonOnShip = shipVoyages.reduce((sum, v) => sum + v.cargoWeightTon, 0);
    const paxCapacity = ship.passengerCapacity || 1;
    const tonCapacity = ship.cargoCapacityTon || 1;

    return {
      name: ship.name.replace('KMP ', '').replace('KM ', ''),
      penumpangTerisi: totalPaxOnShip,
      kapasitasPax: paxCapacity,
      utilisasiPaxPct: Math.min(100, Math.round((totalPaxOnShip / paxCapacity) * 100)),
      muatanTon: Math.round(totalTonOnShip),
      kapasitasTon: tonCapacity,
      utilisasiTonPct: Math.min(100, Math.round((totalTonOnShip / tonCapacity) * 100))
    };
  });

  // Cargo Category Distribution
  const cargoTypeMap: Record<string, number> = {};
  cargoItems.forEach(item => {
    if (item.status !== 'Cancelled') {
      const type = item.cargoType || 'General Cargo';
      cargoTypeMap[type] = (cargoTypeMap[type] || 0) + (item.weightTon || 1);
    }
  });

  const PIE_COLORS = ['#2563eb', '#0284c7', '#0d9488', '#f59e0b', '#6366f1'];
  const cargoDistributionData = Object.keys(cargoTypeMap).map((key, idx) => ({
    name: key,
    value: Math.round(cargoTypeMap[key] * 10) / 10
  }));

  // Weekly Trend Data
  const weeklyTrends = [
    { day: 'Sen', penumpang: 420, muatanTon: 840 },
    { day: 'Sel', penumpang: 580, muatanTon: 920 },
    { day: 'Rab', penumpang: 710, muatanTon: 1150 },
    { day: 'Kam', penumpang: 650, muatanTon: 1080 },
    { day: 'Jum', penumpang: 890, muatanTon: 1420 },
    { day: 'Sab', penumpang: 1120, muatanTon: 1680 },
    { day: 'Min', penumpang: 980, muatanTon: 1350 }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Operational Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-blue-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Pusat Komando Operasional Armada Laut Real-Time
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pemantauan kapasitas muatan kargo, manifest penumpang pelabuhan, dan status pelayaran kapal secara langsung
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-quick-new-pax"
            type="button"
            onClick={() => onNavigate('transaksi_penumpang')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            + Tiket Penumpang
          </button>
          <button
            id="btn-quick-new-cargo"
            type="button"
            onClick={() => onNavigate('transaksi_muatan')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Package className="w-3.5 h-3.5" />
            + Resi Muatan (B/L)
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ships */}
        <div 
          onClick={() => onNavigate('master_kapal')}
          className="bg-white border border-slate-200 hover:border-blue-300 p-5 rounded-2xl cursor-pointer transition-all shadow-sm hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Armada Kapal</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:scale-110 transition-transform">
              <Ship className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{activeShips}</span>
            <span className="text-xs text-slate-500 ml-1.5">/ {totalShips} Aktif</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-blue-700 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Kesiapan berlayar: {Math.round((activeShips / (totalShips || 1)) * 100)}%</span>
          </div>
        </div>

        {/* Card 2: Passengers */}
        <div 
          onClick={() => onNavigate('transaksi_penumpang')}
          className="bg-white border border-slate-200 hover:border-emerald-300 p-5 rounded-2xl cursor-pointer transition-all shadow-sm hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Manifest Penumpang</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{totalPassengers}</span>
            <span className="text-xs text-slate-500 ml-1.5">Pax Terdaftar</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{boardedPassengers} penumpang sudah on-board</span>
          </div>
        </div>

        {/* Card 3: Cargo Tonage */}
        <div 
          onClick={() => onNavigate('transaksi_muatan')}
          className="bg-white border border-slate-200 hover:border-amber-300 p-5 rounded-2xl cursor-pointer transition-all shadow-sm hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Muatan Kargo</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{totalCargoWeightTon}</span>
            <span className="text-xs text-slate-500 ml-1.5">Ton Terdaftar</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-700 font-medium">
            <Activity className="w-3.5 h-3.5" />
            <span>{cargoItems.length} Resi / Bill of Lading aktif</span>
          </div>
        </div>

        {/* Card 4: Revenue */}
        <div 
          onClick={() => onNavigate('laporan')}
          className="bg-white border border-slate-200 hover:border-indigo-300 p-5 rounded-2xl cursor-pointer transition-all shadow-sm hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pendapatan Operasional</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-lg font-bold text-slate-900 tracking-tight truncate block">
              {formatIDR(totalRevenue)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-indigo-700 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Kombinasi tiket pax & kargo</span>
          </div>
        </div>
      </div>

      {/* Real-time Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Fleet Capacity & Utilization */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Tingkat Keterisian & Utilisasi Armada (% Kapasitas)
              </h3>
              <p className="text-xs text-slate-500">
                Perbandingan penumpang dan tonase muatan terhadap daya tampung maksimum kapal
              </p>
            </div>
            <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
              Real-time
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fleetUtilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', fontSize: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(val: any) => [`${val}%`, 'Utilisasi']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="utilisasiPaxPct" name="% Penumpang Terisi" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="utilisasiTonPct" name="% Muatan Kargo (Ton)" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Cargo Type Breakdown */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Komposisi Muatan Berdasarkan Kategori
            </h3>
            <p className="text-xs text-slate-500">
              Distribusi tonase barang, kendaraan, dan kargo
            </p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {cargoDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cargoDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {cargoDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', fontSize: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    formatter={(val: any) => [`${val} Ton`, 'Berat']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">Belum ada data kargo aktif</p>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {cargoDistributionData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} 
                  />
                  <span className="text-slate-600 truncate max-w-[130px]">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-900 font-mono">{item.value} Ton</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lower Row: Weekly Trends & Live Voyages Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend Area Chart */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Tren Mingguan Operasional</h3>
              <p className="text-xs text-slate-500">Arus mobilitas penumpang & volume kargo 7 hari terakhir</p>
            </div>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPax" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorCargo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', fontSize: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Area type="monotone" dataKey="penumpang" name="Penumpang (Pax)" stroke="#2563eb" fillOpacity={1} fill="url(#colorPax)" />
                <Area type="monotone" dataKey="muatanTon" name="Muatan (Ton)" stroke="#0d9488" fillOpacity={1} fill="url(#colorCargo)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Voyage Dispatch Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Status Pelayaran Kapal Real-Time</h3>
            </div>
            <button
              id="btn-view-all-voyages"
              type="button"
              onClick={() => onNavigate('transaksi_jadwal')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
            >
              Kelola Jadwal &gt;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">No. Pelayaran</th>
                  <th className="py-2.5 px-3 font-semibold">Kapal & Rute</th>
                  <th className="py-2.5 px-3 font-semibold">Jadwal Berangkat</th>
                  <th className="py-2.5 px-3 font-semibold">Penumpang</th>
                  <th className="py-2.5 px-3 font-semibold">Muatan</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {voyages.slice(0, 4).map(v => (
                  <tr key={v.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-blue-600">{v.voyageNumber}</td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-900">{v.shipName}</p>
                      <p className="text-[11px] text-slate-500">{v.originPort} &rarr; {v.destinationPort}</p>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(v.departureTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-slate-900 font-medium">{v.passengerCount}</span>
                      <span className="text-slate-400 text-[11px]"> pax</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-slate-900 font-medium">{v.cargoWeightTon}</span>
                      <span className="text-slate-400 text-[11px]"> ton</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
