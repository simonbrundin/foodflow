---
status: idea
priority: high
tags: [database, recipes, core]
created: 2026-01-13
---

# Receptdatabas

## Bakgrund

En stor databas med recept som användaren kan välja mellan för sin veckoplan. Varje recept innehåller ingredienser, instruktioner och metadata.

## Beskrivning

### Recept-Entity

```typescript
interface Recipe {
  id: string
  title: string                    // "Krämig pastagratäng"
  description: string              // Kort beskrivning
  imageUrl?: string
  prepTime: number                 // Förberedelsetid i minuter
  cookTime: number                 // Tillagningstid i minuter
  servings: number                 // Standardportioner (t.ex. 4)
  difficulty: 'easy' | 'medium' | 'hard'
  sourceUrl?: string              // Originalkälla
  sourceName?: string             // "Hello Fresh", "Koket", etc.
  ingredients: RecipeIngredient[]
  instructions: string[]           // Steg-för-steg
  tags: string[]                   // ["vegetarisk", "snabb", "barnvänlig"]
  nutritionInfo?: NutritionInfo
  createdAt: Date
  updatedAt: Date
}

interface RecipeIngredient {
  ingredientTypeId: string         // Koppling till IngredientType
  amount: number
  unit: string
  notes?: string                   // "tärnad", "färsk", "rivet"
  isOptional?: boolean
}

interface NutritionInfo {
  calories: number
  protein: number                 // gram
  carbs: number                   // gram
  fat: number                     // gram
  fiber?: number
}
```

### IngredientType-Entity

```typescript
interface IngredientType {
  id: string
  name: string                    // "Kronärtskocka"
  singularName?: string           // För grammatisk korrekthet
  pluralName?: string             // "Kronärtskockor"
  category: IngredientCategory
  defaultUnit: 'g' | 'kg' | 'ml' | 'l' | 'st' | 'msk' | 'tsk' | 'krm'
  aliases?: string[]              // ["artischock", "cynara"]
  createdAt: Date
}

type IngredientCategory = 
  | 'kött' | 'fisk' | 'fågel'
  | 'mejeri' | 'ägg'
  | 'grönsaker' | 'frukt' | 'bär'
  | 'spannmål' | 'pasta' | 'bröd'
  | 'baljväxter' | 'nötter' | 'frön'
  | 'kryddor' | 'örter'
  | 'olja' | 'fett'
  | 'sås' | 'konserver'
  | 'sötsaker' | 'dryck'
  | 'annat'
```

### Sök & Filtrering

**Filteralternativ:**
- Fritextsökning (titel, beskrivning, ingredienser, tags)
- Tillagningstid (max minuter)
- Svårighetsgrad
- Taggar (flera kan väljas)
- Ingredienser som ska inkluderas/exkluderas
- Diet (vegetarisk, vegansk, glutenfri, laktosfri)

**Sortering:**
- Namn (A-Ö, Ö-A)
- Tid (kortast/längst)
- Svårighetsgrad
- Senast tillagd
- Popularitet (baserat på användning i veckoplaner)

### Receptsida

**Visa:**
- Bild
- Titel & beskrivning
- Tid (förberedelse + tillagning)
- Svårighetsgrad (badge)
- Antal portioner (justerbar)
- Ingredienser (med checkbox så man kan bocka av)
- Instruktioner (steg för steg)
- Näringsinformation
- Tags
- Källa (om importerat)

**Aktioner:**
- Lägg till i veckoplan
- Redigera recept
- Ta bort recept
- Importera liknande

## API Endpoints

```
GET    /api/recipes                    # Lista med filtrering & pagination
GET    /api/recipes/:id                # Enkelt recept
POST   /api/recipes                    # Skapa recept
PUT    /api/recipes/:id                # Uppdatera recept
DELETE /api/recipes/:id                # Ta bort recept

GET    /api/ingredient-types           # Alla ingredienstyper
GET    /api/ingredient-types/:id       # En ingredienstyp
POST   /api/ingredient-types           # Skapa ingredienstyp
PUT    /api/ingredient-types/:id       # Uppdatera
DELETE /api/ingredient-types/:id       # Ta bort
```

## UI Komponenter

- `RecipeCard.vue` - Kort för receptlistor (bild, titel, tid, svårighet)
- `RecipeDetail.vue` - Fullständig receptvy
- `RecipeSearch.vue` - Sök & filter-formulär
- `RecipeForm.vue` - Skapa/redigera recept
- `IngredientList.vue` - Lista ingredienser med mängd
- `IngredientPicker.vue` - Välj lägg till ingrediens

## Acceptanskriterier

- [ ] CRUD för recept fungerar
- [ ] Sök och filtrering fungerar
- [ ] Ingredienser kopplas till IngredientType
- [ ] Tags kan läggas till och filtreras
- [ ] Recept kan dupliceras/redigeras
