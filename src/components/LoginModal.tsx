import React, { useState } from 'react';
import { Lock, Mail, UserCheck, ShieldAlert, KeyRound, Anchor, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, user } = useAuth();
  const { showToast } = useToast();
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identity.trim()) {
      setError('Masukkan username atau email admin!');
      return;
    }
    if (!password) {
      setError('Masukkan kata sandi!');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(identity, password);
      if (res.success) {
        showToast(res.message, 'success');
        onClose();
      } else {
        setError(res.message);
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      setError('Terjadi kesalahan saat memproses login.');
    } finally {
      setIsLoading(false);
    }
  };

  const setQuickCredentials = (u: string, p: string) => {
    setIdentity(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div 
        id="modal-admin-login" 
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800"
      >
        {/* Header with Maritime Branding */}
        <div className="p-6 bg-gradient-to-b from-blue-50 to-white border-b border-slate-100 text-center relative">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 border border-blue-200 text-blue-600 mb-3 shadow-sm">
            <Anchor className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Ship.it Portal Login
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Sistem Manajemen Muatan Kapal & Manifest Penumpang
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              Username atau Email Admin
            </label>
            <input
              id="input-login-identity"
              type="text"
              autoFocus
              placeholder="admin atau admin@pelabuhan.go.id"
              value={identity}
              onChange={e => setIdentity(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              Kata Sandi
            </label>
            <input
              id="input-login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Quick Demo Credentials Selector */}
          <div className="pt-1">
            <p className="text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Pilih Akun Demo Cepat:
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                id="btn-demo-superadmin"
                onClick={() => setQuickCredentials('admin', 'admin123')}
                className="flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 rounded-lg text-xs text-left transition-colors"
              >
                <div>
                  <span className="font-semibold text-blue-700">Super Admin (Capt. Hendra)</span>
                  <p className="text-[10px] text-slate-500">admin | pass: admin123</p>
                </div>
                <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                  Semua Akses
                </span>
              </button>

              <button
                type="button"
                id="btn-demo-manifest"
                onClick={() => setQuickCredentials('petugas_tiket', 'tiket123')}
                className="flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 rounded-lg text-xs text-left transition-colors"
              >
                <div>
                  <span className="font-semibold text-emerald-700">Petugas Manifest (Siti R.)</span>
                  <p className="text-[10px] text-slate-500">petugas_tiket | pass: tiket123</p>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                  Tiket & Pax
                </span>
              </button>

              <button
                type="button"
                id="btn-demo-cargo"
                onClick={() => setQuickCredentials('petugas_kargo', 'kargo123')}
                className="flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-amber-50/60 border border-slate-200 rounded-lg text-xs text-left transition-colors"
              >
                <div>
                  <span className="font-semibold text-amber-700">Petugas Muatan (Bambang I.)</span>
                  <p className="text-[10px] text-slate-500">petugas_kargo | pass: kargo123</p>
                </div>
                <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                  Muatan & B/L
                </span>
              </button>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              id="btn-cancel-login"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Batal
            </button>
            <button
              id="btn-submit-login"
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-colors disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              {isLoading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
