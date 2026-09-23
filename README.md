# Foodflow

> Planera veckans middagar och skapa smarta inköpslistor

## Concept

Foodflow är en meal kit-applikation inspirerad av Hello Fresh. Planera vilka recept du vill laga under veckan, och låt appen skapa en inköpslista baserat på ingredienserna – kopplad till produkter i din favoritbutik.

## Features

- 📅 **Vecksplanering** - Välj recept för veckan med portionsjustering
- 📚 **Receptdatabas** - Sök och filtrera bland alla dina recept
- 🛒 **Smart inköpslista** - Ingredienser kopplas till produkter i butiken
- 🏪 **Flera butiker** - Stöd för ICA, Willys, Coop och fler
- 🔗 **Produktmappning** - Koppla ingredienser till specifika produkter
- 📥 **Receptimport** - Importera recept från externa källor

## Tech Stack

- **Framework**: [Nuxt 4](https://nuxt.com)
- **UI**: [Nuxt UI](https://ui.nuxt.com) + Tailwind CSS
- **Database**: PostgreSQL
- **Icons**: Lucide
- **State**: Pinia

## Getting Started

### 1. Konfigurera OpenAI (valfritt)

För AI-parsning av recept behöver du en OpenAI API-nyckel:

```bash
# Skapa .env-fil
cat > .env << EOF
OPENAI_API_KEY=sk-your-api-key-here
EOF
```

> Få en API-nyckel på https://platform.openai.com/api-keys

### 2. Starta PostgreSQL

```bash
# Starta PostgreSQL med Docker
docker compose up -d

# Verifiera att det körs
docker compose ps
```

### 2. Installera dependencies

```bash
cd src/nuxt
pnpm install
```

### 3. Starta utvecklingsserver

```bash
pnpm dev
```

Appen körs på http://localhost:3000

### 4. Miljövariabler (valfritt)

Skapa en `.env`-fil:

```env
PGHOST=localhost
PGPORT=5432
PGDATABASE=foodflow
PGUSER=postgres
PGPASSWORD=postgres
```

Standardvärden ansluter till Docker Compose PostgreSQL.

## Miljövariabler

| Variabel | Default | Beskrivning |
|----------|---------|-------------|
| `PGHOST` | `localhost` | PostgreSQL host |
| `PGPORT` | `5432` | PostgreSQL port |
| `PGDATABASE` | `foodflow` | Databasnamn |
| `PGUSER` | `postgres` | Användarnamn |
| `PGPASSWORD` | `postgres` | Lösenord |

## Database Schema

```
┌─────────────────────┐
│  ingredient_types   │  - Grundtyper: mjölk, tomat, ägg etc.
├─────────────────────┤
│  recipes            │  - Recept med ingredienser
├─────────────────────┤
│  stores             │  - ICA, Willys, Coop etc.
├─────────────────────┤
│  store_products     │  - Produkter i varje butik
├─────────────────────┤
│  product_mappings   │  - Koppling: ingrediens → produkt
├─────────────────────┤
│  week_plans         │  - Veckoplaner
├─────────────────────┤
│  week_plan_recipes  │  - Recept i veckoplan
├─────────────────────┤
│  shopping_carts     │  - Varukorgar
├─────────────────────┤
│  shopping_cart_items│  - Items i varukorgen
└─────────────────────┘
```

## API Routes

### Recipes
- `GET /api/recipes` - Lista alla recept (med filtrering)
- `GET /api/recipes/:id` - Hämta ett recept
- `POST /api/recipes` - Skapa recept

### Week Plan
- `GET /api/week-plan/current` - Hämta aktuell vecka
- `POST /api/week-plan/recipes` - Lägg till recept

### Cart
- `GET /api/cart` - Hämta aktuell varukorg
- `POST /api/cart/generate` - Generera från veckoplan

## Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm typecheck    # Run TypeScript checks
pnpm lint         # Run ESLint
pnpm test         # Run tests
```

## License

MIT
