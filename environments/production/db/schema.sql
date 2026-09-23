-- Foodflow Database Schema - Production
-- This is the production schema without seed data

CREATE TABLE IF NOT EXISTS ingredient_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100),
    unit VARCHAR(50) DEFAULT 'st',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recipes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    servings INTEGER DEFAULT 2,
    prep_time_minutes INTEGER,
    cook_time_minutes INTEGER,
    instructions TEXT,
    image_url VARCHAR(500),
    source_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_type_id INTEGER REFERENCES ingredient_types(id),
    amount DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50),
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500),
    website_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS store_products (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    price DECIMAL(10,2),
    unit VARCHAR(50),
    category VARCHAR(100),
    image_url VARCHAR(500),
    product_url VARCHAR(500),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_mappings (
    id SERIAL PRIMARY KEY,
    ingredient_type_id INTEGER REFERENCES ingredient_types(id) ON DELETE CASCADE,
    store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
    store_product_id INTEGER REFERENCES store_products(id) ON DELETE SET NULL,
    amount DECIMAL(10,2),
    unit VARCHAR(50),
    is_preferred BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS week_plans (
    id SERIAL PRIMARY KEY,
    week_number INTEGER NOT NULL,
    year INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(week_number, year)
);

CREATE TABLE IF NOT EXISTS week_plan_recipes (
    id SERIAL PRIMARY KEY,
    week_plan_id INTEGER REFERENCES week_plans(id) ON DELETE CASCADE,
    recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20),
    meal_type VARCHAR(50),
    servings INTEGER DEFAULT 2,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shopping_carts (
    id SERIAL PRIMARY KEY,
    week_plan_id INTEGER REFERENCES week_plans(id) ON DELETE SET NULL,
    store_id INTEGER REFERENCES stores(id),
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shopping_cart_items (
    id SERIAL PRIMARY KEY,
    shopping_cart_id INTEGER REFERENCES shopping_carts(id) ON DELETE CASCADE,
    store_product_id INTEGER REFERENCES store_products(id),
    ingredient_type_id INTEGER REFERENCES ingredient_types(id),
    amount DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50),
    is_checked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_type_id);
CREATE INDEX idx_store_products_store_id ON store_products(store_id);
CREATE INDEX idx_product_mappings_ingredient_id ON product_mappings(ingredient_type_id);
CREATE INDEX idx_product_mappings_store_id ON product_mappings(store_id);
CREATE INDEX idx_week_plan_recipes_week_plan_id ON week_plan_recipes(week_plan_id);
CREATE INDEX idx_week_plan_recipes_recipe_id ON week_plan_recipes(recipe_id);
CREATE INDEX idx_shopping_cart_items_cart_id ON shopping_cart_items(shopping_cart_id);
