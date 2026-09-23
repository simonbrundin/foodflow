---
status: idea
priority: medium
tags: [import, scraping, recipes]
created: 2026-01-13
---

# Receptimport

## Bakgrund

Kunna importera recept från externa källor som Hello Fresh, Koket.se, ICA.se, etc. genom att klistra in en URL och låta systemet parsera receptet.

## Beskrivning

### Import Flow

```
1. Användaren klistrar in en URL
2. Systemet identifierar källan
3. HTML:n hämtas och parsas
4. Recept-data extraheras:
   - Titel
   - Bild
   - Beskrivning
   - Tid
   - Portioner
   - Ingredienser
   - Instruktioner
5. Förhandsvisning visas
6. Användaren kan redigera/uppdatera
7. Spara till databasen
```

### RecipeParser Interface

```typescript
interface RecipeParser {
  // Identifierare
  name: string                        // "Hello Fresh", "Koket", etc.
  domains: string[]                   // ["hellofresh.se", "www.hellofresh.se"]
  
  // Parse-funktioner
  canParse(url: string): boolean      // Kan denna parser hantera URL:en?
  parse(html: string, url: string): Promise<ParsedRecipe>
}

interface ParsedRecipe {
  title: string
  description?: string
  imageUrl?: string
  prepTime?: number                   // minuter
  cookTime?: number                   // minuter
  totalTime?: number                  // minuter
  servings?: number
  difficulty?: string
  ingredients: {
    rawText: string                   // Originaltext från källan
    amount?: number
    unit?: string
    name?: string
  }[]
  instructions: string[]
  tags?: string[]
  nutrition?: Record<string, number>
  sourceUrl: string
  sourceName: string
  confidence: number                   // 0-1, hur säker är parsern
  warnings?: string[]                 // Saker som inte kunde parsas
}
```

### Inbyggda Parser

#### Generic Parser (fallback)

Använder strukturerad data (JSON-LD, Microdata) som många receptsajter använder:

```typescript
// Standard schema.org/Recipe format
{
  "@type": "Recipe",
  "name": "Pasta Carbonara",
  "image": "...",
  "prepTime": "PT15M",
  "cookTime": "PT20M",
  "recipeYield": "4 servings",
  "recipeIngredient": ["400g spaghetti", "..."],
  "recipeInstructions": [{"@type": "HowToStep", "text": "..."}]
}
```

#### Hello Fresh Parser

```typescript
// Hello Fresh använder JSON-LD men med egen struktur
const helloFreshParser: RecipeParser = {
  name: 'Hello Fresh',
  domains: ['hellofresh.se', 'www.hellofresh.se', 'hellofresh.com'],
  
  canParse: (url) => /hellofresh\.(se|com)/.test(url),
  
  parse: async (html, url) => {
    // Extrahera JSON-LD
    const ldJson = extractJsonLd(html)
    // Parsa Hello Fresh-specifik struktur
    return transformHelloFreshRecipe(ldJson)
  }
}
```

### Ingredient Mapping vid Import

**Problem:**Importerade ingredienser är textsträngar som "400g champinjoner"
**Lösning:** Matcha mot IngredientType-databasen

```typescript
interface ImportIngredientMapping {
  rawText: string                     // "400g champinjoner"
  ingredientTypeId?: string            // Matchad IngredientType
  ingredientTypeName?: string          // "Champinjon"
  amount: number                       // 400
  unit: string                         // "g"
  mappedBy: 'auto' | 'manual'          // Hur mappningen gjordes
  confidence: number                   // 0-1
}
```

### Import UI

**Steg 1: Ange URL**
```
┌─────────────────────────────────────────┐
│  Importera recept                       │
│                                         │
│  Klistra in URL:                        │
│  ┌─────────────────────────────────┐    │
│  │ https://www.hellofresh.se/...  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [ Importera ]                          │
└─────────────────────────────────────────┘
```

