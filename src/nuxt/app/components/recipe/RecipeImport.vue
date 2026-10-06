<script setup lang="ts">
import type { ParsedIngredient, ParsedRecipe, IngredientType } from '~/types'
import { getErrorMessage } from '~/utils/errors'

interface Props {
  open: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  saved: [recipeId: string]
}>()

const activeTab = ref<'url' | 'paste'>('url')
const pasteText = ref('')
const url = ref('')
const isLoading = ref(false)
const isSaving = ref(false)
const error = ref('')

interface ImportedIngredient extends ParsedIngredient {
  notes?: string
}

interface ImportedRecipe extends Omit<ParsedRecipe, 'ingredients'> {
  ingredients: ImportedIngredient[]
}

interface ImportResult {
  recipe: ImportedRecipe
  matches: {
    total: number
    matched: number
    highConfidence: number
    matchRate: number
  }
  ingredientMatches?: { ingredientTypeId: string, confidence: number }[]
}

interface IngredientMappingPayload {
  ingredientTypeId?: string
  rawName?: string
}

// Import result
const importResult = ref<ImportResult | null>(null)

// Ingredient types from API
const { data: ingredientTypes } = useFetch<IngredientType[]>('/api/ingredient-types', {
  default: () => [] as IngredientType[]
})

// Helper to ensure we always have an array
const safeIngredientTypes = computed(() => ingredientTypes.value ?? [])
const ingredientTypeOptions = computed(() => safeIngredientTypes.value.map((type: IngredientType) => ({
  label: type.name,
  value: type.id
})))

// Manual mappings (user overrides)
const manualMappings = ref<Record<string, { ingredientTypeId: string, name: string, confidence: number }>>({})

// Editing fields
const editedRecipe = ref<Partial<ImportedRecipe>>({})

// Watch for prop changes
watch(() => props.open, (isOpen) => {
  if (!isOpen) {
    reset()
  }
})

// Example recipe for user guidance
const exampleRecipe = `Pasta Carbonara

En klassisk italiensk pastarätt som är enkel att göra men otroligt god!

400g spaghetti
200g bacon
4 ägg
100g parmesanost
Salt och peppar

Koka pastan enligt paketets anvisningar.
Stek baconen i en torr panna tills den är krispig.
Vispa äggen med den rivna osten.
Häll av pastan och blanda direkt med äggblandningen.
Tillsätt baconet och krydda med salt och peppar.
Servera genast medan pastan är varm.`

async function importFromURL() {
  if (!url.value) {
    error.value = 'Ange en URL'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    const result = await $fetch<ImportResult>('/api/recipes/import', {
      method: 'POST',
      body: { url: url.value }
    })

    importResult.value = result
    editedRecipe.value = { ...result.recipe }
    initMappings(result.recipe)
  } catch (caughtError: unknown) {
    error.value = getErrorMessage(caughtError, 'Import misslyckades')
  } finally {
    isLoading.value = false
  }
}

async function quickImport() {
  if (!url.value) {
    error.value = 'Ange en URL'
    return
  }

  isLoading.value = true
  error.value = ''
  isSaving.value = true

  try {
    const result = await $fetch('/api/recipes/quick-import', {
      method: 'POST',
      body: { url: url.value }
    })

    emit('saved', result.id)
    emit('close')
    reset()
  } catch (caughtError: unknown) {
    error.value = getErrorMessage(caughtError, 'Snabbimport misslyckades. Försök med "Importera & förhandsvisa" istället.')
  } finally {
    isLoading.value = false
    isSaving.value = false
  }
}

async function importFromPaste() {
  if (!pasteText.value.trim()) {
    error.value = 'Klistra in ett recept först'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    const result = await $fetch<ImportResult>('/api/recipes/parse-ai', {
      method: 'POST',
      body: { text: pasteText.value }
    })

    importResult.value = result
    editedRecipe.value = { ...result.recipe }
    initMappings(result.recipe, result.ingredientMatches)
  } catch (caughtError: unknown) {
    error.value = getErrorMessage(caughtError, 'AI-parsing misslyckades')
  } finally {
    isLoading.value = false
  }
}

