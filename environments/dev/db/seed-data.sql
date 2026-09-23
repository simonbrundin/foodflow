-- Seed data for development
-- This data is loaded after the schema is created

-- Insert ingredient types
INSERT INTO ingredient_types (name, category, unit) VALUES
    ('Mjölk', 'Dairy', 'ml'),
    ('Ägg', 'Dairy', 'st'),
    ('Mjöl', 'Dry goods', 'g'),
    ('Smör', 'Dairy', 'g'),
    ('Socker', 'Dry goods', 'g'),
    ('Salt', 'Seasoning', 'g'),
    ('Peppar', 'Seasoning', 'g'),
    ('Olivolja', 'Oils', 'ml'),
    ('Vitlök', 'Vegetables', 'klyfta'),
    ('Lök', 'Vegetables', 'st'),
    ('Tomat', 'Vegetables', 'st'),
    ('Kyckling', 'Meat', 'g'),
    ('Nötfärs', 'Meat', 'g'),
    ('Pasta', 'Dry goods', 'g'),
    ('Ris', 'Dry goods', 'g'),
    ('Broccoli', 'Vegetables', 'g'),
    ('Morot', 'Vegetables', 'st'),
    ('Apelsin', 'Fruits', 'st'),
    ('Banan', 'Fruits', 'st'),
    ('Äpple', 'Fruits', 'st');

-- Insert stores
INSERT INTO stores (name, logo_url, website_url, is_active) VALUES
    ('ICA', 'https://www.ica.se/', 'https://www.ica.se/', true),
    ('Willys', 'https://www.willys.se/', 'https://www.willys.se/', true),
    ('Coop', 'https://www.coop.se/', 'https://www.coop.se/', true);

-- Insert sample recipes
INSERT INTO recipes (name, description, servings, prep_time_minutes, cook_time_minutes, instructions, image_url) VALUES
    ('Pasta Carbonara', 'Klassisk italiensk pasta med ägg, ost och bacon', 4, 10, 20, '1. Koka pastan enligt paketet\n2. Stek bacon\n3. Blanda ägg och ost\n4. Häll av pastan och blanda snabbt med äggblandningen\n5. Servera genast', NULL),
    ('Kycklingwok', 'Snabb och enkel wok med kyckling och grönsaker', 4, 15, 15, '1. Skär kyckling i bitar\n2. Woka kycklingen\n3. Tillsätt grönsaker\n4. Krydda efter smak\n5. Servera med ris', NULL),
    ('Fiskgratäng', 'Laxgratäng med potatis och grädde', 4, 20, 40, '1. Skiva potatis tunt\n2. Lägg i ugnsform\n3. Lägg fisk ovanpå\n4. Häll över grädde\n5. Gratinera i ugn', NULL),
    ('Vegetarisk curry', 'Kikärtscurry med kokosmjölk', 4, 15, 25, '1. Fräs lök och vitlök\n2. Tillsätt kryddor\n3. Lägg i kikärtor och kokosmjölk\n4. Låt koka\n5. Servera med ris', NULL),
    ('Äggröra', 'Enkel äggröra med toast', 2, 5, 5, '1. Vispa ägg\n2. Stek äggen långsamt\n3. Krydda\n4. Servera med toast', NULL);

-- Insert recipe ingredients
INSERT INTO recipe_ingredients (recipe_id, ingredient_type_id, amount, unit, notes) VALUES
    (1, 2, 4, 'st', 'Rumstempererade'),
    (1, 14, 400, 'g', 'Spaghetti'),
    (1, 4, 100, 'g', 'Bacon eller pancetta'),
    (1, 5, 50, 'g', 'Parmesan'),
    (2, 12, 500, 'g', 'Kycklingbröst'),
    (2, 16, 200, 'g', 'Broccoli'),
    (2, 17, 2, 'st', 'Morötter'),
    (2, 15, 400, 'g', 'Jasminris'),
    (3, 2, 4, 'st', 'Laxfilé'),
    (3, 4, 50, 'g', 'Smör'),
    (3, 7, 1, 'g', 'Till gratäng'),
    (4, 14, 400, 'g', 'Basmatiris'),
    (4, 1, 400, 'ml', 'Kokosmjölk'),
    (5, 2, 4, 'st', 'Ägg');

-- Insert current week plan
INSERT INTO week_plans (week_number, year, notes) VALUES
    (39, 2024, 'Veckans matplan');

-- Insert recipes for the week
INSERT INTO week_plan_recipes (week_plan_id, recipe_id, day_of_week, meal_type, servings) VALUES
    (1, 1, 'monday', 'dinner', 4),
    (1, 2, 'tuesday', 'dinner', 4),
    (1, 3, 'wednesday', 'dinner', 4),
    (1, 4, 'thursday', 'dinner', 4),
    (1, 5, 'friday', 'dinner', 2);

-- Create product mappings (example)
INSERT INTO product_mappings (ingredient_type_id, store_id, is_preferred) VALUES
    (1, 1, true),  -- Mjölk from ICA
    (2, 1, true),  -- Ägg from ICA
    (3, 1, true),  -- Mjöl from ICA
    (12, 1, true), -- Kyckling from ICA
    (14, 1, true); -- Pasta from ICA
