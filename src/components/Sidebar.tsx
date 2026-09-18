import React from 'react';
import { 
  LayoutDashboard, 
  Ship, 
  Compass, 
  Boxes, 
  Users, 
  Package, 
  CalendarClock, 
  FileSpreadsheet, 
  Database,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { ActiveTab } from '../types';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  counts: {
    ships: number;
    routes: number;
    cargoCategories: number;
    passengers: number;
    cargoItems: number;
    voyages: number;
  };
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  counts
}) => {
  const { user } = useAuth();

  const navItems: { group: string; items: NavItem[] }[] = [
    {
      group: 'UTAMA',
      items: [
        {
          id: 'dashboard' as ActiveTab,
          label: 'Dashboard Analitik',
          icon: LayoutDashboard,
          badge: 'Live'
        }
      ]
    },
    {
      group: 'MASTER DATA',
      items: [
        {
          id: 'master_kapal' as ActiveTab,
          label: 'Master Data Kapal',
          icon: Ship,
          count: counts.ships
        },
        {
          id: 'master_rute' as ActiveTab,
          label: 'Rute & Pelabuhan',
          icon: Compass,
          count: counts.routes
        },
        {
          id: 'master_kategori' as ActiveTab,
          label: 'Kategori Muatan & Tarif',
          icon: Boxes,
          count: counts.cargoCategories
        }
      ]
    },
    {
      group: 'TRANSAKSI OPERASIONAL',
      items: [
        {
          id: 'transaksi_penumpang' as ActiveTab,
          label: 'Manifest Penumpang',
          icon: Users,
          count: counts.passengers
        },
        {
          id: 'transaksi_muatan' as ActiveTab,
          label: 'Manifest Muatan (B/L)',
          icon: Package,
          count: counts.cargoItems
        },
        {
          id: 'transaksi_jadwal' as ActiveTab,
          label: 'Jadwal & Pelayaran',
          icon: CalendarClock,
          count: counts.voyages
        }
      ]
    },
    {
      group: 'LAPORAN & KONEKSI',
      items: [
        {
          id: 'laporan' as ActiveTab,
          label: 'Laporan & Dokumen Manifest',
          icon: FileSpreadsheet,
          badge: 'PDF / CSV'
        },
        {
          id: 'database_config' as ActiveTab,
          label: 'Real Database (Cloud)',
          icon: Database,
          badge: 'Multi-DB'
        }
      ]
    }
  ];

  return (
    <aside className="w-full md:w-64 bg-white border-r border-slate-200 text-slate-600 p-4 shrink-0 flex flex-col justify-between shadow-sm">
      <div className="space-y-6">
        {navItems.map((group, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className="text-[11px] font-bold text-slate-400 px-3 tracking-wider uppercase mb-2">
              {group.group}
            </h3>
            <div className="space-y-1">
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-tab-${item.id}`}
                    type="button"
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.count !== undefined && (
                        <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-mono ${
                          isActive ? 'bg-blue-700/80 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.count}
                        </span>
                      )}
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          isActive ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Role Notice */}
      {user && (
        <div className="mt-6 p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 font-semibold mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span>Hak Akses:</span>
          </div>
          <p className="text-slate-900 font-medium capitalize truncate">
            {user.role.replace('_', ' ')}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5 truncate">
            {user.dutyLocation}
          </p>
        </div>
      )}
    </aside>
  );
};
