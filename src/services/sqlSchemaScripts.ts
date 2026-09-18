export const POSTGRESQL_SCHEMA_SQL = `-- ========================================================
-- SISTEM MANAJEMEN MUATAN KAPAL & DATA PENUMPANG
-- Schema kompatibel untuk Supabase & Neon DB PostgreSQL
-- ========================================================

-- 1. Tabel Master Data Kapal
CREATE TABLE IF NOT EXISTS ships (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    call_sign TEXT,
    registration_number TEXT,
    gross_tonnage NUMERIC NOT NULL DEFAULT 0,
    deadweight_ton NUMERIC NOT NULL DEFAULT 0,
    passenger_capacity INTEGER NOT NULL DEFAULT 0,
    cargo_capacity_ton NUMERIC NOT NULL DEFAULT 0,
    vehicle_capacity_unit INTEGER NOT NULL DEFAULT 0,
    year_built INTEGER,
    status TEXT NOT NULL DEFAULT 'Beroperasi',
    current_port TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Master Rute & Pelabuhan
CREATE TABLE IF NOT EXISTS routes (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    origin_port TEXT NOT NULL,
    destination_port TEXT NOT NULL,
    sea_distance_nm NUMERIC DEFAULT 0,
    estimated_hours NUMERIC DEFAULT 0,
    base_passenger_fare NUMERIC DEFAULT 0,
    base_cargo_fare_per_ton NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Aktif',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Master Kategori Muatan & Tarif
CREATE TABLE IF NOT EXISTS cargo_categories (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    rate_per_unit_or_ton NUMERIC DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'Ton',
    requires_special_handling BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Jadwal Pelayaran (Voyage)
CREATE TABLE IF NOT EXISTS voyages (
    id TEXT PRIMARY KEY,
    voyage_number TEXT NOT NULL UNIQUE,
    ship_id TEXT REFERENCES ships(id) ON DELETE SET NULL,
    route_id TEXT REFERENCES routes(id) ON DELETE SET NULL,
    departure_time TIMESTAMPTZ NOT NULL,
    estimated_arrival_time TIMESTAMPTZ NOT NULL,
    actual_departure_time TIMESTAMPTZ,
    actual_arrival_time TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'Persiapan / Sandar',
    passenger_count INTEGER DEFAULT 0,
    cargo_weight_ton NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Transaksi Manifest Penumpang
CREATE TABLE IF NOT EXISTS passengers (
    id TEXT PRIMARY KEY,
    ticket_number TEXT NOT NULL UNIQUE,
    voyage_id TEXT REFERENCES voyages(id) ON DELETE CASCADE,
    ship_id TEXT REFERENCES ships(id) ON DELETE SET NULL,
    ship_name TEXT,
    route_id TEXT REFERENCES routes(id) ON DELETE SET NULL,
    route_name TEXT,
    passenger_name TEXT NOT NULL,
    id_card_number TEXT NOT NULL,
    gender VARCHAR(2) NOT NULL,
    age INTEGER NOT NULL,
    category TEXT NOT NULL,
    class_type TEXT NOT NULL,
    seat_or_cabin TEXT,
    fare NUMERIC DEFAULT 0,
    booking_date DATE DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'Booked',
    luggage_weight_kg NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabel Transaksi Manifest Muatan Kapal (B/L)
CREATE TABLE IF NOT EXISTS cargo_items (
    id TEXT PRIMARY KEY,
    bl_number TEXT NOT NULL UNIQUE,
    voyage_id TEXT REFERENCES voyages(id) ON DELETE CASCADE,
    ship_id TEXT REFERENCES ships(id) ON DELETE SET NULL,
    ship_name TEXT,
    route_id TEXT REFERENCES routes(id) ON DELETE SET NULL,
    route_name TEXT,
    shipper_name TEXT NOT NULL,
    consignee_name TEXT NOT NULL,
    category_id TEXT REFERENCES cargo_categories(id) ON DELETE SET NULL,
    category_name TEXT,
    cargo_type TEXT NOT NULL,
    description TEXT NOT NULL,
    vehicle_plate_number TEXT,
    weight_ton NUMERIC DEFAULT 0,
    volume_m3 NUMERIC DEFAULT 0,
    deck_location TEXT DEFAULT 'Main Deck',
    total_cost NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Manifested',
    is_dangerous_goods BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index performa pencarian operasional
CREATE INDEX IF NOT EXISTS idx_passengers_voyage ON passengers(voyage_id);
CREATE INDEX IF NOT EXISTS idx_cargo_voyage ON cargo_items(voyage_id);
CREATE INDEX IF NOT EXISTS idx_voyages_ship ON voyages(ship_id);
`;

export const FIRESTORE_RULES_GUIDE = `// Aturan Keamanan Firebase Firestore (firestore.rules)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Akses penuh untuk koleksi sistem manajemen operasional pelabuhan
    match /{document=**} {
      allow read, write: if true; // Untuk produksi, batasi berdasarkan auth UID
    }
  }
}
`;
