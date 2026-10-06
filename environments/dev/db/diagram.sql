-- Simplified schema for ChartDB visualization
-- Compatible with ChartDB's SQL Script import (PostgreSQL flavor)
-- Features: TEXT primary keys, CURRENT_TIMESTAMP defaults, ANSI foreign keys
--
-- The authoritative PostgreSQL schema is in db/schema.sql

CREATE TABLE units (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    type TEXT NOT NULL,
    to_gram_factor REAL,
    to_ml_factor REAL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ingredient_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    singular_name TEXT,
    plural_name TEXT,
    category TEXT NOT NULL,
    default_unit_id TEXT REFERENCES units(id),
    aliases TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ingredient_conversions (
    id TEXT PRIMARY KEY,
    ingredient_type_id TEXT REFERENCES ingredient_types(id),
    unit_from TEXT NOT NULL,
    unit_to TEXT NOT NULL,
    conversion_factor REAL NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE recipes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    image_url TEXT,
    prep_time INTEGER NOT NULL DEFAULT 0,
    cook_time INTEGER NOT NULL DEFAULT 0,
    servings INTEGER NOT NULL DEFAULT 4,
    difficulty TEXT NOT NULL DEFAULT 'medium',
    source_url TEXT,
    source_name TEXT,
    rating REAL,
    tags TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE stores (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    chain_id TEXT NOT NULL,
    address TEXT,
    latitude REAL,
    longitude REAL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_scraped TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE store_products (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL REFERENCES stores(id),
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
    last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE product_mappings (
    id TEXT PRIMARY KEY,
    ingredient_type_id TEXT NOT NULL REFERENCES ingredient_types(id),
    store_id TEXT NOT NULL REFERENCES stores(id),
    store_product_id TEXT NOT NULL REFERENCES store_products(id),
    is_default BOOLEAN NOT NULL DEFAULT false,
    priority INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE week_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    week_number INTEGER NOT NULL,
    year INTEGER NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE week_plan_recipes (
    id TEXT PRIMARY KEY,
    week_plan_id TEXT NOT NULL REFERENCES week_plans(id),
    recipe_id TEXT NOT NULL REFERENCES recipes(id),
    servings INTEGER NOT NULL DEFAULT 4,
    day_of_week INTEGER,
    meal_type TEXT,
    person TEXT,
    notes TEXT
);

CREATE TABLE shopping_carts (
    id TEXT PRIMARY KEY,
    week_plan_id TEXT REFERENCES week_plans(id),
    store_id TEXT NOT NULL REFERENCES stores(id),
    status TEXT NOT NULL DEFAULT 'draft',
    total_price REAL NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE shopping_cart_items (
    id TEXT PRIMARY KEY,
    cart_id TEXT NOT NULL REFERENCES shopping_carts(id),
    ingredient_type_id TEXT NOT NULL REFERENCES ingredient_types(id),
    store_product_id TEXT NOT NULL REFERENCES store_products(id),
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    price_per_unit REAL NOT NULL,
    total_price REAL NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT true,
    is_optional BOOLEAN NOT NULL DEFAULT false,
    notes TEXT
);

CREATE TABLE app_settings (
    "key" TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);
