---
status: idea
priority: high
tags: [core, ui, week-plan]
created: 2026-01-13
---

# Vecksplanering

## Bakgrund

Användaren ska kunna planera vilka recept som ska lagas under veckan och välja antal portioner för varje recept.

## Beskrivning

### WeekPlan-Entity

```typescript
interface WeekPlan {
  id: string
  name: string                      // "Vecka 3, 2026" eller eget namn
  weekNumber: number                 // 1-53
  year: number
  startDate: Date                   // Måndag
  endDate: Date                     // Söndag
  recipes: WeekPlanRecipe[]
  createdAt: Date
  updatedAt: Date
}

interface WeekPlanRecipe {
  id: string
  weekPlanId: string
  recipeId: string
  servings: number                  // Antal portioner (kan avvika från receptets standard)
  dayOfWeek?: number                 // 0=Måndag, 6=Söndag (valfritt)
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  notes?: string                    // "Servera med sallad", "Ta rest till lunch"
}
```

### Vecksvy

**Layout:** Grid med 7 dagar (Måndag-Söndag)

**För varje dag:**
- Dag namn
- Lista på recept för den dagen
- Total tid för dagen
- Lägg till recept-knapp

**Receptkort i veckovyn:**
- Receptnamn
- Antal portioner (justerbart)
- Tid
- Ikon för att ta bort
- Drag-handtag för att flytta

### Funktioner

1. **Skapa veckoplan**
   - Automatiskt baserat på aktuell vecka
   - Eller välj specifik vecka
   - Kopiera från föregående vecka

2. **Lägga till recept**
   - Sök bland alla recept
   - Välj antal portioner
   - Välj dag (eller "ingen specifik dag")
   - Välj måltidstyp

3. **Justera portioner**
   - Slider eller +/- knappar
   - Ingrediensmängder uppdateras automatiskt

4. **Flytta recept**
   - Drag and drop mellan dagar
   - Ändra ordning inom en dag

5. **Ta bort recept**
   - Enkelt klick på X
   - Bekräftelse vid fler än 1 recept

### Översiktsvy

**Header:**
- Veckonummer och datum
- Navigering (föregående/nästa vecka)
- Totalt antal recept denna vecka
- Total tid för alla måltider
- Total portionskostnad (om priser kopplade)

**Actions:**
- "Skapa inköpslista" → Genererar varukorg
- "Kopiera vecka" → Skapa kopia
- "Radera vecka" → Ta bort hela planen

## API Endpoints

```
GET    /api/week-plan                     # Hämta aktuell vecka
GET    /api/week-plan/current             # Alias för ovan
GET    /api/week-plan/week/:year/:week    # Specifik vecka
GET    /api/week-plan/:id                  # En specifik plan
POST   /api/week-plan                      # Skapa ny veckoplan
PUT    /api/week-plan/:id                 # Uppdatera
DELETE /api/week-plan/:id                 # Ta bort

# Recipes in week plan
POST   /api/week-plan/:id/recipes         # Lägg till recept
PUT    /api/week-plan/:id/recipes/:recipeId  # Uppdatera
DELETE /api/week-plan/:id/recipes/:recipeId  # Ta bort
```

## UI Komponenter

- `WeekPlanGrid.vue` - Huvudkomponent med 7-dagars grid
- `WeekPlanHeader.vue` - Navigation och översikt
- `DayColumn.vue` - En dag i gridden
- `DayCard.vue` - Receptet i dagen (kompakt vy)
- `RecipePicker.vue` - Modal/drawer för att välja recept
- `ServingsAdjuster.vue` - Justera portioner
- `WeekSummary.vue` - Sammanfattning av veckan

## Acceptanskriterier

- [ ] Skapa ny veckoplan fungerar
- [ ] Lägga till/ta bort recept fungerar
- [ ] Justera portioner fungerar
- [ ] Navigera mellan veckor fungerar
- [ ] Drag and drop mellan dagar fungerar
- [ ] Kopiera vecka fungerar
- [ ] Generera inköpslista fungerar
