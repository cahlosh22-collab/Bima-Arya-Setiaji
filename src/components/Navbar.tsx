import React, { useState, useEffect } from 'react';
import { 
  Anchor, 
  Database, 
  User as UserIcon, 
  LogOut, 
  LogIn, 
  RefreshCw, 
  Shield, 
  Clock,
  Radio,
  Server,
  Flame,
  Layers,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DbSettings } from '../types';
import { dbManager } from '../services/dbManager';
import { useToast } from './Toast';

interface NavbarProps {
  dbSettings: DbSettings;
  onOpenDbModal: () => void;
  onOpenLoginModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  dbSettings,
  onOpenDbModal,
  onOpenLoginModal
}) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }) + ' WIB'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleQuickSync = async () => {
    setIsSyncing(true);
    try {
      const res = await dbManager.syncToRemote();
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (e: any) {
      showToast('Gagal sinkronisasi data.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const getProviderBadge = () => {
    const p = dbSettings.activeProvider;
    if (p === 'supabase') {
      return {
        label: 'Supabase Cloud',
        icon: Server,
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    }
    if (p === 'neon') {
      return {
        label: 'Neon DB (Postgres)',
        icon: Radio,
        color: 'bg-teal-50 text-teal-700 border-teal-200'
      };
    }
    if (p === 'firebase') {
      return {
        label: 'Firebase Firestore',
        icon: Flame,
        color: 'bg-amber-50 text-amber-700 border-amber-200'
      };
    }
    return {
      label: 'Lokal Hybrid',
      icon: Layers,
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    };
  };

  const badge = getProviderBadge();
  const IconComponent = badge.icon;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 text-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
            <Anchor className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-1">
                <span>Ship</span>
                <span className="text-blue-600">.it</span>
              </h1>
              <span className="hidden md:inline-flex text-[10px] uppercase font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                Maritime Dispatch
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Sistem Manajemen Muatan Kapal & Manifest Penumpang
            </p>
          </div>
        </div>

        {/* Center: Live Clock */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-mono">{currentTime || 'Memuat waktu...'}</span>
        </div>

        {/* Right: DB Status + Quick Sync + User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Database Provider Button */}
          <button
            id="btn-nav-database-modal"
            type="button"
            onClick={onOpenDbModal}
            className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors hover:brightness-95 ${badge.color}`}
            title="Klik untuk konfigurasi database (Supabase, Neon, Firebase)"
          >
            <IconComponent className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-semibold">{badge.label}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          {/* Sync button */}
          <button
            id="btn-nav-quick-sync"
            type="button"
            disabled={isSyncing}
            onClick={handleQuickSync}
            className="p-2 text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-xl border border-slate-200 transition-colors"
            title="Sinkronisasi ke Database Cloud"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* User Account / Auth */}
          {user ? (
            <div className="relative">
              <button
                id="btn-nav-user-profile"
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
              >
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={user.name}
                  className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                />
                <div className="text-left hidden md:block">
                  <p className="text-xs font-semibold text-slate-900 leading-none truncate max-w-[120px]">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-slate-500 capitalize mt-0.5">
                    {user.role.replace('_', ' ')}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">{user.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{user.email}</p>
                    <p className="text-[10px] text-blue-600 mt-1 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {user.dutyLocation}
                    </p>
                  </div>
                  <button
                    id="btn-nav-switch-account"
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenLoginModal();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    Ganti Petugas / Login
                  </button>
                  <button
                    id="btn-nav-logout"
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                      showToast('Anda telah berhasil keluar dari akun.', 'info');
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Keluar (Logout)
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              id="btn-nav-login"
              type="button"
              onClick={onOpenLoginModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login Admin</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
