<script setup lang="ts">
import type { Recipe } from '~/types'

const filters = reactive({
  search: '',
  difficulty: [] as string[],
  tags: [] as string[],
  maxTime: undefined as number | undefined
})

const showImport = ref(false)

const { data: recipes, pending } = await useFetch<Recipe[]>('/api/recipes', {
  query: computed(() => ({
    search: filters.search || undefined,
    difficulty: filters.difficulty[0],
    tags: filters.tags[0],
    limit: 50
  }))
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

function toggleTag(t: string) {
  const idx = filters.tags.indexOf(t)
  if (idx === -1) {
    filters.tags.push(t)
  } else {
    filters.tags.splice(idx, 1)
  }
}

function clearFilters() {
  filters.search = ''
  filters.difficulty = []
  filters.tags = []
  filters.maxTime = undefined
}

async function handleRecipeSaved(recipeId: string) {
  // Refresh recipes list
  navigateTo(`/recipes/${recipeId}`)
}
</script>

<template>
  <div class="page-shell space-y-7">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Din samling</p>
        <h1 class="mt-1 text-3xl font-extrabold tracking-tight text-gray-950">Recept</h1>
        <p class="mt-1 text-sm text-gray-500">Hitta nästa favorit till veckans meny.</p>
      </div>
      <div class="flex gap-2">
        <UButton color="primary" @click="showImport = true">
          <UIcon name="i-lucide-download" class="mr-2 h-4 w-4" />
          Importera
        </UButton>
        <UButton variant="outline" to="/recipes/new">
          <UIcon name="i-lucide-plus" class="mr-2 h-4 w-4" />
          Nytt recept
        </UButton>
      </div>
    </div>

    <!-- Search & Filters -->
    <UCard class="surface-card border-0">
      <div class="space-y-4">
        <!-- Search -->
        <UFormField label="Sök">
          <UInput
            v-model="filters.search"
            placeholder="Sök recept..."
            icon="i-lucide-search"
            class="w-full"
          />
        </UFormField>

        <!-- Filters Row -->
        <div class="flex flex-wrap gap-4">
          <!-- Difficulty -->
          <UFormField label="Svårighetsgrad">
            <div class="flex gap-2">
              <UButton
                v-for="d in difficulties"
                :key="d"
                :variant="filters.difficulty.includes(d) ? 'solid' : 'outline'"
                :color="filters.difficulty.includes(d) ? 'primary' : 'gray'"
                size="sm"
                @click="toggleDifficulty(d)"
              >
                {{ d === 'easy' ? 'Lätt' : d === 'medium' ? 'Medel' : 'Svår' }}
              </UButton>
            </div>
          </UFormField>

          <!-- Max Time -->
          <UFormField label="Max tid (min)">
            <UInput
              v-model.number="filters.maxTime"
              type="number"
              placeholder="30"
              class="w-24"
            />
          </UFormField>
        </div>

        <!-- Clear -->
        <div class="flex justify-end">
          <UButton variant="ghost" size="sm" @click="clearFilters">
            Rensa filter
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Results -->
    <div v-if="pending" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <USkeleton v-for="i in 8" :key="i" class="h-80 rounded-lg" />
    </div>

    <div v-else-if="recipes && recipes.length > 0" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <RecipeCard
        v-for="recipe in recipes"
        :key="recipe.id"
        :recipe="recipe"
      />
    </div>

    <UCard v-else class="text-center">
      <div class="py-8">
        <UIcon name="i-lucide-search-x" class="mx-auto h-16 w-16 text-gray-300" />
        <h3 class="mt-4 text-lg font-medium text-gray-900">Inga recept hittades</h3>
        <p class="mt-2 text-sm text-gray-500">
          Försök med andra sökord eller
          <button class="text-emerald-600 hover:underline" @click="showImport = true">
            importera ett recept
          </button>
        </p>
        <div class="mt-4 flex justify-center gap-3">
          <UButton color="primary" @click="showImport = true">
            Importera recept
          </UButton>
          <UButton variant="outline" to="/recipes/new">
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
