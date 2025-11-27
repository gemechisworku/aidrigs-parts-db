-- Migration: Add missing tables for CRUD implementation
-- Run order: ENUMs first, then tables with dependencies

-- ============================================
-- 1. CREATE ENUM TYPES
-- ============================================

-- Create partner_type if not exists
DO $$ BEGIN
    CREATE TYPE partner_type_enum AS ENUM ('supplier', 'customer', 'AR_storage', 'forwarder');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create quote status if not exists
DO $$ BEGIN
    CREATE TYPE quote_status_enum AS ENUM ('draft','pending','approved','rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create quote type if not exists
DO $$ BEGIN
    CREATE TYPE quote_type_enum AS ENUM ('cost','price');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create freight type if not exists
DO $$ BEGIN
    CREATE TYPE freight_type_enum AS ENUM ('air','sea','land','other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create incoterm if not exists
DO $$ BEGIN
    CREATE TYPE incoterm_enum AS ENUM (
      'EXW','FCA','CPT','CIP','DAP','DPU','DDP','FAS','FOB','CFR','CIF'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create shipment cost type if not exists
DO $$ BEGIN
    CREATE TYPE shipment_cost_type_enum AS ENUM ('freight','insurance','other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create port type if not exists
DO $$ BEGIN
    CREATE TYPE port_type_enum AS ENUM ('Sea','Air','Land');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 2. PORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    port_code VARCHAR(5) UNIQUE NOT NULL,
    port_name VARCHAR(60),
    country VARCHAR(60),
    city VARCHAR(60),
    type port_type_enum,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. PRICE TIERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS price_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(252),
    tier_kind VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 4. PARTNERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE,
    name VARCHAR(60),
    street_number VARCHAR(10),
    city VARCHAR(60),
    country VARCHAR(60),
    type partner_type_enum,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- ============================================
-- 5. CONTACTS TABLE (depends on partners)
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL,
    full_name VARCHAR(60),
    job_title VARCHAR(60),
    email VARCHAR(60),
    phone1 VARCHAR(12),
    phone2 VARCHAR(12),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT fk_contacts_partner FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
);

-- ============================================
-- 6. HS CODES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS hs_codes (
    hs_code VARCHAR(14) PRIMARY KEY,
    description_en VARCHAR(252),
    description_pr VARCHAR(252),
    description_pt VARCHAR(252),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 7. HS CODE TARIFF TABLE (depends on hs_codes)
-- ============================================
CREATE TABLE IF NOT EXISTS hs_code_tariff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hs_code VARCHAR(14),
    country_name VARCHAR(60),
    tariff_rate DECIMAL,
    last_updated DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_tariff_hscode FOREIGN KEY (hs_code) REFERENCES hs_codes(hs_code),
    CONSTRAINT unique_hscode_country UNIQUE (hs_code, country_name)
);

-- ============================================
-- 8. VEHICLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS vehicles (
    vin VARCHAR(17) PRIMARY KEY,
    make VARCHAR(60),
    model VARCHAR(60),
    year DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===================================================================
-- 9. VEHICLES EQUIVALENCE TABLE (depends on vehicles)
-- ============================================
CREATE TABLE IF NOT EXISTS vehicles_equivalence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vin_prefix VARCHAR(12),
    equivalent_families VARCHAR(12),
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_veq_vehicle FOREIGN KEY (vin_prefix) REFERENCES vehicles(vin)
);

-- ============================================
-- 10. FX RATE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS fx_rate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    currency_code VARCHAR(3) NOT NULL,
    fx_rate NUMERIC(18,8) NOT NULL,
    rate_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_currency_date UNIQUE (currency_code, rate_date)
);

-- ============================================
-- 11. QUOTES TABLE (depends on partners, fx_rate)
-- ============================================
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_ref_num VARCHAR(10) UNIQUE,
    partner_id UUID,
    quoted_date DATE,
    status quote_status_enum,
    quote_type quote_type_enum,
    valid_date DATE,
    total_usd NUMERIC(18,4),
    fx_rate_id UUID,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_quotes_partner FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE SET NULL,
    CONSTRAINT fk_quotes_fxrate FOREIGN KEY (fx_rate_id) REFERENCES fx_rate(id) ON DELETE SET NULL
);

-- ============================================
-- 12. QUOTE_ITEMS TABLE (depends on quotes, ports)
-- ============================================
CREATE TABLE IF NOT EXISTS quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL,
    part_id VARCHAR(12),
    origin_port VARCHAR(5),
    origin_incoterm VARCHAR(3),
    unit_usd NUMERIC(18,4),
    discount_percent NUMERIC(5,2),
    quantity INTEGER,
    total_usd NUMERIC(18,4),
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_qi_quote FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

-- ============================================
-- 13. SHIPMENTS TABLE (depends on quotes)
-- ============================================
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_ref_num VARCHAR(10),
    quote_id UUID,
    freight_type freight_type_enum,
    origin_port VARCHAR(5),
    origin_incoterm incoterm_enum,
    destination_port VARCHAR(5),
    destination_incoterm incoterm_enum,
    shipment_date DATE,
    est_lead_time_days INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_shipments_quote FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL
);

