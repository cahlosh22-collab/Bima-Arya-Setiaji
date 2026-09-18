import React, { useState } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink, 
  Server, 
  Flame, 
  Layers, 
  X,
  Radio,
  FileCode2
} from 'lucide-react';
import { dbManager } from '../services/dbManager';
import { DatabaseProvider, DbSettings } from '../types';
import { POSTGRESQL_SCHEMA_SQL, FIRESTORE_RULES_GUIDE } from '../services/sqlSchemaScripts';
import { useToast } from './Toast';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DbSettings;
  onSettingsUpdated: () => void;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsUpdated
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<DatabaseProvider>(settings.activeProvider);
  const [formData, setFormData] = useState<DbSettings>(settings);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showSql, setShowSql] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await dbManager.testConnection(activeTab, formData);
      setTestResult(res);
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      const msg = err?.message || 'Gagal menguji koneksi';
      setTestResult({ success: false, message: msg });
      showToast(msg, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAndActivate = async () => {
    const updated = {
      ...formData,
      activeProvider: activeTab
    };
    await dbManager.updateSettings(updated);
    showToast(`Provider aktif disetel ke: ${activeTab.toUpperCase()}`, 'success');
    onSettingsUpdated();
    onClose();
  };

  const handleSyncData = async () => {
    setIsSyncing(true);
    try {
      const res = await dbManager.syncToRemote();
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(`Gagal sinkronisasi: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(POSTGRESQL_SCHEMA_SQL);
    setCopied(true);
    showToast('SQL DDL PostgreSQL berhasil disalin ke clipboard!', 'info');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div 
        id="modal-database-config" 
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden text-slate-800 my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
                Koneksi Real Database (Supabase, Neon DB, Firebase)
              </h2>
              <p className="text-xs text-slate-500">
                Pilih dan hubungkan sistem ke database cloud secara real-time atau gunakan mode lokal-hybrid
              </p>
            </div>
          </div>
          <button
            id="btn-close-db-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Provider Tabs */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-100 bg-slate-50/40">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Supabase */}
            <button
              id="tab-db-supabase"
              type="button"
              onClick={() => { setActiveTab('supabase'); setTestResult(null); }}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                activeTab === 'supabase'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Server className="w-4 h-4 text-emerald-600" />
              <span>Supabase</span>
              {settings.activeProvider === 'supabase' && (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              )}
            </button>

            {/* Neon DB */}
            <button
              id="tab-db-neon"
              type="button"
              onClick={() => { setActiveTab('neon'); setTestResult(null); }}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                activeTab === 'neon'
                  ? 'bg-teal-50 border-teal-500 text-teal-800 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Radio className="w-4 h-4 text-teal-600" />
              <span>Neon DB</span>
              {settings.activeProvider === 'neon' && (
                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              )}
            </button>

            {/* Firebase */}
            <button
              id="tab-db-firebase"
              type="button"
              onClick={() => { setActiveTab('firebase'); setTestResult(null); }}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                activeTab === 'firebase'
                  ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-600" />
              <span>Firebase</span>
              {settings.activeProvider === 'firebase' && (
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              )}
            </button>

            {/* Local Hybrid */}
            <button
              id="tab-db-local"
              type="button"
              onClick={() => { setActiveTab('local_hybrid'); setTestResult(null); }}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                activeTab === 'local_hybrid'
                  ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Lokal Hybrid</span>
              {settings.activeProvider === 'local_hybrid' && (
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* SUPABASE FORM */}
          {activeTab === 'supabase' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 leading-relaxed">
                <p className="font-semibold text-emerald-900 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Integrasi Supabase Cloud (PostgreSQL)
                </p>
                Masukkan <strong>Project URL</strong> dan <strong>Anon Public Key</strong> dari dashboard Supabase Anda (Settings &gt; API). Data master & transaksi akan langsung terikat ke tabel Supabase.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Supabase Project URL
                </label>
                <input
                  id="input-supabase-url"
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={formData.supabase.url}
                  onChange={e => setFormData({
                    ...formData,
                    supabase: { ...formData.supabase, url: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Supabase Anon / Public API Key
                </label>
                <input
                  id="input-supabase-key"
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={formData.supabase.anonKey}
                  onChange={e => setFormData({
                    ...formData,
                    supabase: { ...formData.supabase, anonKey: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* NEON DB FORM */}
          {activeTab === 'neon' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 leading-relaxed">
                <p className="font-semibold text-teal-900 mb-1 flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-teal-600" /> Integrasi Neon DB Serverless PostgreSQL
                </p>
                Gunakan <strong>HTTP SQL Endpoint</strong> atau connection string dari Console Neon Tech Anda. Neon DB menyediakan PostgreSQL serverless dengan performa kueri kilat.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Neon HTTP SQL Endpoint
                </label>
                <input
                  id="input-neon-endpoint"
                  type="text"
                  placeholder="https://ep-cool-fog-123456.ap-southeast-1.aws.neon.tech/sql"
                  value={formData.neon.httpEndpoint}
                  onChange={e => setFormData({
                    ...formData,
                    neon: { ...formData.neon, httpEndpoint: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  PostgreSQL Connection String (Optional untuk Server / Proxy)
                </label>
                <input
                  id="input-neon-connstr"
                  type="password"
                  placeholder="postgresql://user:pass@ep-cool-fog.neon.tech/neondb?sslmode=require"
                  value={formData.neon.connectionString}
                  onChange={e => setFormData({
                    ...formData,
                    neon: { ...formData.neon, connectionString: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* FIREBASE FORM */}
          {activeTab === 'firebase' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
                <p className="font-semibold text-amber-900 mb-1 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-600" /> Integrasi Firebase Firestore & Auth
                </p>
                Salin konfigurasi Firebase Web App Anda dari Project Settings di Firebase Console. Koleksi Firestore otomatis disinkronkan secara real-time.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project ID</label>
                  <input
                    id="input-fb-project-id"
                    type="text"
                    placeholder="maritime-vessel-system"
                    value={formData.firebase.projectId}
                    onChange={e => setFormData({
                      ...formData,
                      firebase: { ...formData.firebase, projectId: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">API Key</label>
                  <input
                    id="input-fb-api-key"
                    type="password"
                    placeholder="AIzaSyA12345..."
                    value={formData.firebase.apiKey}
                    onChange={e => setFormData({
                      ...formData,
                      firebase: { ...formData.firebase, apiKey: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Auth Domain</label>
                  <input
                    id="input-fb-auth-domain"
                    type="text"
                    placeholder="maritime-system.firebaseapp.com"
                    value={formData.firebase.authDomain}
                    onChange={e => setFormData({
                      ...formData,
                      firebase: { ...formData.firebase, authDomain: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">App ID</label>
                  <input
                    id="input-fb-app-id"
                    type="text"
                    placeholder="1:897906:web:abcd12345"
                    value={formData.firebase.appId}
                    onChange={e => setFormData({
                      ...formData,
                      firebase: { ...formData.firebase, appId: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:border-amber-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* LOCAL HYBRID */}
          {activeTab === 'local_hybrid' && (
            <div className="space-y-3">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                <p className="font-semibold text-blue-900 mb-1.5 flex items-center gap-1.5 text-sm">
                  <Layers className="w-4 h-4 text-blue-600" /> Mode Lokal-Hybrid Berkelanjutan
                </p>
                Mode ini menyimpan seluruh Master Data kapal, rute, kategori kargo, manifest penumpang, muatan kargo, dan jadwal pelayaran secara persisten di browser cache. Anda dapat beralih ke Supabase, Neon DB, atau Firebase kapan saja tanpa kehilangan perubahan.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                <span>Status Penyimpanan Lokal: <strong className="text-slate-900">Aktif & Terenkripsi</strong></span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Siap Digunakan
                </span>
              </div>
            </div>
          )}

          {/* Test connection alert */}
          {testResult && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              testResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 leading-relaxed">
                <p className="font-semibold">{testResult.success ? 'Koneksi Berhasil' : 'Koneksi Gagal'}</p>
                <p className="text-slate-600 mt-0.5">{testResult.message}</p>
              </div>
            </div>
          )}

          {/* Schema Code Toggle */}
          <div className="pt-2">
            <button
              id="btn-toggle-sql-schema"
              type="button"
              onClick={() => setShowSql(!showSql)}
              className="flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              <FileCode2 className="w-4 h-4" />
              {showSql ? 'Sembunyikan SQL DDL & Schema' : 'Tampilkan SQL Schema DDL (Supabase & Neon DB)'}
            </button>

            {showSql && (
              <div className="mt-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 relative">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs text-slate-600">
                  <span>Schema SQL PostgreSQL (Tabel ships, routes, passengers, cargo_items, voyages)</span>
                  <button
                    id="btn-copy-sql-schema"
                    type="button"
                    onClick={handleCopySql}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-medium transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Tersalin' : 'Salin SQL'}
                  </button>
                </div>
                <pre className="mt-2 text-[11px] font-mono text-slate-800 bg-white p-2 border border-slate-200 rounded-lg max-h-48 overflow-y-auto overflow-x-auto whitespace-pre leading-relaxed">
                  {POSTGRESQL_SCHEMA_SQL}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <button
              id="btn-test-db-connection"
              type="button"
              disabled={isTesting}
              onClick={handleTest}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              {isTesting ? 'Menguji...' : 'Test Koneksi'}
            </button>

            {activeTab !== 'local_hybrid' && (
              <button
                id="btn-sync-db-now"
                type="button"
                disabled={isSyncing}
                onClick={handleSyncData}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
              >
                <Server className={`w-3.5 h-3.5 ${isSyncing ? 'animate-pulse text-blue-600' : ''}`} />
                {isSyncing ? 'Sinkronisasi...' : 'Sinkronkan Data'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="btn-cancel-db-modal"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Batal
            </button>
            <button
              id="btn-save-activate-db"
              type="button"
              onClick={handleSaveAndActivate}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Simpan & Aktifkan Provider
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
