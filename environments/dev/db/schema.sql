-- =====================================================================
-- Foodflow Database Schema (legacy — local dev via Tilt)
--
-- ⚠️ This file may be out of sync with the actual running schema.
-- The canonical schema is defined in:
--   environments/common/db/atlas-schema.yaml
--
-- For local dev, Tilt applies this file on startup.
-- Run `pnpm db:migrate` to sync with the Atlas schema.
--
-- To modify the schema:
--   1. Edit this file
--   2. The Tiltfile will DROP and recreate the database on next startup
--   3. Seed data will be re-loaded by Nuxt's server/utils/seed-*.ts
-- =====================================================================

-- Enable UUID generation (requires pgcrypto or PG 13+)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================================
-- Lookup tables (fixed enums) - use TEXT for readable IDs
-- =====================================================================

CREATE TABLE IF NOT EXISTS units (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('weight', 'volume', 'count')),
    to_gram_factor REAL,
    to_ml_factor REAL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- Entity tables - use UUID for global uniqueness
-- =====================================================================

CREATE TABLE IF NOT EXISTS ingredient_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    singular_name TEXT,
    plural_name TEXT,
    category TEXT NOT NULL,
    default_unit_id TEXT REFERENCES units(id),
    aliases TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingredient_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_type_id UUID REFERENCES ingredient_types(id) ON DELETE CASCADE,
    unit_from TEXT NOT NULL,
    unit_to TEXT NOT NULL,
    conversion_factor REAL NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ingredient_type_id, unit_from, unit_to)
);

CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    image_url TEXT,
    prep_time INTEGER NOT NULL DEFAULT 0,
    cook_time INTEGER NOT NULL DEFAULT 0,
    servings INTEGER NOT NULL DEFAULT 4,
    difficulty TEXT NOT NULL DEFAULT 'medium',
    source_url TEXT,
    source_name TEXT,
    ingredients JSONB NOT NULL DEFAULT '[]',
    instructions JSONB NOT NULL DEFAULT '[]',
    rating REAL,
    tags TEXT,
    nutrition_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    chain_id TEXT NOT NULL,
    address TEXT,
    latitude REAL,
    longitude REAL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_scraped TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id),
    external_id TEXT,
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT,
    price REAL NOT NULL,
    original_price REAL,
    unit TEXT NOT NULL,
    price_per_kg REAL NOT NULL,
    price_per_liter REAL,
    image_url TEXT,
    product_url TEXT,
    in_stock BOOLEAN NOT NULL DEFAULT true,
    is_available BOOLEAN NOT NULL DEFAULT true,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_type_id UUID NOT NULL REFERENCES ingredient_types(id),
    store_id UUID NOT NULL REFERENCES stores(id),
    store_product_id UUID NOT NULL REFERENCES store_products(id),
    is_default BOOLEAN NOT NULL DEFAULT false,
    priority INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS week_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    week_number INTEGER NOT NULL,
    year INTEGER NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS week_plan_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_plan_id UUID NOT NULL REFERENCES week_plans(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(id),
    servings INTEGER NOT NULL DEFAULT 4,
    day_of_week INTEGER,
    meal_type TEXT,
    person TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS shopping_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_plan_id UUID REFERENCES week_plans(id),
    store_id UUID NOT NULL REFERENCES stores(id),
    status TEXT NOT NULL DEFAULT 'draft',
    total_price REAL NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shopping_cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES shopping_carts(id) ON DELETE CASCADE,
    ingredient_type_id UUID NOT NULL REFERENCES ingredient_types(id),
    store_product_id UUID NOT NULL REFERENCES store_products(id),
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    price_per_unit REAL NOT NULL,
    total_price REAL NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT true,
    is_optional BOOLEAN NOT NULL DEFAULT false,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- Indexes for better query performance
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_recipes_title ON recipes(title);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX IF NOT EXISTS idx_week_plan_year_week ON week_plans(year, week_number);
CREATE INDEX IF NOT EXISTS idx_product_mappings_ingredient ON product_mappings(ingredient_type_id);
CREATE INDEX IF NOT EXISTS idx_product_mappings_store ON product_mappings(store_id);
CREATE INDEX IF NOT EXISTS idx_store_products_name ON store_products(name);
CREATE INDEX IF NOT EXISTS idx_ingredient_conversions_ingredient ON ingredient_conversions(ingredient_type_id);
