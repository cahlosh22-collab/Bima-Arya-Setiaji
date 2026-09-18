export type UserRole = 'super_admin' | 'manifest_officer' | 'cargo_officer' | 'port_authority';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  dutyLocation: string;
}

export type ShipType = 'Ferry RORO' | 'Kapal Penumpang Pelni' | 'Kapal Kargo Kontainer' | 'Kapal Cepat / Fast Boat';
export type ShipStatus = 'Beroperasi' | 'Bersandar' | 'Docking / Perawatan' | 'Siaga';

export interface Ship {
  id: string;
  code: string;
  name: string;
  type: ShipType;
  callSign: string;
  registrationNumber: string;
  grossTonnage: number; // GT
  deadweightTon: number; // DWT
  passengerCapacity: number; // Pax
  cargoCapacityTon: number; // Ton
  vehicleCapacityUnit: number; // Unit Kendaraan
  yearBuilt: number;
  status: ShipStatus;
  currentPort: string;
  createdAt: string;
  updatedAt: string;
}

export type RouteStatus = 'Aktif' | 'Ditutup Sementara' | 'Cuaca Buruk';

export interface PortRoute {
  id: string;
  code: string;
  originPort: string;
  destinationPort: string;
  seaDistanceNm: number; // Nautical Miles
  estimatedHours: number;
  basePassengerFare: number;
  baseCargoFarePerTon: number;
  status: RouteStatus;
  createdAt: string;
  updatedAt: string;
}

export type CargoType = 'Kendaraan' | 'Kontainer' | 'General Cargo' | 'Curah' | 'Barang Berbahaya / DG';

export interface CargoCategory {
  id: string;
  code: string;
  name: string;
  type: CargoType;
  ratePerUnitOrTon: number;
  unit: 'Ton' | 'Unit' | 'm³' | 'TEU';
  requiresSpecialHandling: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PassengerGender = 'L' | 'P';
export type PassengerCategory = 'Dewasa' | 'Anak' | 'Bayi';
export type TicketClass = 'Ekonomi' | 'Bisnis' | 'VIP';
export type TicketStatus = 'Booked' | 'Check-in' | 'Boarded' | 'Cancelled';

export interface Passenger {
  id: string;
  ticketNumber: string;
  voyageId: string;
  shipId: string;
  shipName: string;
  routeId: string;
  routeName: string;
  passengerName: string;
  idCardNumber: string; // NIK or Passport
  gender: PassengerGender;
  age: number;
  category: PassengerCategory;
  classType: TicketClass;
  seatOrCabin: string;
  fare: number;
  bookingDate: string;
  status: TicketStatus;
  luggageWeightKg: number;
  createdAt: string;
  updatedAt: string;
}

export type DeckLocation = 'Main Deck' | 'Lower Deck' | 'Upper Deck' | 'Weather Deck';
export type CargoStatus = 'Manifested' | 'Loaded' | 'Stowed' | 'Discharged' | 'Cancelled';

export interface CargoItem {
  id: string;
  blNumber: string; // Bill of Lading
  voyageId: string;
  shipId: string;
  shipName: string;
  routeId: string;
  routeName: string;
  shipperName: string; // Pengirim
  consigneeName: string; // Penerima
  categoryId: string;
  categoryName: string;
  cargoType: CargoType;
  description: string;
  vehiclePlateNumber?: string;
  weightTon: number;
  volumeM3: number;
  deckLocation: DeckLocation;
  totalCost: number;
  status: CargoStatus;
  isDangerousGoods: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type VoyageStatus = 'Persiapan / Sandar' | 'Boarding & Loading' | 'Sedang Berlayar' | 'Tiba di Pelabuhan' | 'Selesai';

export interface Voyage {
  id: string;
  voyageNumber: string;
  shipId: string;
  shipName: string;
  routeId: string;
  originPort: string;
  destinationPort: string;
  departureTime: string;
  estimatedArrivalTime: string;
  actualDepartureTime?: string;
  actualArrivalTime?: string;
  status: VoyageStatus;
  passengerCount: number;
  cargoWeightTon: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type DatabaseProvider = 'supabase' | 'neon' | 'firebase' | 'local_hybrid';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface NeonConfig {
  connectionString: string;
  httpEndpoint: string;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface DbSettings {
  activeProvider: DatabaseProvider;
  supabase: SupabaseConfig;
  neon: NeonConfig;
  firebase: FirebaseConfig;
  lastSyncAt: string | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  errorMessage?: string;
}

export type ActiveTab = 
  | 'dashboard'
  | 'master_kapal'
  | 'master_rute'
  | 'master_kategori'
  | 'transaksi_penumpang'
  | 'transaksi_muatan'
  | 'transaksi_jadwal'
  | 'laporan'
  | 'database_config';