function initMappings(recipe: ImportedRecipe, aiMatches?: { ingredientTypeId: string, confidence: number }[]) {
  manualMappings.value = {}

  for (let i = 0; i < recipe.ingredients.length; i++) {
    const ing = recipe.ingredients[i]
    if (!ing) continue

    const rawText = ing.rawText || `${ing.amount} ${ing.unit} ${ing.name}`

    // Try to find match from AI or ingredient type
    let mappedId = ''
    let confidence = 0

    // Check AI matches first
    const aiMatch = aiMatches?.[i]
    if (aiMatch) {
      mappedId = aiMatch.ingredientTypeId
      confidence = aiMatch.confidence
    }

    // Then try string matching
    if (!mappedId || confidence < 0.5) {
      const nameLower = (ing.name || '').toLowerCase()
      const found = safeIngredientTypes.value.find(it =>
        nameLower.includes(it.name.toLowerCase())
        || it.name.toLowerCase().includes(nameLower)
      )
      if (found) {
        mappedId = found.id
        confidence = 0.8
      }
    }

    if (mappedId) {
      const it = safeIngredientTypes.value.find(t => t.id === mappedId)
      manualMappings.value[rawText] = {
        ingredientTypeId: mappedId,
        name: it?.name || mappedId,
        confidence
      }
    }
  }
}

async function saveRecipe() {
  if (!importResult.value) return

  isSaving.value = true

  try {
    // Build ingredient mappings
    const ingredientMappings: Record<string, IngredientMappingPayload> = {}

    for (const [rawText, mapping] of Object.entries(manualMappings.value)) {
      if (mapping.ingredientTypeId) {
        // Check if it's a real ID or a raw name
        const isRealId = safeIngredientTypes.value.some(it => it.id === mapping.ingredientTypeId)
        ingredientMappings[rawText] = {
          ingredientTypeId: isRealId ? mapping.ingredientTypeId : undefined,
          rawName: isRealId ? undefined : mapping.ingredientTypeId
        }
      }
    }

    const result = await $fetch('/api/recipes/save-import', {
      method: 'POST',
      body: {
        recipe: editedRecipe.value,
        ingredientMappings,
        // Include raw ingredients for non-matched
        rawIngredients: importResult.value.recipe.ingredients.map(ing => ({
          amount: ing.amount,
          unit: ing.unit || 'st',
          name: ing.name || ing.rawText
        }))
      }
    })

    emit('saved', result.id)
    emit('close')
    reset()
  } catch (caughtError: unknown) {
    error.value = getErrorMessage(caughtError, 'Sparning misslyckades')
  } finally {
    isSaving.value = false
  }
}

function reset() {
  activeTab.value = 'url'
  pasteText.value = ''
  url.value = ''
  error.value = ''
  importResult.value = null
  manualMappings.value = {}
  editedRecipe.value = {}
}

function close() {
  emit('close')
  reset()
}

async function importFromClipboard() {
  try {
    const text = await navigator.clipboard.readText()
    if (!text) {
      error.value = 'Urklippet är tomt'
      return
    }

    // Check if it looks like a URL
    const urlPattern = /^https?:\/\//i
    if (urlPattern.test(text.trim())) {
      url.value = text.trim()
      activeTab.value = 'url'
      // Use quick import for URLs from clipboard
      await quickImport()
    } else {
      // Treat as pasted text
      pasteText.value = text
      activeTab.value = 'paste'
      await importFromPaste()
    }
  } catch {
    error.value = 'Kunde inte läsa urklipp - ge sidan behörighet att komma åt urklipp'
  }
}

function handleManualMappingChange(index: number, ingredientTypeId: string) {
  const selectedType = safeIngredientTypes.value.find(type => type.id === ingredientTypeId)
  const mappingKey = `ing_${index}`

  if (!selectedType) {
    const { [mappingKey]: _removedMapping, ...remainingMappings } = manualMappings.value
    manualMappings.value = remainingMappings
    return
  }

  manualMappings.value[mappingKey] = {
    ingredientTypeId: selectedType.id,
    name: selectedType.name,
    confidence: 1
  }
}

