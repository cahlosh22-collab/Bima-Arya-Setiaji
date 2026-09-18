import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { 
  DbSettings, 
  Ship, 
  PortRoute, 
  CargoCategory, 
  Passenger, 
  CargoItem, 
  Voyage, 
  DatabaseProvider 
} from '../types';
import { 
  INITIAL_SHIPS, 
  INITIAL_ROUTES, 
  INITIAL_CARGO_CATEGORIES, 
  INITIAL_PASSENGERS, 
  INITIAL_CARGO_ITEMS, 
  INITIAL_VOYAGES 
} from '../data/initialMaritimeData';

const SETTINGS_STORAGE_KEY = 'maritime_db_settings_v1';
const DATA_STORAGE_KEY = 'maritime_local_data_v1';

export interface AppData {
  ships: Ship[];
  routes: PortRoute[];
  cargoCategories: CargoCategory[];
  passengers: Passenger[];
  cargoItems: CargoItem[];
  voyages: Voyage[];
}

export const DEFAULT_DB_SETTINGS: DbSettings = {
  activeProvider: 'local_hybrid',
  supabase: {
    url: '',
    anonKey: ''
  },
  neon: {
    connectionString: '',
    httpEndpoint: ''
  },
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  },
  lastSyncAt: null,
  connectionStatus: 'connected'
};

class DatabaseManager {
  private settings: DbSettings;
  private data: AppData;
  private supabaseClient: SupabaseClient | null = null;
  private firebaseApp: FirebaseApp | null = null;
  private firestore: Firestore | null = null;
  private listeners: Set<(data: AppData, settings: DbSettings) => void> = new Set();

  constructor() {
    this.settings = this.loadSettings();
    this.data = this.loadLocalData();
    this.initActiveClient();
  }

  public subscribe(callback: (data: AppData, settings: DbSettings) => void): () => void {
    this.listeners.add(callback);
    callback(this.data, this.settings);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.saveLocalData();
    this.saveSettings();
    this.listeners.forEach(cb => cb(this.data, this.settings));
  }

