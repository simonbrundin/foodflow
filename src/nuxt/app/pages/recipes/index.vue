<script setup lang="ts">
import type { Recipe } from '~/types'

const { value: search, debouncedValue: debouncedSearch } = useDebouncedRef('', 300)

const filters = reactive({
  difficulty: [] as string[],
  tags: [] as string[],
  maxTime: undefined as number | undefined
})

const showImport = ref(false)

const hasActiveFilters = computed(() => Boolean(
  search.value
  || filters.difficulty.length
  || filters.tags.length
  || filters.maxTime
))

const activeFilterCount = computed(() => (
  Number(Boolean(search.value))
  + filters.difficulty.length
  + filters.tags.length
  + Number(Boolean(filters.maxTime))
))

const queryParams = computed(() => {
  const params: Record<string, string | number> = { limit: 50 }
  const search = debouncedSearch.value
  const difficulty = filters.difficulty[0]
  const tag = filters.tags[0]
  const maxTime = filters.maxTime

  if (search) params.search = search
  if (difficulty) params.difficulty = difficulty
  if (tag) params.tags = tag
  if (maxTime) params.maxTime = maxTime

  return params
})

const { data: recipes, pending } = await useFetch<Recipe[]>('/api/recipes', {
  query: queryParams
})

const difficulties = ['easy', 'medium', 'hard'] as const

function toggleDifficulty(d: string) {
  const idx = filters.difficulty.indexOf(d)
  if (idx === -1) {
    filters.difficulty.push(d)
  } else {
    filters.difficulty.splice(idx, 1)
  }
}

function clearFilters() {
  search.value = ''
  filters.difficulty = []
  filters.tags = []
  filters.maxTime = undefined
}

async function handleRecipeSaved(recipeId: string) {
  navigateTo(`/recipes/${recipeId}`)
}
</script>

