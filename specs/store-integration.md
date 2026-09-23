---
status: idea
priority: high
tags: [stores, scraping, integration]
created: 2026-01-13
---

# Butiksintegration

## Bakgrund

Koppla ihop ingredienser med produkter från olika butiker (ICA, Willys, Coop, etc.) så att inköpslistan kan genereras med faktiska produkter och priser.

## Beskrivning

### Store-Entity

```typescript
interface Store {
  id: string
  name: string                        // "ICA Kvantum"
  chainId: StoreChain                 // "ica", "willys", "coop", etc.
  address?: string
  location?: {
    lat: number
    lng: number
  }
  isActive: boolean                   // Är scrapern aktiv?
  lastScraped?: Date
  createdAt: Date
}

type StoreChain = 'ica' | 'willys' | 'coop' | 'hemkop' | 'citygross' | 'netto' | 'lidl'

interface StoreChainConfig {
  id: StoreChain
  name: string                        // "ICA", "Willys"
  logo: string
  baseUrl: string                     // "https://www.ica.se"
  searchUrlTemplate: string           // "https://www.ica.se/sok?q={query}"
  color: string                       // Brand-färg
}
```

### StoreProduct-Entity

```typescript
interface StoreProduct {
  id: string
  storeId: string
  externalId?: string                 // ID från butikens system
  name: string                         // "Garant Mjölk 3%"
  brand?: string                      // "Garant" (eget märke)
  category?: string                   // "Mejeri > Mjölk"
  price: number                       // Aktuellt pris i SEK
  originalPrice?: number             // Ursprungligt pris (vid rabatt)
  unit: string                        // "1 liter", "500 g"
  pricePerKg: number                  // Jämförelsepris (kr/kg)
  pricePerLiter?: number              // För flytande produkter
  imageUrl?: string
  productUrl?: string
  inStock: boolean                    // Finns i lager
  isAvailable: boolean                // Kan beställas
  lastUpdated: Date
}
```

### Butiksfunktioner

1. **Lägg till butik**
   - Välj kedja (ICA, Willys, etc.)
   - Ange butiksnamn/ adress
   - Valfritt: koordinater för lokala produkter

2. **Synkronisera produkter**
   - Manuell triggers
   - Automatisk uppdatering (cron)
   - Sök i butik för att hitta produkter

3. **Prisspårning**
   - Jämförelsepris (kr/kg, kr/l)
   - Historik över prisändringar
   - Rabattmarkeringar

### Web Scraping

```typescript
interface StoreScraper {
  storeId: string
  search(query: string): Promise<ScrapedProduct[]>
  getProduct(url: string): Promise<ScrapedProduct>
  getCategories(): Promise<string[]>
  lastRun?: Date
  status: 'active' | 'paused' | 'error'
}

interface ScrapedProduct {
  name: string
  brand?: string
  price: number
  unit: string
  pricePerKg: number
  imageUrl?: string
  productUrl: string
  category?: string
}
```

### Scraping-strategier

**ICA:**
- Använd ICA:s API eller webbshop
- Sök: `https://www.ica.se/sok?q={query}`
- Var försiktig med rate limiting

**Willys:**
- Willys webbshop
- Sök: `https://www.willys.se/sok?q={query}`
- Liknande approach

**Generell:**
- Använd Puppeteer/Playwright för JavaScript-renderade sidor
- Cachelagra resultat
- Respektera robots.txt

## API Endpoints

```
GET    /api/stores                        # Alla butiker
GET    /api/stores/:id                    # En butik
POST   /api/stores                        # Lägg till butik
PUT    /api/stores/:id                    # Uppdatera butik
DELETE /api/stores/:id                    # Ta bort butik

GET    /api/stores/:id/products           # Alla produkter från butik
GET    /api/stores/:id/products/search    # Sök produkter
POST   /api/stores/:id/products/sync      # Starta synkronisering

GET    /api/store-chains                  # Alla kedjor
GET    /api/store-chains/:chainId         # En kedja
```

## UI Komponenter

- `StoreSelector.vue` - Välj butik för inköp
- `StoreCard.vue` - Visar butiksinformation
- `StoreProductList.vue` - Lista produkter från butik
- `ProductSearch.vue` - Sök produkt i butik
- `ProductCard.vue` - Visar produkt med pris
- `PriceComparison.vue` - Jämför priser mellan butiker

## Acceptanskriterier

- [ ] Lägga till/ta bort butiker fungerar
- [ ] Söka produkter i butik fungerar
- [ ] Produkter cachas korrekt
- [ ] Priser visas med jämförelsepris
- [ ] Synkronisering kan triggas manuellt