function loadExample() {
  pasteText.value = exampleRecipe
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      @click.self="close"
    >
      <div
        class="flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900 text-slate-100 shadow-2xl shadow-black/50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recipe-import-title"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-700/80 bg-slate-900 px-5 py-4 sm:px-7">
          <div class="flex items-center gap-3">
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/30">
              <UIcon
                name="i-lucide-book-open-check"
                class="h-5 w-5"
              />
            </div>
            <div>
              <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                Receptimport
              </p>
              <h2
                id="recipe-import-title"
                class="text-xl font-bold tracking-tight text-white"
              >
                Importera recept
              </h2>
              <p class="hidden text-sm text-slate-400 sm:block">
                Lägg till ett recept från en länk, text eller urklipp.
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Stäng importdialogen"
            class="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
            @click="close"
          >
            <UIcon
              name="i-lucide-x"
              class="h-5 w-5"
            />
          </button>
        </div>

        <!-- Content -->
        <div class="app-scrollbar flex-1 overflow-y-auto bg-slate-900 p-5 sm:p-7">
          <!-- Import source picker -->
          <div class="mb-6">
            <div class="mb-3 flex items-end justify-between gap-4">
              <div>
                <p class="text-sm font-semibold text-white">
                  Välj importkälla
                </p>
                <p class="mt-1 text-sm text-slate-400">
                  URL är oftast snabbast och ger bäst resultat.
                </p>
              </div>
              <span class="hidden items-center gap-1.5 text-xs font-medium text-emerald-300 sm:flex">
                <UIcon
                  name="i-lucide-shield-check"
                  class="h-4 w-4"
                />
                Säker import
              </span>
            </div>

            <div class="grid grid-cols-3 gap-2 sm:gap-3">
              <button
                type="button"
                class="group rounded-2xl border p-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 sm:p-4"
                :class="activeTab === 'url'
                  ? 'border-emerald-400 bg-emerald-400/15 shadow-lg shadow-emerald-950/20'
                  : 'border-slate-700 bg-slate-800/60 hover:border-slate-500 hover:bg-slate-800'"
                @click="activeTab = 'url'"
              >
                <span class="flex items-start gap-2 sm:gap-3">
                  <span
                    class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9"
                    :class="activeTab === 'url' ? 'bg-emerald-400 text-slate-950' : 'bg-slate-700 text-slate-200 group-hover:bg-slate-600'"
                  >
                    <UIcon
                      name="i-lucide-link"
                      class="h-4 w-4 sm:h-5 sm:w-5"
                    />
                  </span>
                  <span class="min-w-0">
                    <span class="block text-xs font-semibold text-white sm:text-sm">Från URL</span>
                    <span class="mt-1 hidden text-xs leading-relaxed text-slate-400 sm:block">Hämta recept från en webbsida</span>
                    <span
                      v-if="activeTab === 'url'"
                      class="mt-2 hidden items-center gap-1 text-xs font-semibold text-emerald-300 sm:inline-flex"
                    >
                      <UIcon
                        name="i-lucide-check"
                        class="h-3.5 w-3.5"
                      />
                      Vald källa
                    </span>
                  </span>
                </span>
              </button>

              <button
                type="button"
                class="group rounded-2xl border p-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 sm:p-4"
                :class="activeTab === 'paste'
                  ? 'border-emerald-400 bg-emerald-400/15 shadow-lg shadow-emerald-950/20'
                  : 'border-slate-700 bg-slate-800/60 hover:border-slate-500 hover:bg-slate-800'"
                @click="activeTab = 'paste'"
              >
                <span class="flex items-start gap-2 sm:gap-3">
                  <span
                    class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9"
                    :class="activeTab === 'paste' ? 'bg-emerald-400 text-slate-950' : 'bg-slate-700 text-slate-200 group-hover:bg-slate-600'"
                  >
                    <UIcon
                      name="i-lucide-clipboard"
                      class="h-4 w-4 sm:h-5 sm:w-5"
                    />
                  </span>
                  <span class="min-w-0">
                    <span class="block text-xs font-semibold text-white sm:text-sm">Klistra in text</span>
                    <span class="mt-1 hidden text-xs leading-relaxed text-slate-400 sm:block">Klistra in receptet och låt AI tolka det</span>
                    <span
                      v-if="activeTab === 'paste'"
                      class="mt-2 hidden items-center gap-1 text-xs font-semibold text-emerald-300 sm:inline-flex"
                    >
                      <UIcon
                        name="i-lucide-check"
                        class="h-3.5 w-3.5"
                      />
                      Vald källa
                    </span>
                  </span>
                </span>
              </button>

              <button
                type="button"
                class="group rounded-2xl border border-slate-700 bg-slate-800/60 p-3 text-left transition-all hover:border-amber-400/70 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60 sm:p-4"
                :disabled="isLoading"
                @click="importFromClipboard"
              >
                <span class="flex items-start gap-2 sm:gap-3">
                  <span class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300 group-hover:bg-amber-400/25 sm:h-9 sm:w-9">
                    <UIcon
                      name="i-lucide-clipboard-paste"
                      class="h-4 w-4 sm:h-5 sm:w-5"
                    />
                  </span>
                  <span class="min-w-0">
                    <span class="block text-xs font-semibold text-white sm:text-sm">Från urklipp</span>
                    <span class="mt-1 hidden text-xs leading-relaxed text-slate-400 sm:block">Läs en länk eller recepttext direkt</span>
                    <span class="mt-2 hidden items-center gap-1 text-xs font-semibold text-amber-300 sm:inline-flex">
                      <UIcon
                        name="i-lucide-zap"
                        class="h-3.5 w-3.5"
                      />
                      Direktimport
                    </span>
                  </span>
                </span>
              </button>
            </div>
          </div>

          <!-- Error -->
          <div
            v-if="error"
            role="alert"
            class="mb-5 flex items-start gap-3 rounded-2xl border border-red-400/40 bg-red-950/40 p-4 text-red-100"
          >
            <UIcon
              name="i-lucide-circle-alert"
              class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-300"
            />
            <p class="text-sm leading-relaxed">
              {{ error }}
            </p>
          </div>

          <!-- Paste Tab -->
          <div
            v-if="activeTab === 'paste'"
            class="rounded-2xl border border-slate-700 bg-slate-800/40 p-5 sm:p-6"
          >
            <div class="mb-4 flex items-start justify-between gap-4">
              <div>
                <label class="block text-base font-semibold text-white">Recept-text</label>
                <p class="mt-1 text-sm text-slate-400">
                  AI extraherar titel, ingredienser, instruktioner och tider.
                </p>
              </div>
              <UButton
                size="xs"
                variant="outline"
                color="neutral"
                class="flex-shrink-0 !border-slate-600 !text-slate-200 hover:!bg-slate-700"
                @click="loadExample"
              >
                <UIcon
                  name="i-lucide-flask"
                  class="mr-1 h-3 w-3"
                />
                Ladda exempel
              </UButton>
            </div>
            <UTextarea
              v-model="pasteText"
              :disabled="isLoading"
              placeholder="Klistra in ditt recept här...

Exempel:
Pasta Carbonara

400g spaghetti
200g bacon
4 ägg
100g parmesan

1. Koka pastan
2. Stek bacon
3. Blanda allt"
              rows="10"
              class="w-full"
              :ui="{
                base: 'min-h-56 resize-y bg-slate-950/70 text-slate-100 placeholder:text-slate-500 ring-1 ring-slate-700 focus:ring-2 focus:ring-emerald-400'
              }"
            />
            <UButton
              color="primary"
              size="lg"
              block
              class="mt-5 !bg-emerald-400 !text-slate-950 shadow-lg shadow-emerald-950/30 hover:!bg-emerald-300 disabled:!bg-slate-700 disabled:!text-slate-500 disabled:!shadow-none"
              :loading="isLoading"
              :disabled="!pasteText.trim()"
              @click="importFromPaste"
            >
              <UIcon
                name="i-lucide-sparkles"
                class="mr-2 h-5 w-5"
              />
              Importera med AI
            </UButton>
          </div>

          <!-- URL Tab -->
          <div
            v-if="activeTab === 'url'"
            class="rounded-2xl border border-emerald-400/40 bg-emerald-950/20 p-5 shadow-inner shadow-emerald-950/20 sm:p-6"
          >
            <div class="mb-5">
              <div class="mb-2 flex items-center gap-2">
                <UIcon
                  name="i-lucide-link-2"
                  class="h-4 w-4 text-emerald-300"
                />
                <label class="block text-base font-semibold text-white">Recept-URL</label>
              </div>
              <p class="mb-4 text-sm text-slate-400">
                Klistra in länken till sidan där receptet finns.
              </p>
              <UInput
                v-model="url"
                :disabled="isLoading"
                placeholder="https://www.hellofresh.se/recept/..."
                icon="i-lucide-link"
                size="lg"
                class="w-full"
                :ui="{
                  base: 'ps-11 bg-slate-950/80 text-slate-100 placeholder:text-slate-500 ring-1 ring-slate-600 focus:ring-2 focus:ring-emerald-400',
                  leading: 'ps-3',
                  leadingIcon: 'text-slate-400'
                }"
              />
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <UButton
                color="primary"
                size="lg"
                block
                class="!bg-emerald-400 !text-slate-950 shadow-lg shadow-emerald-950/30 hover:!bg-emerald-300 disabled:!bg-slate-700 disabled:!text-slate-500 disabled:!shadow-none"
                :loading="isLoading && !isSaving"
                :disabled="!url.trim()"
                @click="importFromURL"
              >
                <UIcon
                  name="i-lucide-eye"
                  class="mr-2 h-5 w-5"
                />
                Förhandsvisa recept
              </UButton>
              <UButton
                color="neutral"
                variant="outline"
                size="lg"
                block
                class="!border-slate-600 !text-slate-100 hover:!bg-slate-700"
                :loading="isLoading && isSaving"
                :disabled="!url.trim()"
                @click="quickImport"
              >
                <UIcon
                  name="i-lucide-zap"
                  class="mr-2 h-5 w-5"
                />
                Spara direkt
              </UButton>
            </div>
            <div class="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
              <p class="flex gap-2">
                <UIcon
                  name="i-lucide-eye"
                  class="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-300"
                />Granska och redigera innan sparning.
              </p>
              <p class="flex gap-2">
                <UIcon
                  name="i-lucide-zap"
                  class="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-300"
                />Spara direkt och redigera senare.
              </p>
            </div>
          </div>

          <!-- Preview -->
          <div
            v-if="importResult"
            class="mt-6 space-y-6"
          >
            <div class="flex items-center gap-3 border-t border-slate-700/80 pt-6">
              <span class="h-px flex-1 bg-slate-700" />
              <span class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Förhandsvisning</span>
              <span class="h-px flex-1 bg-slate-700" />
            </div>

            <!-- Match summary -->
            <div class="rounded-2xl border border-emerald-400/30 bg-emerald-950/40 p-4">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-400/15">
                    <UIcon
                      name="i-lucide-check-circle-2"
                      class="h-5 w-5 text-emerald-300"
                    />
                  </div>
                  <div>
                    <p class="font-semibold text-emerald-100">
                      {{ importResult.matches.matched }} av {{ importResult.matches.total }} ingredienser mappade
                    </p>
                    <p class="mt-0.5 text-sm text-emerald-300/80">
                      AI-konfidens: {{ importResult.matches.matchRate }}%
                    </p>
                  </div>
                </div>
                <UButton
                  size="xs"
                  variant="outline"
                  color="neutral"
                  class="!border-emerald-400/40 !text-emerald-100 hover:!bg-emerald-400/15"
                  @click="importResult = null"
                >
                  <UIcon
                    name="i-lucide-pencil"
                    class="mr-1 h-3 w-3"
                  />
                  Ändra import
                </UButton>
              </div>
            </div>

            <!-- Recipe preview -->
            <div class="grid gap-5 lg:grid-cols-2">
              <!-- Left: Details -->
              <div class="rounded-2xl border border-slate-700 bg-slate-800/40 p-5">
                <div class="mb-5 flex items-center gap-2">
                  <UIcon
                    name="i-lucide-file-pen-line"
                    class="h-4 w-4 text-emerald-300"
                  />
                  <h3 class="text-sm font-semibold text-white">
                    Receptdetaljer
                  </h3>
                </div>
                <div class="space-y-4">
                  <img
                    v-if="editedRecipe.imageUrl"
                    :src="editedRecipe.imageUrl"
                    class="h-40 w-full rounded-xl object-cover"
                  >

                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-slate-200">Titel</label>
                    <UInput
                      v-model="editedRecipe.title"
                      class="w-full"
                      :ui="{ base: 'bg-slate-950/70 text-slate-100 ring-1 ring-slate-700 focus:ring-2 focus:ring-emerald-400' }"
                    />
                  </div>

                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-slate-200">Beskrivning</label>
                    <UTextarea
                      v-model="editedRecipe.description"
                      rows="2"
                      class="w-full"
                      :ui="{ base: 'bg-slate-950/70 text-slate-100 ring-1 ring-slate-700 focus:ring-2 focus:ring-emerald-400' }"
                    />
                  </div>

                  <div class="grid grid-cols-3 gap-3">
                    <div>
                      <label class="mb-1.5 block text-xs font-medium text-slate-300">Förbered (min)</label>
                      <UInput
                        v-model.number="editedRecipe.prepTime"
                        type="number"
                        :ui="{ base: 'bg-slate-950/70 text-slate-100 ring-1 ring-slate-700 focus:ring-2 focus:ring-emerald-400' }"
                      />
                    </div>
                    <div>
                      <label class="mb-1.5 block text-xs font-medium text-slate-300">Tillagning (min)</label>
                      <UInput
                        v-model.number="editedRecipe.cookTime"
                        type="number"
                        :ui="{ base: 'bg-slate-950/70 text-slate-100 ring-1 ring-slate-700 focus:ring-2 focus:ring-emerald-400' }"
                      />
                    </div>
                    <div>
                      <label class="mb-1.5 block text-xs font-medium text-slate-300">Portioner</label>
                      <UInput
                        v-model.number="editedRecipe.servings"
                        type="number"
                        :ui="{ base: 'bg-slate-950/70 text-slate-100 ring-1 ring-slate-700 focus:ring-2 focus:ring-emerald-400' }"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right: Ingredients mapping -->
              <div class="rounded-2xl border border-slate-700 bg-slate-800/40 p-5">
                <div class="mb-4 flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <UIcon
                      name="i-lucide-list"
                      class="h-4 w-4 text-emerald-300"
                    />
                    <h3 class="text-sm font-semibold text-white">
                      Ingredienser
                    </h3>
                  </div>
                  <span class="rounded-full bg-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-300">{{ importResult.recipe.ingredients?.length || 0 }} st</span>
                </div>

                <div class="app-scrollbar max-h-80 space-y-2 overflow-y-auto pr-1">
                  <div
                    v-for="(ing, idx) in importResult.recipe.ingredients"
                    :key="idx"
                    class="flex items-center justify-between gap-3 rounded-xl border p-3"
                    :class="manualMappings[`ing_${idx}`] ? 'border-emerald-400/25 bg-emerald-950/30' : 'border-amber-400/25 bg-amber-950/20'"
                  >
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-medium text-slate-100">
                        {{ ing.amount }} {{ ing.unit }} {{ ing.name }}
                      </p>
                      <p
                        class="mt-1 text-xs font-medium"
                        :class="manualMappings[`ing_${idx}`] ? 'text-emerald-300' : 'text-amber-300'"
                      >
                        {{ manualMappings[`ing_${idx}`]?.name || 'Ej mappad ännu' }}
                      </p>
                    </div>

                    <USelect
                      :model-value="manualMappings[`ing_${idx}`]?.ingredientTypeId || ''"
                      :options="[
                        { label: 'Välj...', value: '' },
                        ...ingredientTypeOptions
                      ]"
                      size="xs"
                      class="w-32 flex-shrink-0"
                      :ui="{ base: 'bg-slate-950/80 text-slate-100 ring-1 ring-slate-600 focus:ring-2 focus:ring-emerald-400' }"
                      @update:model-value="handleManualMappingChange(idx, $event)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Instructions preview -->
            <div
              v-if="importResult.recipe.instructions?.length"
              class="rounded-2xl border border-slate-700 bg-slate-800/40 p-5"
            >
              <label class="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <UIcon
                  name="i-lucide-list-ordered"
                  class="h-4 w-4 text-emerald-300"
                />
                Instruktioner ({{ importResult.recipe.instructions.length }} steg)
              </label>
              <div class="app-scrollbar max-h-52 space-y-3 overflow-y-auto pr-1">
                <div
                  v-for="(step, idx) in importResult.recipe.instructions.slice(0, 8)"
                  :key="idx"
                  class="flex gap-3"
                >
                  <span class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-sm font-semibold text-emerald-300">
                    {{ idx + 1 }}
                  </span>
                  <p class="pt-0.5 text-sm leading-relaxed text-slate-300">
                    {{ step }}
                  </p>
                </div>
                <p
                  v-if="importResult.recipe.instructions.length > 8"
                  class="pt-2 text-center text-sm text-slate-500"
                >
                  ... och {{ importResult.recipe.instructions.length - 8 }} till
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex flex-col-reverse gap-3 border-t border-slate-700/80 bg-slate-950/40 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
          <UButton
            variant="outline"
            color="neutral"
            class="!border-slate-600 !text-slate-200 hover:!bg-slate-800"
            @click="close"
          >
            Avbryt
          </UButton>
          <UButton
            color="primary"
            class="!bg-emerald-400 !text-slate-950 shadow-lg shadow-emerald-950/30 hover:!bg-emerald-300 disabled:!bg-slate-700 disabled:!text-slate-500 disabled:!shadow-none"
            :loading="isSaving"
            :disabled="!importResult"
            @click="saveRecipe"
          >
            <UIcon
              name="i-lucide-save"
              class="mr-2 h-4 w-4"
            />
            Spara recept
          </UButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
