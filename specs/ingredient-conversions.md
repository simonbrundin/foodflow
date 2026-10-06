# Ingrediens-konverteringar

## Översikt
Skapa ett system för att konvertera mellan volymenheter (dl, msk, tsk) och viktenheter (g, kg) för ingredienser, eftersom olika ingredienser har olika densitet.

## Bakgrund
- 1 dl vetemjöl ≈ 65g
- 1 dl vatten = 100g
- 1 dl socker ≈ 85g
- Konvertering behövs för att visa ingredienser i båda format

## Databasändringar ✅

### Ny tabell: `ingredient_conversions`
```sql
CREATE TABLE ingredient_conversions (
  id TEXT PRIMARY KEY,
  ingredient_type_id TEXT REFERENCES ingredient_types(id) ON DELETE CASCADE,
  unit_from TEXT NOT NULL,          -- 'dl', 'msk', 'tsk', 'krm'
  unit_to TEXT NOT NULL,            -- 'g', 'kg'
  conversion_factor REAL NOT NULL,  -- multiplikationsfaktor
  notes TEXT,                       -- t.ex. 'löst packad', 'struken'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate conversions
  UNIQUE(ingredient_type_id, unit_from, unit_to)
);
```

### Exempel-data ✅
Seed-data finns i `seed-conversions.ts` med ~50+ konverteringar för vanliga svenska ingredienser.

## API Endpoints ✅

### GET /api/ingredient-conversions
Returnerar alla konverteringar, kan filtreras på ingredientTypeId via query.

### POST /api/ingredient-conversions
Skapar en ny konvertering.

### Konverteringslogik
```typescript
function convertIngredient(
  amount: number,
  fromUnit: string,
  toUnit: string,
  ingredientTypeId: string
): number | null
```

## Fix: Korrupt receptdata ✅

### Problemet
Vissa importerade recept hade felaktigt formaterade ingredienser där:
- `unit` var alltid "st" istället för korrekt enhet (g, ml, msk, etc.)
- `ingredientTypeId` innehöll hela råa texten inklusive enhet, t.ex.:
  - `"g kantareller"` istället för `"kantareller"`
  - `"dl vispgrädde"` istället för `"vispgrädde"`

### Lösning
1. Skapade PostgreSQL-funktion `fix_corrupted_ingredient()` för att:
   - Extrahera enhet från början av `ingredientTypeId`
   - Konvertera enheter (dl → ml)
   - Matcha ingrediensnamn mot `ingredient_types`-tabellen
2. Applicerade fix på 2 korrupta recept
3. Förbättrade `save-import.post.ts` med:
   - Bättre enhetsvalidering och normalisering
   - Förbättrad ingrediensmatchning
   - Ignorerar råa texter som börjar med enhetsprefix

### Resultat
- Före: `400 stg kantareller`
- Efter: `400 g kantareller` ✅

- Före: `2 stdl vispgrädde`
- Efter: `200 ml vispgrädde` ✅

## Tasks
- [x] Lägg till ingredient_conversions tabell i schema
- [x] Lägg till seed-data för konverteringar
- [x] Skapa API endpoints
- [ ] Lägg till konverteringslogik i frontend (TODO)
- [x] Fixa korrupt receptdata i databasen
- [x] Förbättra importlogik för att undvika framtida problem
