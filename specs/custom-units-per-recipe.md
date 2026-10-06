# Custom Units Per Recipe

## Översikt ✅
Låt användaren välja enhet per ingrediens per recept, med möjlighet att spara inställningen.

## Databasändringar ✅

### Tabell: `units` ✅
```sql
CREATE TABLE units (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,           -- 'gram', 'deciliter', 'matsked'
  short_name TEXT NOT NULL,     -- 'g', 'dl', 'msk'
  type TEXT NOT NULL,           -- 'weight', 'volume', 'count'
  to_gram_factor REAL,          -- Factor to convert to grams (for weight units)
  to_ml_factor REAL,            -- Factor to convert to ml (for volume units)
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

Innehåller 9 standardenheter:
- `st` (stycken) - count
- `g` (gram) - weight
- `kg` (kilogram) - weight
- `ml` (milliliter) - volume
- `l` (liter) - volume
- `dl` (deciliter) - volume
- `msk` (matsked) - volume
- `tsk` (tesked) - volume
- `krm` (kryddmått) - volume

### Ändring i ingredient_types
- `default_unit` → `default_unit_id` (TEXT REFERENCES units(id))

### Struktur i recipe_ingredients (JSONB)
```json
{
  "ingredientTypeId": "ing_kantareller",
  "amount": 400,
  "unitId": "g",
  "defaultUnitId": "g",
  "notes": null
}
```

## API ✅

### GET /api/units ✅
Returnerar alla tillgängliga enheter sorterade efter sort_order.

### GET /api/recipes/:id ✅
Returnerar nu ingredients med:
- `unitId` - användarens valda enhet för ingrediensen
- `defaultUnitId` - standardenheten för ingredienstypen

### PUT /api/recipes/:id/ingredients/:ingredientId ✅
Uppdaterar en enskild ingrediens:
```json
{
  "unitId": "g",
  "amount": 400,
  "notes": "T.ex. finhackad"
}
```

## Frontend ✅

### Receptvy ✅
- Enheten visas som klickbar knapp (visar nedåtpil om flera enheter finns)
- Klicka på enhet → loopar genom tillgängliga enheter
- Visar standardenheten inom parentes om annan enhet valts
- Sparar ändring automatiskt via API

### Enhetsväljare i edit-läge ✅
- Dropdown med alla tillgängliga enheter
- Dynamiskt hämtad från `/api/units`
