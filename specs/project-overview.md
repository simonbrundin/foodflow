---
status: in-progress
priority: critical
tags: [architecture, database, core]
created: 2026-01-13
---

# Foodflow - Övergripande Projektöversikt

## Bakgrund

Foodflow är en meal kit-applikation inspirerad av Hello Fresh. Användaren ska kunna:
1. Planera veckans måltider genom att välja recept
2. Skapa en inköpslista baserat på valda recept
3. Koppla ingredienser till produkter i olika butiker (ICA, Willys, etc.)
4. Importera recept från externa källor (t.ex. Hello Fresh)

## Design Language

### Färgpalett
- **Primary**: `#10B981` (Emerald green - fräschör, mat)
- **Secondary**: `#F59E0B` (Amber - värme, energi)
- **Background**: `#FAFAFA` (Ljusgrå)
- **Surface**: `#FFFFFF` (Vitt)
- **Text Primary**: `#111827` (Nästan svart)
- **Text Secondary**: `#6B7280` (Grå)
- **Error**: `#EF4444` (Röd)
- **Success**: `#22C55E` (Grön)

### Typografi
- **Font**: Inter (Google Fonts)
- **Headings**: 700 weight
- **Body**: 400-500 weight

### UI Framework
- Nuxt UI v4
- Tailwind CSS v4
- Lucide Icons

## Mappstruktur (Nuxt 4)

```
foodflow/
├── src/
│   └── nuxt/
│       ├── app/
│       │   ├── app.vue
│       │   ├── app.config.ts
│       │   ├── assets/
│       │   │   └── css/
│       │   │       └── main.css
│       │   ├── components/
│       │   │   ├── recipe/
│       │   │   │   ├── RecipeCard.vue
│       │   │   │   ├── RecipeDetail.vue
│       │   │   │   ├── RecipeSearch.vue
│       │   │   │   └── RecipeImport.vue
│       │   │   ├── week-plan/
│       │   │   │   ├── WeekPlanGrid.vue
│       │   │   │   ├── DayCard.vue
│       │   │   │   └── RecipePicker.vue
│       │   │   ├── cart/
│       │   │   │   ├── ShoppingCart.vue
│       │   │   │   ├── CartItem.vue
│       │   │   │   └── CartSummary.vue
│       │   │   ├── store/
│       │   │   │   ├── StoreSelector.vue
│       │   │   │   ├── ProductSearch.vue
│       │   │   │   └── ProductMapper.vue
│       │   │   └── ui/
│       │   │       └── (shared components)
│       │   ├── composables/
│       │   │   ├── useRecipes.ts
│       │   │   ├── useWeekPlan.ts
│       │   │   ├── useShoppingCart.ts
│       │   │   ├── useStores.ts
│       │   │   └── useProductMapping.ts
│       │   ├── pages/
│       │   │   ├── index.vue              # Dashboard / Välkomst
│       │   │   ├── recipes/
│       │   │   │   ├── index.vue           # Receptlista/sök
│       │   │   │   └── [id].vue            # Receptdetaljer
│       │   │   ├── week-plan/
│       │   │   │   └── index.vue           # Vecksplanering
│       │   │   ├── cart/
│       │   │   │   └── index.vue           # Varukorg
│       │   │   └── settings/
│       │   │       ├── index.vue           # Inställningar
│       │   │       ├── stores.vue          # Hantera butiker
│       │   │       └── mappings.vue         # Produktmappningar
│       │   ├── stores/
│       │   │   └── (Pinia stores)
│       │   ├── types/
│       │   │   └── index.ts                # TypeScript interfaces
│       │   └── utils/
│       │       ├── recipe-parser.ts
│       │       └── price-calculator.ts
│       ├── server/
│       │   ├── api/
│       │   │   ├── recipes/
│       │   │   │   ├── index.get.ts
│       │   │   │   ├── index.post.ts
│       │   │   │   ├── [id].get.ts
│       │   │   │   └── import.post.ts
│       │   │   ├── week-plan/
│       │   │   │   ├── index.get.ts
│       │   │   │   ├── index.post.ts
│       │   │   │   └── [id].put.ts
│       │   │   ├── cart/
│       │   │   │   ├── index.get.ts
│       │   │   │   ├── index.post.ts
│       │   │   │   └── [id].put.ts
│       │   │   ├── stores/
│       │   │   │   ├── index.get.ts
│       │   │   │   ├── search.post.ts      # Sök produkter i butik
│       │   │   │   └── products/[storeId].get.ts
│       │   │   ├── mappings/
│       │   │   │   ├── index.get.ts
│       │   │   │   ├── index.post.ts
│       │   │   │   └── [ingredientTypeId].get.ts
│       │   │   └── ingredient-types/
│       │   │       ├── index.get.ts
│       │   │       └── search.post.ts
│       │   ├── utils/
│       │   │   ├── db.ts                   # Database connection
│       │   │   └── scrapers/
│       │   │       ├── hello-fresh.ts
│       │   │       └── generic.ts
│       │   └── storage/
│       │       └── db/
│       └── public/
│           └── images/
├── data/
│   └── db/
│       └── foodflow.db                     # SQLite database
├── specs/
└── package.json
```

## Datamodell

### Entiteter

