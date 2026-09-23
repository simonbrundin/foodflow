---
status: idea
priority: high
tags: [core, cart, checkout]
created: 2026-01-13
---

# Varukorg

## Bakgrund

När användaren har valt sina recept för veckan ska alla ingredienser samlas i en varukorg, kopplade till produkter från vald butik.

## Beskrivning

### ShoppingCart-Entity

```typescript
interface ShoppingCart {
  id: string
  weekPlanId?: string                // Kopplad veckoplan
  storeId: string                     // Vald butik
  storeName?: string                  // Cachelagrat
  items: ShoppingCartItem[]
  status: 'draft' | 'ready' | 'completed'
  totalPrice: number                  // Beräknad total
  createdAt: Date
  updatedAt: Date
}

interface ShoppingCartItem {
  id: string
  cartId: string
  ingredientTypeId: string
  ingredientTypeName: string          // Cachelagrat för visning
  storeProductId: string
  storeProductName: string            // Cachelagrat
  brand?: string                      // Cachelagrat
  quantity: number                    // Antal att köpa
  unit: string                        // "1L", "500g"
  pricePerUnit: number                // Pris per enhet
  totalPrice: number                  // quantity * pricePerUnit
  isResolved: boolean                 // Har produkt valts?
  isOptional: boolean                 // Från optional ingrediens
  notes?: string                      // "finhackad"
}
```

### Varukorgsgenerering

**Flow:**

```
1. Användaren klickar "Skapa inköpslista"
2. Välj butik (om inte redan valt)
3. För varje recept i veckoplanen:
   a. För varje ingrediens:
      - Kolla om det finns ProductMapping (ingredientType, store)
      - Ja: Använd den mappade produkten
      - Nej: Lägg till i "unmapped" lista
4. Om det finns unmapped:
   - Visa produktväljare för var och en
   - Användaren väljer produkt
   - Spara mappning för framtiden
5. Aggregera likadana produkter (slå ihop mängder)
6. Visa färdig varukorg
```

### Aggregera produkter

```typescript
// Exempel: Två recept kräver "tomat"
// Recept A: 4 stora tomater
// Recept B: 200g körsbärstomater
// → Aggregera till "tomat" (olika sorter slås inte ihop automatiskt)

// Men om samma produkt:
// Recept A: 500g tomater
// Recept B: 300g tomater
// → 800g totalt
```

### Varukorgsvisning

**Header:**
- Butiksnamn + logo
- Antal items
- Totalpris
- "Fortsätt handla" / "Redigera"

**Items lista:**
- Grupperade efter kategori
- Varje item visar:
  - Produktnamn
  - Märke
  -Kvantitet (justerbar)
  - Enhet
  - Pris
- Checkbox för att stryka/köpa

**Footer/Sammanfattning:**
- Subtotal
- Antal unika produkter
- "Kopiera till Google Keep / Notion"
- "Skicka till telefon"

### Actions

1. **Lägg till/ta bort items**
   - Manuellt
   - Eller genom att ändra veckoplan

2. **Justera kvantitet**
   - +/-
   - Eller direkt input

3. **Byt produkt**
   - Klicka på produkt → Sök ny

4. **Markera som köpt**
   - Checkbox
   - Eller "Swipe to complete"

5. **Exportera**
   - Text-lista
   - Delbar länk
   - Google Keep format
   - Apple Reminders

## API Endpoints

```
GET    /api/cart                                 # Hämta aktuell varukorg
GET    /api/cart/:id                             # Hämta specifik varukorg
POST   /api/cart                                 # Skapa varukorg
PUT    /api/cart/:id                             # Uppdatera varukorg

POST   /api/cart/generate                        # Generera från veckoplan
POST   /api/cart/generate/:weekPlanId            # Explicit veckoplan-ID

PUT    /api/cart/:id/items/:itemId                # Uppdatera item
DELETE /api/cart/:id/items/:itemId                # Ta bort item
POST   /api/cart/:id/items                        # Lägg till item manuellt

POST   /api/cart/:id/aggregate                    # Aggregera dubbletter
DELETE /api/cart/:id                             # Töm varukorg

GET    /api/cart/:id/export                      # Exportera (format som query)
POST   /api/cart/:id/complete                    # Markera som färdig
```

## UI Komponenter

- `ShoppingCart.vue` - Huvudkomponent
- `CartHeader.vue` - Header med butik & pris
- `CartItem.vue` - Ett item i listan
- `CartItemGroup.vue` - Grupperade items
- `CartSummary.vue` - Sammanfattning längst ner
- `CartEmpty.vue` - Tom varukorg
- `CartActions.vue` - Actions (export, etc.)
- `ProductQuickSwap.vue` - Snabbbyte av produkt

## Acceptanskriterier

- [ ] Varukorg genereras från veckoplan
- [ ] Items kan justeras
- [ ] Totalpris beräknas korrekt
- [ ] Export-funktioner fungerar
- [ ] Produktbyte fungerar
- [ ] Dubbletter aggregers korrekt