**Steg 2: Förhandsvisning**
```
┌─────────────────────────────────────────┐
│  Recept hittat: Pasta Carbonara          │
│  från Hello Fresh                        │
│                                         │
│  ┌─────────┐                            │
│  │  IMG    │  Titeln kan redigeras      │
│  └─────────┘                            │
│                                         │
│  ⏱️ 35 min | 4 portioner | Medium        │
│                                         │
│  Ingredienser:                          │
│  ☑️ 400g spaghetti                       │
│  ☑️ 200g bacon                           │
│  ...                                    │
│                                         │
│  ⚠️ 2 ingredienser kunde inte mappas    │
│     Klicka för att välja                │
│                                         │
│  [ Avbryt ]  [ Spara recept ]           │
└─────────────────────────────────────────┘
```

**Steg 3: Mappa ingredienser (om nödvändigt)**

```
┌─────────────────────────────────────────┐
│  Mappa ingredienser                      │
│                                         │
│  "200g färska ärtor"                    │
│                                         │
│  Sökte: "ärtor"                         │
│  Hittade:                               │
│  ┌─────────────────────────────────┐    │
│  │ � peas.jpg  Ärter (färsk)       │    │
│  │            Ingår i: Svenska     │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ 🫛.jpg     Ärtor (fryst)        │    │
│  │            Ingår i: Fryst       │    │
│  └─────────────────────────────────┘    │
│  [ Skapa ny: "Ärter (färsk)" ]         │
│                                         │
│  [ Hoppa över ]  [ Spara & fortsätt ]  │
└─────────────────────────────────────────┘
```

## API Endpoints

```
POST   /api/recipes/import                     # Importera från URL
POST   /api/recipes/import/batch               # Batch-importera flera URLs
GET    /api/recipes/parsers                     # Lista tillgängliga parser

GET    /api/import/preview?url={url}            # Förhandsvisa utan att spara
POST   /api/import/parse                       # Parsa HTML directly
```

## Parser-funktioner

```typescript
// I server/utils/recipe-parser.ts

export const parsers: RecipeParser[] = [
  genericJsonLdParser,
  helloFreshParser,
  koketParser,
  icaParser,
  receptParser // recept.se
]

export async function parseRecipe(url: string): Promise<ParsedRecipe> {
  const html = await fetchHtml(url)
  
  for (const parser of parsers) {
    if (parser.canParse(url)) {
      return parser.parse(html, url)
    }
  }
  
  // Fallback till generic
  return genericParser.parse(html, url)
}

export async function mapIngredients(ingredients: RawIngredient[]): Promise<ImportIngredientMapping[]> {
  // För varje ingrediens:
  // 1. Parsa mängd och enhet
  // 2. Söka i IngredientType-databasen
  // 3. Returnera mappning med confidence
}
```

## UI Komponenter

- `RecipeImport.vue` - Huvudkomponent för import
- `ImportUrlInput.vue` - URL-inmatning
- `ImportPreview.vue` - Förhandsvisning
- `ImportIngredientMapper.vue` - Mappa ingredienser
- `ImportWarnings.vue` - Visa varningar
- `ParserStatus.vue` - Visa parser-status

## Acceptanskriterier

- [ ] URL kan klistras in och parsas
- [ ] Förhandsvisning visas korrekt
- [ ] Ingredienser mappas automatiskt
- [ ] Manuell mappning fungerar
- [ ] Recept sparas korrekt
- [ ] Varningar visas för oparsade fält
- [ ] Batch-import fungerar

## Anteckningar

- **Juridiskt:** Att klona recepttext är troligen OK (fakta är inte upphovsrättsskyddat), men изображr och instruktioner kan vara det. Var tydlig med att detta är för personligt bruk.
- **Hello Fresh:** Har inget officiellt API. Scraping kan bryta mot deras ToS. Varning!
- **Rate limiting:** Var försiktig med att inte överbelasta externa servrar
- **Cachelagring:** Spara redan importerade recept för att undvika omimport
