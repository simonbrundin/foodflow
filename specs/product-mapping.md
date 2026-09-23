---
status: idea
priority: high
tags: [core, mapping, stores]
created: 2026-01-13
---

# Produktmappning

## Bakgrund

Koppla en ingredienstyp (t.ex. "mjölk") till en specifik produkt i en specifik butik (t.ex. "Willys → Garant Mjölk 3% 1L"). Om ingen mappning finns ska användaren kunna välja en produkt via sökning sorterad på jämförelsepris.

## Beskrivning

### ProductMapping-Entity

```typescript
interface ProductMapping {
  id: string
  ingredientTypeId: string          // "mjölk"
  storeId: string                    // "willys-helsingborg"
  storeProductId: string             // "willys-garant-mjolk-1l"
  isDefault: boolean                 // Standardval för denna kombination
  priority: number                   // Högre = visas först
  notes?: string                    // "Använd alltid denna variant"
  createdAt: Date
  updatedAt: Date
  createdBy?: string                // Användar-ID (för delade mappningar)
}
```

### Mappningslogik

**Flow när varukorg genereras:**

```
1. För varje ingrediens i veckoplanen:
   2. Kolla om det finns en mappning för (ingredientType, selectedStore):
      - Ja → Använd den mappade produkten
      - Nej → Visa produktväljare
3. Returnera lista med items + ev. unmapped ingredients
```

**Produktväljare (när ingen mappning finns):**

```
1. Visa sökfält för "{ingredientType.name}"
2. Sök i vald butik via butikens API/scraping
3. Sortera resultat efter pricePerKg (lägst först)
4. Visa:
   - Produktnamn
   - Märke
   - Pris + enhet
   - Jämförelsepris (kr/kg)
   - Bild (om tillgänglig)
5. Användaren väljer produkt
6. Spara mappning (isDefault: true)
7. Fortsätt till nästa ingrediens
```

### Funktionalitet

1. **Automatisk mappning**
   - Systemet försöker hitta matchande produkt baserat på:
     - Ingredienstypens namn
     - Kategori
     - Tidigare användning
   - Högst rankade resultat föreslås

2. **Manuell mappning**
   - Sök och välj produkt
   - Sätt som standard (isDefault)
   - Kan ha flera mappningar för samma ingrediens/butik (olika varianter)

3. **Bulk-mappning**
   - Importera mappningar från fil (CSV/JSON)
   - Förslag baserat på liknande användare

4. **Mappningshantering**
   - Lista alla mappningar
   - Redigera/ta bort mappningar
   - Exportera mappningar

### Mappningsförslag

```typescript
interface MappingSuggestion {
  ingredientType: IngredientType
  store: Store
  suggestions: {
    product: StoreProduct
    confidence: number               // 0-1, hur trolig matchningen är
    reason: string                   // "Namn-match", "Kategori-match", "Tidigare val"
  }[]
}
```

### Algoritm för matchning

```typescript
// Pseudo-kod för att hitta förslag
function findProductSuggestions(ingredientType, store) {
  // 1. Exakt namnmatch
  exactMatch = searchProducts(ingredientType.name, store)
  
  // 2. Alias-match
  aliasMatches = ingredientType.aliases.flatMap(alias => 
    searchProducts(alias, store)
  )
  
  // 3. Kategori-match
  categoryMatches = searchProducts(ingredientType.category, store)
  
  // 4. Kombinerar och rangordnar
  return combineAndRank([exactMatch, aliasMatches, categoryMatches])
    .sortBy(pricePerKg)
}
```

## API Endpoints

```
GET    /api/mappings                           # Alla mappningar
GET    /api/mappings/ingredient/:typeId         # Mappningar för en ingredienstyp
GET    /api/mappings/store/:storeId             # Mappningar för en butik
GET    /api/mappings/suggest/:ingredientTypeId  # Få förslag för mappning

POST   /api/mappings                            # Skapa mappning
PUT    /api/mappings/:id                        # Uppdatera mappning
DELETE /api/mappings/:id                        # Ta bort mappning

POST   /api/mappings/bulk                       # Bulk-importera mappningar
GET    /api/mappings/export                     # Exportera mappningar
```

## UI Komponenter

- `ProductMapper.vue` - Huvudkomponent för att mappa produkter
- `MappingList.vue` - Lista alla mappningar
- `MappingRow.vue` - En mappning rad
- `ProductSelector.vue` - Sök och välj produkt
- `ProductSuggestion.vue` - Ett produktförslag
- `UnmappedIngredients.vue` - Lista ingredienser utan mappning
- `MappingImport.vue` - Importera mappningar

## Acceptanskriterier

- [ ] Mappning sparas korrekt
- [ ] Mappning används vid varukorgsgenerering
- [ ] Sökning visar produkter sorterade på prisPerKg
- [ ] Förslag genereras automatiskt
- [ ] Bulk-import/exporter fungerar
- [ ] Mappningar kan redigeras/tas bort
