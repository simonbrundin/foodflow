import { execute } from './db'

export async function initSchema(): Promise<void> {
  console.log('Initializing database schema...')
  
  await execute(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS ingredient_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      singular_name TEXT,
      plural_name TEXT,
      category TEXT NOT NULL,
      default_unit TEXT NOT NULL,
      aliases TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS recipes (
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
      ingredients JSONB NOT NULL DEFAULT '[]',
      instructions JSONB NOT NULL DEFAULT '[]',
      tags TEXT,
      nutrition_info JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      chain_id TEXT NOT NULL,
      address TEXT,
      latitude REAL,
      longitude REAL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      last_scraped TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS store_products (
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
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS product_mappings (
      id TEXT PRIMARY KEY,
      ingredient_type_id TEXT NOT NULL REFERENCES ingredient_types(id),
      store_id TEXT NOT NULL REFERENCES stores(id),
      store_product_id TEXT NOT NULL REFERENCES store_products(id),
      is_default BOOLEAN NOT NULL DEFAULT false,
      priority INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS week_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      week_number INTEGER NOT NULL,
      year INTEGER NOT NULL,
      start_date TIMESTAMP WITH TIME ZONE NOT NULL,
      end_date TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS week_plan_recipes (
      id TEXT PRIMARY KEY,
      week_plan_id TEXT NOT NULL REFERENCES week_plans(id) ON DELETE CASCADE,
      recipe_id TEXT NOT NULL REFERENCES recipes(id),
      servings INTEGER NOT NULL DEFAULT 4,
      day_of_week INTEGER,
      meal_type TEXT,
      notes TEXT
    );
    
    CREATE TABLE IF NOT EXISTS shopping_carts (
      id TEXT PRIMARY KEY,
      week_plan_id TEXT REFERENCES week_plans(id),
      store_id TEXT NOT NULL REFERENCES stores(id),
      status TEXT NOT NULL DEFAULT 'draft',
      total_price REAL NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS shopping_cart_items (
      id TEXT PRIMARY KEY,
      cart_id TEXT NOT NULL REFERENCES shopping_carts(id) ON DELETE CASCADE,
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
    
    CREATE INDEX IF NOT EXISTS idx_recipes_title ON recipes(title);
    CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);
    CREATE INDEX IF NOT EXISTS idx_week_plan_year_week ON week_plans(year, week_number);
    CREATE INDEX IF NOT EXISTS idx_product_mappings_ingredient ON product_mappings(ingredient_type_id);
    CREATE INDEX IF NOT EXISTS idx_product_mappings_store ON product_mappings(store_id);
    CREATE INDEX IF NOT EXISTS idx_store_products_name ON store_products(name);
  `)
  
  console.log('Database schema created')
}