<template>
  <div class="page-shell space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
          Din samling
        </p>
        <h1 class="mt-1 text-3xl font-extrabold tracking-tight text-gray-950">
          Recept
        </h1>
        <p class="mt-1 text-sm text-gray-500">
          Hitta nästa favorit till veckans meny.
        </p>
      </div>
      <div class="flex gap-2">
        <UButton
          color="primary"
          @click="showImport = true"
        >
          <UIcon
            name="i-lucide-download"
            class="mr-2 h-4 w-4"
          />
          Importera
        </UButton>
        <UButton
          variant="outline"
          to="/recipes/new"
        >
          <UIcon
            name="i-lucide-plus"
            class="mr-2 h-4 w-4"
          />
          Nytt recept
        </UButton>
      </div>
    </div>

    <!-- Search & Filters -->
    <section class="relative overflow-hidden rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-emerald-950/70 via-[#10201c] to-[#16231d] p-4 shadow-[0_24px_60px_-34px_rgba(16,185,129,0.45)] sm:p-5">
      <div class="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-emerald-300/10 bg-emerald-300/5 blur-[1px]" />
      <div class="pointer-events-none absolute -bottom-32 left-1/3 h-56 w-56 rounded-full bg-amber-300/5 blur-3xl" />

      <div class="relative">
        <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,1.1fr)] lg:items-center">
          <div>
            <div class="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-200">
              <UIcon
                name="i-lucide-sparkles"
                class="h-3.5 w-3.5"
              />
              Receptbibliotek
            </div>
            <h2 class="mt-3 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
              Vad är du sugen på?
            </h2>
            <p class="mt-1 max-w-xl text-sm leading-relaxed text-slate-300">
              Sök efter en rätt eller finjustera urvalet med filtren nedan.
            </p>
          </div>

          <!-- Filters -->
          <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-end">
            <!-- Difficulty -->
            <div>
              <p class="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Svårighetsgrad
              </p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="d in difficulties"
                  :key="d"
                  type="button"
                  :aria-pressed="filters.difficulty.includes(d)"
                  class="inline-flex h-9 items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold transition"
                  :class="filters.difficulty.includes(d)
                    ? 'border-emerald-300/40 bg-emerald-300/15 text-emerald-100 shadow-[0_0_18px_-8px_rgba(110,231,183,0.8)]'
                    : 'border-slate-700/80 bg-slate-950/25 text-slate-300 hover:border-emerald-300/30 hover:bg-emerald-300/10 hover:text-emerald-100'"
                  @click="toggleDifficulty(d)"
                >
                  <span
                    class="h-2 w-2 rounded-full"
                    :class="d === 'easy' ? 'bg-emerald-300' : d === 'medium' ? 'bg-amber-300' : 'bg-rose-300'"
                  />
                  {{ d === 'easy' ? 'Lätt' : d === 'medium' ? 'Medel' : 'Svår' }}
                </button>
              </div>
            </div>

            <!-- Max Time -->
            <div>
              <label
                for="max-time"
                class="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400"
              >Max tid</label>
              <div class="relative w-full sm:w-32">
                <input
                  id="max-time"
                  v-model.number="filters.maxTime"
                  type="number"
                  min="1"
                  placeholder="30"
                  class="h-9 w-full rounded-xl border border-slate-700/80 bg-slate-950/25 px-3.5 pr-14 text-sm text-white outline-none transition placeholder:text-slate-500 hover:border-emerald-300/30 focus:border-emerald-300/60 focus:ring-4 focus:ring-emerald-300/10"
                >
                <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">min</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Search -->
        <div class="mt-4 border-t border-white/10 pt-4">
          <div class="mb-2 flex items-center justify-between gap-3">
            <label
              for="recipe-search"
              class="block text-xs font-bold uppercase tracking-[0.16em] text-emerald-100/75"
            >Sök i dina recept</label>
            <div class="flex items-center gap-3">
              <div
                v-if="hasActiveFilters"
                class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-300/15 bg-slate-950/25 px-2.5 py-1 text-[11px] font-semibold text-emerald-200"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.8)]" />
                {{ activeFilterCount }} aktiva
              </div>
              <button
                v-if="hasActiveFilters"
                type="button"
                class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 transition hover:text-emerald-200"
                @click="clearFilters"
              >
                <UIcon
                  name="i-lucide-rotate-ccw"
                  class="h-3.5 w-3.5"
                />
                Rensa
              </button>
            </div>
          </div>
          <div class="relative">
            <UIcon
              name="i-lucide-search"
              class="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-emerald-300"
            />
            <input
              id="recipe-search"
              v-model="search"
              type="search"
              placeholder="T.ex. pasta, lax eller vegetariskt"
              class="h-12 w-full appearance-none rounded-2xl border border-emerald-200/15 bg-slate-950/35 pl-12 pr-12 text-base text-white outline-none transition placeholder:text-slate-500 hover:border-emerald-200/30 focus:border-emerald-300/60 focus:ring-4 focus:ring-emerald-300/10"
            >
            <button
              v-if="search"
              type="button"
              aria-label="Rensa sökning"
              class="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white"
              @click="search = ''"
            >
              <UIcon
                name="i-lucide-x"
                class="h-4 w-4"
              />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Results -->
    <div class="flex items-center justify-between px-1">
      <p class="text-sm font-semibold text-slate-300">
        <span v-if="pending">Letar recept...</span>
        <span v-else>{{ recipes?.length ?? 0 }} recept</span>
      </p>
      <span
        v-if="!pending && recipes?.length"
        class="text-xs text-slate-500"
      >Uppdateras automatiskt</span>
    </div>

    <div
      v-if="pending && !recipes"
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <USkeleton
        v-for="i in 8"
        :key="i"
        class="h-80 rounded-lg"
      />
    </div>

    <div
      v-else-if="recipes && recipes.length > 0"
      class="relative"
    >
      <div
        class="grid gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        :class="pending ? 'opacity-60' : 'opacity-100'"
      >
        <RecipeCard
          v-for="recipe in recipes"
          :key="recipe.id"
          :recipe="recipe"
        />
      </div>
      <div
        v-if="pending"
        class="pointer-events-none absolute inset-0 flex items-start justify-center pt-16"
      >
        <div class="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-[#10201c]/90 px-4 py-2 text-sm font-semibold text-emerald-100 shadow-lg backdrop-blur-sm">
          <UIcon
            name="i-lucide-loader-circle"
            class="h-4 w-4 animate-spin"
          />
          Söker...
        </div>
      </div>
    </div>

    <UCard
      v-else
      class="text-center"
    >
      <div class="py-8">
        <UIcon
          name="i-lucide-search-x"
          class="mx-auto h-16 w-16 text-gray-300"
        />
        <h3 class="mt-4 text-lg font-medium text-gray-900">
          Inga recept hittades
        </h3>
        <p class="mt-2 text-sm text-gray-500">
          Försök med andra sökord eller
          <button
            class="text-emerald-600 hover:underline"
            @click="showImport = true"
          >
            importera ett recept
          </button>
        </p>
        <div class="mt-4 flex justify-center gap-3">
          <UButton
            color="primary"
            @click="showImport = true"
          >
            Importera recept
          </UButton>
          <UButton
            variant="outline"
            to="/recipes/new"
          >
            Skapa nytt
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Import Modal -->
    <RecipeImport
      :open="showImport"
      @close="showImport = false"
      @saved="handleRecipeSaved"
    />
  </div>
</template>