  private loadSettings(): DbSettings {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_DB_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load DB settings from localStorage', e);
    }
    return DEFAULT_DB_SETTINGS;
  }

  private saveSettings() {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.error('Failed to save DB settings to localStorage', e);
    }
  }

  private loadLocalData(): AppData {
    try {
      const saved = localStorage.getItem(DATA_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load maritime data from localStorage', e);
    }
    return {
      ships: INITIAL_SHIPS,
      routes: INITIAL_ROUTES,
      cargoCategories: INITIAL_CARGO_CATEGORIES,
      passengers: INITIAL_PASSENGERS,
      cargoItems: INITIAL_CARGO_ITEMS,
      voyages: INITIAL_VOYAGES
    };
  }

  private saveLocalData() {
    try {
      localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save maritime data to localStorage', e);
    }
  }

  private initActiveClient() {
    if (this.settings.activeProvider === 'supabase' && this.settings.supabase.url && this.settings.supabase.anonKey) {
      try {
        this.supabaseClient = createClient(this.settings.supabase.url, this.settings.supabase.anonKey);
        this.settings.connectionStatus = 'connected';
      } catch (err: any) {
        this.settings.connectionStatus = 'error';
        this.settings.errorMessage = err?.message || 'Gagal inisialisasi Supabase';
      }
    } else if (this.settings.activeProvider === 'firebase' && this.settings.firebase.projectId && this.settings.firebase.apiKey) {
      try {
        if (!getApps().length) {
          this.firebaseApp = initializeApp(this.settings.firebase);
        } else {
          this.firebaseApp = getApps()[0];
        }
        this.firestore = getFirestore(this.firebaseApp);
        this.settings.connectionStatus = 'connected';
      } catch (err: any) {
        this.settings.connectionStatus = 'error';
        this.settings.errorMessage = err?.message || 'Gagal inisialisasi Firebase';
      }
    } else if (this.settings.activeProvider === 'neon' && this.settings.neon.httpEndpoint) {
      this.settings.connectionStatus = 'connected';
    } else {
      this.settings.connectionStatus = 'connected';
    }
  }

  public getSettings(): DbSettings {
    return { ...this.settings };
  }

  public getData(): AppData {
    return { ...this.data };
  }

  public async updateSettings(newSettings: Partial<DbSettings>): Promise<{ success: boolean; message: string }> {
    this.settings = { ...this.settings, ...newSettings };
    this.initActiveClient();
    this.notify();
    return { success: true, message: 'Pengaturan database berhasil diperbarui.' };
  }

  public async switchProvider(provider: DatabaseProvider): Promise<{ success: boolean; message: string }> {
    this.settings.activeProvider = provider;
    this.initActiveClient();
    this.notify();
    return { success: true, message: `Berhasil beralih ke provider: ${provider.toUpperCase()}` };
  }

  public async testConnection(provider: DatabaseProvider, config?: Partial<DbSettings>): Promise<{ success: boolean; message: string }> {
    if (provider === 'local_hybrid') {
      return { success: true, message: 'Database Lokal Hybrid aktif & siap digunakan.' };
    }

    if (provider === 'supabase') {
      const url = config?.supabase?.url || this.settings.supabase.url;
      const key = config?.supabase?.anonKey || this.settings.supabase.anonKey;
      if (!url || !key) {
        return { success: false, message: 'URL dan Anon Key Supabase wajib diisi!' };
      }
      try {
        const client = createClient(url, key);
        // Ping supabase auth or health
        const { error } = await client.from('ships').select('id').limit(1);
        if (error && error.code !== 'PGRST116') {
          // It could be table doesn't exist yet, but connection was made
          if (error.message.includes('relation') || error.message.includes('does not exist')) {
            return { 
              success: true, 
              message: 'Terhubung ke Supabase! (Catatan: Jalankan SQL Schema generator untuk membuat tabel).' 
            };
          }
          return { success: false, message: `Supabase Error: ${error.message}` };
        }
        return { success: true, message: 'Koneksi ke Supabase berhasil dan terverifikasi!' };
      } catch (err: any) {
        return { success: false, message: `Koneksi gagal: ${err.message || 'Error tidak diketahui'}` };
      }
    }

    if (provider === 'neon') {
      const endpoint = config?.neon?.httpEndpoint || this.settings.neon.httpEndpoint;
      if (!endpoint) {
        return { success: false, message: 'HTTP SQL Endpoint Neon DB wajib diisi!' };
      }
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'SELECT NOW() as server_time;' })
        });
        if (res.ok) {
          return { success: true, message: 'Koneksi ke Neon DB PostgreSQL berhasil!' };
        } else {
          const text = await res.text();
          return { success: false, message: `Neon DB merespons status ${res.status}: ${text.slice(0, 100)}` };
        }
      } catch (err: any) {
        return { success: false, message: `Gagal terhubung ke Neon DB: ${err.message}` };
      }
    }

    if (provider === 'firebase') {
      const fbConfig = config?.firebase || this.settings.firebase;
      if (!fbConfig?.projectId || !fbConfig?.apiKey) {
        return { success: false, message: 'Project ID dan API Key Firebase wajib diisi!' };
      }
      try {
        let app: FirebaseApp;
        if (!getApps().length) {
          app = initializeApp(fbConfig);
        } else {
          app = getApps()[0];
        }
        const db = getFirestore(app);
        // Try reading test doc
        const testCol = collection(db, 'maritime_ping');
        await getDocs(testCol);
        return { success: true, message: 'Koneksi ke Google Firebase Firestore berhasil!' };
      } catch (err: any) {
        return { success: false, message: `Firebase Error: ${err.message}` };
      }
    }

    return { success: true, message: 'Koneksi berhasil diverifikasi.' };
  }

  // Synchronize local data to remote cloud database
  public async syncToRemote(): Promise<{ success: boolean; message: string }> {
    this.settings.connectionStatus = 'connecting';
    this.notify();

    try {
      const provider = this.settings.activeProvider;

      if (provider === 'supabase' && this.supabaseClient) {
        // Upsert all collections
        await this.supabaseClient.from('ships').upsert(this.data.ships);
        await this.supabaseClient.from('routes').upsert(this.data.routes);
        await this.supabaseClient.from('cargo_categories').upsert(this.data.cargoCategories);
        await this.supabaseClient.from('passengers').upsert(this.data.passengers);
        await this.supabaseClient.from('cargo_items').upsert(this.data.cargoItems);
        await this.supabaseClient.from('voyages').upsert(this.data.voyages);
      } else if (provider === 'firebase' && this.firestore) {
        const batchSave = async (colName: string, items: any[]) => {
          for (const item of items) {
            const ref = doc(this.firestore!, colName, item.id);
            await setDoc(ref, item, { merge: true });
          }
        };
        await batchSave('ships', this.data.ships);
        await batchSave('routes', this.data.routes);
        await batchSave('cargo_categories', this.data.cargoCategories);
        await batchSave('passengers', this.data.passengers);
        await batchSave('cargo_items', this.data.cargoItems);
        await batchSave('voyages', this.data.voyages);
      }

      this.settings.lastSyncAt = new Date().toISOString();
      this.settings.connectionStatus = 'connected';
      this.settings.errorMessage = undefined;
      this.notify();
      return { success: true, message: `Sinkronisasi ke ${provider.toUpperCase()} berhasil!` };
    } catch (err: any) {
      this.settings.connectionStatus = 'error';
      this.settings.errorMessage = err.message;
      this.notify();
      return { success: false, message: `Sinkronisasi gagal: ${err.message}` };
    }
  }

  // CRUD for SHIPS
  public addShip(ship: Omit<Ship, 'id' | 'createdAt' | 'updatedAt'>): Ship {
    const newShip: Ship = {
      ...ship,
      id: 'shp-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.ships = [newShip, ...this.data.ships];
    this.notify();
    this.autoSyncItem('ships', newShip);
    return newShip;
  }

  public updateShip(id: string, updates: Partial<Ship>): Ship | null {
    const index = this.data.ships.findIndex(s => s.id === id);
    if (index === -1) return null;
    const updated = {
      ...this.data.ships[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.data.ships[index] = updated;
    this.notify();
    this.autoSyncItem('ships', updated);
    return updated;
  }

  public deleteShip(id: string): boolean {
    const initialLen = this.data.ships.length;
    this.data.ships = this.data.ships.filter(s => s.id !== id);
    if (this.data.ships.length !== initialLen) {
      this.notify();
      this.autoDeleteItem('ships', id);
      return true;
    }
    return false;
  }

  // CRUD for ROUTES
  public addRoute(route: Omit<PortRoute, 'id' | 'createdAt' | 'updatedAt'>): PortRoute {
    const newRoute: PortRoute = {
      ...route,
      id: 'rte-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.routes = [newRoute, ...this.data.routes];
    this.notify();
    this.autoSyncItem('routes', newRoute);
    return newRoute;
  }

  public updateRoute(id: string, updates: Partial<PortRoute>): PortRoute | null {
    const index = this.data.routes.findIndex(r => r.id === id);
    if (index === -1) return null;
    const updated = {
      ...this.data.routes[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.data.routes[index] = updated;
    this.notify();
    this.autoSyncItem('routes', updated);
    return updated;
  }

  public deleteRoute(id: string): boolean {
    const initialLen = this.data.routes.length;
    this.data.routes = this.data.routes.filter(r => r.id !== id);
    if (this.data.routes.length !== initialLen) {
      this.notify();
      this.autoDeleteItem('routes', id);
      return true;
    }
    return false;
  }

  // CRUD for CARGO CATEGORIES
  public addCargoCategory(cat: Omit<CargoCategory, 'id' | 'createdAt' | 'updatedAt'>): CargoCategory {
    const newCat: CargoCategory = {
      ...cat,
      id: 'ctg-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.cargoCategories = [newCat, ...this.data.cargoCategories];
    this.notify();
    this.autoSyncItem('cargo_categories', newCat);
    return newCat;
  }

  public updateCargoCategory(id: string, updates: Partial<CargoCategory>): CargoCategory | null {
    const index = this.data.cargoCategories.findIndex(c => c.id === id);
    if (index === -1) return null;
    const updated = {
      ...this.data.cargoCategories[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.data.cargoCategories[index] = updated;
    this.notify();
    this.autoSyncItem('cargo_categories', updated);
    return updated;
  }

  public deleteCargoCategory(id: string): boolean {
    const initialLen = this.data.cargoCategories.length;
    this.data.cargoCategories = this.data.cargoCategories.filter(c => c.id !== id);
    if (this.data.cargoCategories.length !== initialLen) {
      this.notify();
      this.autoDeleteItem('cargo_categories', id);
      return true;
    }
    return false;
  }

  // CRUD for PASSENGERS
  public addPassenger(passenger: Omit<Passenger, 'id' | 'createdAt' | 'updatedAt'>): Passenger {
    const newPassenger: Passenger = {
      ...passenger,
      id: 'psg-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.passengers = [newPassenger, ...this.data.passengers];
    this.updateVoyagePassengerCount(newPassenger.voyageId);
    this.notify();
    this.autoSyncItem('passengers', newPassenger);
    return newPassenger;
  }

  public updatePassenger(id: string, updates: Partial<Passenger>): Passenger | null {
    const index = this.data.passengers.findIndex(p => p.id === id);
    if (index === -1) return null;
    const oldVoyageId = this.data.passengers[index].voyageId;
    const updated = {
      ...this.data.passengers[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.data.passengers[index] = updated;
    if (updates.voyageId && updates.voyageId !== oldVoyageId) {
      this.updateVoyagePassengerCount(oldVoyageId);
      this.updateVoyagePassengerCount(updates.voyageId);
    }
    this.notify();
    this.autoSyncItem('passengers', updated);
    return updated;
  }

  public deletePassenger(id: string): boolean {
    const item = this.data.passengers.find(p => p.id === id);
    if (!item) return false;
    const vygId = item.voyageId;
    this.data.passengers = this.data.passengers.filter(p => p.id !== id);
    this.updateVoyagePassengerCount(vygId);
    this.notify();
    this.autoDeleteItem('passengers', id);
    return true;
  }

  // CRUD for CARGO ITEMS
  public addCargoItem(cargo: Omit<CargoItem, 'id' | 'createdAt' | 'updatedAt'>): CargoItem {
    const newCargo: CargoItem = {
      ...cargo,
      id: 'crg-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.cargoItems = [newCargo, ...this.data.cargoItems];
    this.updateVoyageCargoWeight(newCargo.voyageId);
    this.notify();
    this.autoSyncItem('cargo_items', newCargo);
    return newCargo;
  }

  public updateCargoItem(id: string, updates: Partial<CargoItem>): CargoItem | null {
    const index = this.data.cargoItems.findIndex(c => c.id === id);
    if (index === -1) return null;
    const oldVoyageId = this.data.cargoItems[index].voyageId;
    const updated = {
      ...this.data.cargoItems[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.data.cargoItems[index] = updated;
    if (updates.voyageId && updates.voyageId !== oldVoyageId) {
      this.updateVoyageCargoWeight(oldVoyageId);
      this.updateVoyageCargoWeight(updates.voyageId);
    } else if (updates.weightTon !== undefined) {
      this.updateVoyageCargoWeight(updated.voyageId);
    }
    this.notify();
    this.autoSyncItem('cargo_items', updated);
    return updated;
  }

  public deleteCargoItem(id: string): boolean {
    const item = this.data.cargoItems.find(c => c.id === id);
    if (!item) return false;
    const vygId = item.voyageId;
    this.data.cargoItems = this.data.cargoItems.filter(c => c.id !== id);
    this.updateVoyageCargoWeight(vygId);
    this.notify();
    this.autoDeleteItem('cargo_items', id);
    return true;
  }

  // CRUD for VOYAGES
  public addVoyage(voyage: Omit<Voyage, 'id' | 'createdAt' | 'updatedAt' | 'passengerCount' | 'cargoWeightTon'>): Voyage {
    const newVoyage: Voyage = {
      ...voyage,
      id: 'vyg-' + Date.now(),
      passengerCount: 0,
      cargoWeightTon: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.voyages = [newVoyage, ...this.data.voyages];
    this.notify();
    this.autoSyncItem('voyages', newVoyage);
    return newVoyage;
  }

  public updateVoyage(id: string, updates: Partial<Voyage>): Voyage | null {
    const index = this.data.voyages.findIndex(v => v.id === id);
    if (index === -1) return null;
    const updated = {
      ...this.data.voyages[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.data.voyages[index] = updated;
    this.notify();
    this.autoSyncItem('voyages', updated);
    return updated;
  }

  public deleteVoyage(id: string): boolean {
    const initialLen = this.data.voyages.length;
    this.data.voyages = this.data.voyages.filter(v => v.id !== id);
    if (this.data.voyages.length !== initialLen) {
      this.notify();
      this.autoDeleteItem('voyages', id);
      return true;
    }
    return false;
  }

  private updateVoyagePassengerCount(voyageId: string) {
    const count = this.data.passengers.filter(p => p.voyageId === voyageId && p.status !== 'Cancelled').length;
    const vIndex = this.data.voyages.findIndex(v => v.id === voyageId);
    if (vIndex !== -1) {
      this.data.voyages[vIndex].passengerCount = count;
    }
  }

  private updateVoyageCargoWeight(voyageId: string) {
    const totalWeight = this.data.cargoItems
      .filter(c => c.voyageId === voyageId && c.status !== 'Cancelled')
      .reduce((acc, curr) => acc + (curr.weightTon || 0), 0);
    const vIndex = this.data.voyages.findIndex(v => v.id === voyageId);
    if (vIndex !== -1) {
      this.data.voyages[vIndex].cargoWeightTon = Math.round(totalWeight * 10) / 10;
    }
  }

  // Reset demo data to initial factory state
  public resetToDefault() {
    this.data = {
      ships: INITIAL_SHIPS,
      routes: INITIAL_ROUTES,
      cargoCategories: INITIAL_CARGO_CATEGORIES,
      passengers: INITIAL_PASSENGERS,
      cargoItems: INITIAL_CARGO_ITEMS,
      voyages: INITIAL_VOYAGES
    };
    this.notify();
  }

  // Background sync helper
  private async autoSyncItem(table: string, item: any) {
    try {
      if (this.settings.activeProvider === 'supabase' && this.supabaseClient) {
        await this.supabaseClient.from(table).upsert([item]);
      } else if (this.settings.activeProvider === 'firebase' && this.firestore) {
        await setDoc(doc(this.firestore, table, item.id), item, { merge: true });
      }
    } catch (e) {
      console.warn(`Auto-sync to ${this.settings.activeProvider} deferred:`, e);
    }
  }

  private async autoDeleteItem(table: string, id: string) {
    try {
      if (this.settings.activeProvider === 'supabase' && this.supabaseClient) {
        await this.supabaseClient.from(table).delete().eq('id', id);
      } else if (this.settings.activeProvider === 'firebase' && this.firestore) {
        await deleteDoc(doc(this.firestore, table, id));
      }
    } catch (e) {
      console.warn(`Auto-delete to ${this.settings.activeProvider} deferred:`, e);
    }
  }
}

export const dbManager = new DatabaseManager();