-- ============================================
-- 14. FREIGHT_COSTS TABLE (depends on shipments)
-- ============================================
CREATE TABLE IF NOT EXISTS freight_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL,
    cost_type shipment_cost_type_enum,
    cost_amount NUMERIC(18,2),
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_freight_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
);

-- ============================================
-- 15. GRNS TABLE (Goods Received Notes)
-- ============================================
CREATE TABLE IF NOT EXISTS grns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_ref_num VARCHAR(10) UNIQUE,
    quote_ref_num VARCHAR(10),
    responsible_partner VARCHAR(10),
    origin_port VARCHAR(10),
    dest_port VARCHAR(10),
    status VARCHAR(20),
    pickup_date DATE,
    delivery_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 16. GRN_ITEMS TABLE (depends on grns)
-- ============================================
CREATE TABLE IF NOT EXISTS grn_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_id UUID NOT NULL,
    part_id INT,
    quantity INT,
    unit_usd DECIMAL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_grn_items_grn FOREIGN KEY (grn_id) REFERENCES grns(id) ON DELETE CASCADE
);

-- ============================================
-- 17. PRICE_TIERS_MAP TABLE (depends on price_tiers)
-- ============================================
CREATE TABLE IF NOT EXISTS price_tiers_map (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_id VARCHAR(12) NOT NULL,
    tier_id UUID NOT NULL,
    price NUMERIC(18,4),
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_part_tier UNIQUE(part_id, tier_id),
    CONSTRAINT fk_ptm_tier FOREIGN KEY (tier_id) REFERENCES price_tiers(id) ON DELETE CASCADE
);

-- ============================================
-- 18. SUPPLIERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE,
    name VARCHAR(100),
    street VARCHAR(100),
    city VARCHAR(60),
    country VARCHAR(60),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 19. SUPPLIER_PARTS TABLE (depends on suppliers)
-- ============================================
CREATE TABLE IF NOT EXISTS supplier_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL,
    part_id VARCHAR(12) NOT NULL,
    supplier_part_number VARCHAR(50),
    supplier_price NUMERIC(18,4),
    lead_time_days INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_sp_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_partners_type ON partners(type);
CREATE INDEX IF NOT EXISTS idx_partners_deleted_at ON partners(deleted_at);
CREATE INDEX IF NOT EXISTS idx_contacts_partner ON contacts(partner_id);
CREATE INDEX IF NOT EXISTS idx_quotes_partner ON quotes(partner_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_shipments_quote ON shipments(quote_id);
CREATE INDEX IF NOT EXISTS idx_freight_costs_shipment ON freight_costs(shipment_id);
CREATE INDEX IF NOT EXISTS idx_grn_items_grn ON grn_items(grn_id);
CREATE INDEX IF NOT EXISTS idx_supplier_parts_supplier ON supplier_parts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_fx_rate_currency ON fx_rate(currency_code, rate_date);
