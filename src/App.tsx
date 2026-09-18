import React, { useState, useEffect } from 'react';
import { dbManager, AppData } from './services/dbManager';
import { ActiveTab, DbSettings } from './types';
import { ToastProvider } from './components/Toast';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { MasterDataKapal } from './components/MasterDataKapal';
import { MasterDataRute } from './components/MasterDataRute';
import { MasterDataKategori } from './components/MasterDataKategori';
import { TransaksiPenumpang } from './components/TransaksiPenumpang';
import { TransaksiMuatan } from './components/TransaksiMuatan';
import { TransaksiJadwal } from './components/TransaksiJadwal';
import { Laporan } from './components/Laporan';
import { DatabaseModal } from './components/DatabaseModal';
import { LoginModal } from './components/LoginModal';
import { Database, Server, Flame, Radio, Layers, CheckCircle2, RefreshCw, KeyRound, ExternalLink } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [appData, setAppData] = useState<AppData>(() => dbManager.getData());
  const [dbSettings, setDbSettings] = useState<DbSettings>(() => dbManager.getSettings());
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    // Subscribe to live database updates from dbManager
    const unsubscribe = dbManager.subscribe((newData) => {
      setAppData({ ...newData });
    });
    return () => unsubscribe();
  }, []);

  const counts = {
    ships: appData.ships.length,
    routes: appData.routes.length,
    cargoCategories: appData.cargoCategories.length,
    passengers: appData.passengers.length,
    cargoItems: appData.cargoItems.length,
    voyages: appData.voyages.length
  };

  const handleTabSelect = (tab: ActiveTab) => {
    if (tab === 'database_config') {
      setIsDbModalOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        dbSettings={dbSettings}
        onOpenDbModal={() => setIsDbModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar Nav */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleTabSelect}
          counts={counts}
        />

        {/* Content View Area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <Dashboard
              data={appData}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'master_kapal' && (
            <MasterDataKapal ships={appData.ships} />
          )}

          {activeTab === 'master_rute' && (
            <MasterDataRute routes={appData.routes} />
          )}

          {activeTab === 'master_kategori' && (
            <MasterDataKategori categories={appData.cargoCategories} />
          )}

          {activeTab === 'transaksi_penumpang' && (
            <TransaksiPenumpang
              passengers={appData.passengers}
              ships={appData.ships}
              routes={appData.routes}
              voyages={appData.voyages}
            />
          )}

          {activeTab === 'transaksi_muatan' && (
            <TransaksiMuatan
              cargoItems={appData.cargoItems}
              cargoCategories={appData.cargoCategories}
              ships={appData.ships}
              routes={appData.routes}
              voyages={appData.voyages}
            />
          )}

          {activeTab === 'transaksi_jadwal' && (
            <TransaksiJadwal
              voyages={appData.voyages}
              ships={appData.ships}
              routes={appData.routes}
            />
          )}

          {activeTab === 'laporan' && (
            <Laporan
              ships={appData.ships}
              routes={appData.routes}
              cargoCategories={appData.cargoCategories}
              voyages={appData.voyages}
              passengers={appData.passengers}
              cargoItems={appData.cargoItems}
            />
          )}
        </main>
      </div>

      {/* Real Database Connection Configuration Modal */}
      <DatabaseModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        settings={dbSettings}
        onSettingsUpdated={() => setDbSettings(dbManager.getSettings())}
      />

      {/* Admin Authentication Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