```typescript
// IngredientType - Typ av ingrediens (t.ex. "mjölk", "tomat", "löök")
interface IngredientType {
  id: string
  name: string                    // "Mjölk"
  category: string                // "Mejeri", "Grönsaker", etc.
  unit: 'g' | 'kg' | 'ml' | 'l' | 'st' | 'msk' | 'tsk'
  createdAt: Date
}

// Recipe - Ett recept
interface Recipe {
  id: string
  title: string
  description: string
  imageUrl?: string
  prepTime: number                // minuter
  cookTime: number               // minuter
  servings: number                // standard portioner
  difficulty: 'easy' | 'medium' | 'hard'
  sourceUrl?: string             // varifrån receptet kom
  ingredients: RecipeIngredient[]
  instructions: string[]
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

// RecipeIngredient - Ingrediens i ett recept
interface RecipeIngredient {
  ingredientTypeId: string
  amount: number
  unit: string
  notes?: string                  // "finhackad", "i skivor"
}

// Store - En butik
interface Store {
  id: string
  name: string                    // "ICA", "Willys", "Coop"
  logoUrl?: string
  websiteUrl?: string
  scrapeConfig: StoreScrapeConfig
  isActive: boolean
}

// StoreProduct - Produkt i en butik
interface StoreProduct {
  id: string
  storeId: string
  name: string
  brand?: string
  price: number                  // kronor
  unit: string                   // "1l", "500g", "6st"
  pricePerKg: number             // jämförelsepris
  imageUrl?: string
  productUrl?: string
  inStock: boolean
  lastUpdated: Date
}

// ProductMapping - Koppling mellan ingredienstyp och butiksprodukt
interface ProductMapping {
  id: string
  ingredientTypeId: string
  storeId: string
  storeProductId: string
  isDefault: boolean             // standardval för denna kombination
  createdAt: Date
}

// WeekPlan - En veckoplan
interface WeekPlan {
  id: string
  name: string                    // "Vecka 3, 2026"
  weekNumber: number
  year: number
  startDate: Date
  endDate: Date
  recipes: WeekPlanRecipe[]
  createdAt: Date
  updatedAt: Date
}

// WeekPlanRecipe - Recept i veckoplan med antal portioner
interface WeekPlanRecipe {
  id: string
  weekPlanId: string
  recipeId: string
  servings: number
  dayOfWeek?: number             // 0-6 (valfritt)
  notes?: string
}

// ShoppingCart - En varukorg
interface ShoppingCart {
  id: string
  weekPlanId?: string
  storeId: string
  items: ShoppingCartItem[]
  createdAt: Date
  updatedAt: Date
}

// ShoppingCartItem - Item i varukorgen
interface ShoppingCartItem {
  id: string
  cartId: string
  ingredientTypeId: string
  storeProductId: string
  quantity: number
  unit: string
  pricePerUnit: number
  totalPrice: number
}
```

## API Design

### Recept

| Method | Endpoint | Beskrivning |
|--------|----------|-------------|
| GET | `/api/recipes` | Hämta alla recept (med filtrering) |
| GET | `/api/recipes/:id` | Hämta ett recept |
| POST | `/api/recipes` | Skapa nytt recept |
| PUT | `/api/recipes/:id` | Uppdatera recept |
| DELETE | `/api/recipes/:id` | Ta bort recept |
| POST | `/api/recipes/import` | Importera recept från URL |

### Vecksplanering

| Method | Endpoint | Beskrivning |
|--------|----------|-------------|
| GET | `/api/week-plan` | Hämta aktuell veckoplan |
| GET | `/api/week-plan/:id` | Hämta specifik veckoplan |
| POST | `/api/week-plan` | Skapa ny veckoplan |
| PUT | `/api/week-plan/:id` | Uppdatera veckoplan |
| DELETE | `/api/week-plan/:id` | Ta bort veckoplan |

### Varukorg

| Method | Endpoint | Beskrivning |
|--------|----------|-------------|
| GET | `/api/cart` | Hämta aktuell varukorg |
| POST | `/api/cart/generate` | Generera varukorg från veckoplan |
| PUT | `/api/cart/items/:id` | Uppdatera kvantitet |
| DELETE | `/api/cart/items/:id` | Ta bort item |
| DELETE | `/api/cart` | Töm varukorgen |

### Butiker & Produkter

| Method | Endpoint | Beskrivning |
|--------|----------|-------------|
| GET | `/api/stores` | Hämta alla butiker |
| POST | `/api/stores/search` | Sök produkter i butik |
| GET | `/api/stores/:id/products` | Hämta produkter från butik |

### Produktmappning

| Method | Endpoint | Beskrivning |
|--------|----------|-------------|
| GET | `/api/mappings` | Hämta alla mappningar |
| GET | `/api/mappings/:ingredientTypeId` | Hämta mappningar för ingredienstyp |
| POST | `/api/mappings` | Skapa ny mappning |
| DELETE | `/api/mappings/:id` | Ta bort mappning |

## Teknisk Stack

- **Framework**: Nuxt 4
- **UI**: Nuxt UI 4, Tailwind CSS 4
- **Database**: SQLite med Drizzle ORM
- **Icons**: Lucide
- **State**: Pinia
- **Testing**: Vitest

## Acceptanskriterier

- [ ] Projektet kan startas med `pnpm dev`
- [ ] Mappstrukturen följer specifikationen
- [ ] Databasen kan initieras med grunddata
- [ ] Grundläggande CRUD för recept fungerar
- [ ] Vecksplanering kan skapas och redigeras
- [ ] Varukorg kan genereras från veckoplan
- [ ] API:erna följer specifikationen

## Anteckningar

- Webb-scrapping för att hämta produkter och recept kräver respektive butiks hemsidas ToS och kan behöva API-alternativ
- Hello Fresh har inget officiellt API för receptimport
- Prisjämförelse behöver uppdateras regelbundet
