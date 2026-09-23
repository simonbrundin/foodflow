<script setup lang="ts">
import type { ParsedRecipe, IngredientType } from '~/types'

interface Props {
  open: boolean
  initialUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  initialUrl: ''
})
const emit = defineEmits<{
  close: []
  saved: [recipeId: string]
}>()

const activeTab = ref<'paste' | 'url'>('paste')
const pasteText = ref('')
const url = ref('')
const isLoading = ref(false)
const isSaving = ref(false)
const isImportingDirectly = ref(false)
const error = ref('')

// Import result
const importResult = ref<{
  recipe: any
  matches: {
    total: number
    matched: number
    highConfidence: number
    matchRate: number
  }
  ingredientMatches?: { ingredientTypeId: string; confidence: number }[]
} | null>(null)

// Ingredient types from API
const { data: ingredientTypes } = useFetch<IngredientType[]>('/api/ingredient-types', {
  default: () => [] as IngredientType[]
})

// Manual mappings (user overrides)
const manualMappings = ref<Record<string, { ingredientTypeId: string; name: string; confidence: number }>>({})

// Editing fields
const editedRecipe = ref<Partial<ParsedRecipe>>({})

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

// Initialize from initialUrl prop
watch(() => props.initialUrl, (newUrl) => {
  if (newUrl && newUrl.trim()) {
    url.value = newUrl.trim()
    activeTab.value = 'url'
    isImportingDirectly.value = true
    nextTick(() => {
      if (url.value) importFromURL()
    })
  }
}, { immediate: true })

async function importFromURL() {
  if (!url.value) {
    error.value = 'Ange en URL'
    return
  }
  
  isLoading.value = true
  error.value = ''
  
  try {
    const result = await $fetch('/api/recipes/import', {
      method: 'POST',
      body: { url: url.value }
    })
    
    importResult.value = result as any
    editedRecipe.value = { ...result.recipe }
    initMappings(result.recipe)
  } catch (e: any) {
    error.value = e.data?.message || e.message || 'Import misslyckades'
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
  } catch (e: any) {
    error.value = e.data?.message || e.message || 'Snabbimport misslyckades. Försök med "Importera & förhandsvisa" istället.'
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
    const result = await $fetch('/api/recipes/parse-ai', {
      method: 'POST',
      body: { text: pasteText.value }
    })
    
    importResult.value = result as any
    editedRecipe.value = { ...result.recipe }
    initMappings(result.recipe, result.ingredientMatches)
  } catch (e: any) {
    error.value = e.data?.message || e.message || 'AI-parsing misslyckades'
  } finally {
    isLoading.value = false
  }
}

function initMappings(recipe: any, aiMatches?: { ingredientTypeId: string; confidence: number }[]) {
  manualMappings.value = {}
  
  for (let i = 0; i < recipe.ingredients.length; i++) {
    const ing = recipe.ingredients[i]
    const rawText = ing.rawText || `${ing.amount} ${ing.unit} ${ing.name}`
    
    // Try to find match from AI or ingredient type
    let mappedId = ''
    let confidence = 0
    
    // Check AI matches first
    if (aiMatches && aiMatches[i]) {
      mappedId = aiMatches[i].ingredientTypeId
      confidence = aiMatches[i].confidence
    }
    
    // Then try string matching
    if (!mappedId || confidence < 0.5) {
      const nameLower = (ing.name || '').toLowerCase()
      const found = ingredientTypes.value?.find(it => 
        nameLower.includes(it.name.toLowerCase()) || 
        it.name.toLowerCase().includes(nameLower)
      )
      if (found) {
        mappedId = found.id
        confidence = 0.8
      }
    }
    
    if (mappedId) {
      const it = ingredientTypes.value?.find(t => t.id === mappedId)
      manualMappings.value[rawText] = {
        ingredientTypeId: mappedId,
        name: it?.name || mappedId,
        confidence
      }
    }
  }
}

function getMappedIngredient(rawText: string) {
  return manualMappings.value[rawText]?.name || 'Ej mappad'
}

function updateIngredientMapping(rawText: string, ingredientType: IngredientType) {
  manualMappings.value[rawText] = {
    ingredientTypeId: ingredientType.id,
    name: ingredientType.name,
    confidence: 1
  }
}

async function saveRecipe() {
  if (!importResult.value) return
  
  isSaving.value = true
  
  try {
    // Build ingredient mappings
    const ingredientMappings: Record<string, any> = {}
    
    for (const [rawText, mapping] of Object.entries(manualMappings.value)) {
      if (mapping.ingredientTypeId) {
        // Check if it's a real ID or a raw name
        const isRealId = ingredientTypes.value?.some(it => it.id === mapping.ingredientTypeId)
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
        rawIngredients: importResult.value.recipe.ingredients.map((ing: any) => ({
          amount: ing.amount,
          unit: ing.unit || 'st',
          name: ing.name || ing.rawText
        }))
      }
    })
    
    emit('saved', result.id)
    emit('close')
    reset()
  } catch (e: any) {
    error.value = e.data?.message || e.message || 'Sparning misslyckades'
  } finally {
    isSaving.value = false
  }
}

function reset() {
  activeTab.value = 'paste'
  pasteText.value = ''
  url.value = ''
  error.value = ''
  importResult.value = null
  manualMappings.value = {}
  editedRecipe.value = {}
  isImportingDirectly.value = false
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
      isImportingDirectly.value = true
      // Use quick import for URLs from clipboard
      await quickImport()
    } else {
      // Treat as pasted text
      pasteText.value = text
      activeTab.value = 'paste'
      isImportingDirectly.value = true
      await importFromPaste()
    }
  } catch (e) {
    error.value = 'Kunde inte läsa urklipp - ge sidan behörighet att komma åt urklipp'
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
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="close"
    >
      <div class="w-full max-w-4xl rounded-xl bg-white shadow-xl">
        <!-- Header -->
        <div class="flex items-center justify-between border-b px-6 py-4">
          <h2 class="text-xl font-semibold text-gray-900">Importera recept</h2>
          <button
            class="rounded-lg p-2 hover:bg-gray-100"
            @click="close"
          >
            <UIcon name="i-lucide-x" class="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <!-- Content -->
        <div class="max-h-[calc(100vh-200px)] overflow-y-auto p-6">
          <!-- Tabs -->
          <div class="mb-6 flex flex-wrap gap-2">
            <UButton
              :variant="activeTab === 'paste' ? 'solid' : 'outline'"
              :color="activeTab === 'paste' ? 'primary' : 'gray'"
              @click="activeTab = 'paste'"
            >
              <UIcon name="i-lucide-clipboard" class="mr-2 h-4 w-4" />
              Klistra in text
            </UButton>
            <UButton
              :variant="activeTab === 'url' ? 'solid' : 'outline'"
              :color="activeTab === 'url' ? 'primary' : 'gray'"
              @click="activeTab = 'url'"
            >
              <UIcon name="i-lucide-link" class="mr-2 h-4 w-4" />
              Importera från URL
            </UButton>
            <UButton
              color="secondary"
              variant="outline"
              :loading="isLoading"
              @click="importFromClipboard"
            >
              <UIcon name="i-lucide-clipboard-paste" class="mr-2 h-4 w-4" />
              Från urklipp
            </UButton>
          </div>

          <!-- Error -->
          <UAlert v-if="error" color="error" variant="soft" class="mb-4">
            {{ error }}
          </UAlert>

          <!-- Paste Tab -->
          <div v-if="activeTab === 'paste'" class="space-y-4">
            <div>
              <div class="mb-2 flex items-center justify-between">
                <label class="block text-sm font-medium text-gray-700">
                  Klistra in ditt recept
                </label>
                <UButton size="xs" variant="ghost" @click="loadExample">
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
                rows="12"
                class="w-full font-mono text-sm"
              />
              <p class="mt-2 text-sm text-gray-500">
                AI kommer att extrahera titeln, ingredienser, instruktioner och tider.
              </p>
            </div>

            <UButton
              color="primary"
              size="lg"
              :loading="isLoading"
              :disabled="!pasteText.trim()"
              @click="importFromPaste"
            >
              <UIcon name="i-lucide-sparkles" class="mr-2 h-5 w-5" />
              Parsa med AI
            </UButton>
          </div>

          <!-- URL Tab -->
          <div v-if="activeTab === 'url'" class="space-y-4">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700">
                Recept-URL
              </label>
              <UInput
                v-model="url"
                :disabled="isLoading"
                placeholder="https://www.hellofresh.se/recept/..."
                class="w-full"
              />
              <p class="mt-2 text-sm text-gray-500">
                Obs: Vissa sajter blockerar automatisk import.
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <UButton
                color="primary"
                size="lg"
                :loading="isLoading"
                :disabled="!url.trim()"
                @click="importFromURL"
              >
                <UIcon name="i-lucide-eye" class="mr-2 h-5 w-5" />
                Importera &amp; förhandsvisa
              </UButton>
              <UButton
                color="secondary"
                variant="outline"
                size="lg"
                :loading="isLoading"
                :disabled="!url.trim()"
                @click="quickImport"
              >
                <UIcon name="i-lucide-bolt" class="mr-2 h-5 w-5" />
                Spara direkt
              </UButton>
            </div>
            <p class="text-xs text-gray-500">
              "Spara direkt" importerar och sparar utan förhandsvisning. Du kan redigera receptet efteråt.
            </p>
          </div>

          <!-- Preview -->
          <div v-if="importResult" class="mt-6 space-y-6">
            <UDivider />
            
            <!-- Match summary -->
            <UCard class="border-emerald-200 bg-emerald-50">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-emerald-900">
                    {{ importResult.matches.matched }} av {{ importResult.matches.total }} ingredienser mappade
                    <span v-if="importResult.matches.matched < importResult.matches.total" class="text-amber-600">
                      ({{ importResult.matches.total - importResult.matches.matched }} behöver mappas)
                    </span>
                  </p>
                  <p class="text-sm text-emerald-700">
                    AI-konfidens: {{ importResult.matches.matchRate }}%
                  </p>
                </div>
                <UButton
                  size="xs"
                  variant="ghost"
                  @click="importResult = null"
                >
                  Ändra
                </UButton>
              </div>
            </UCard>

            <!-- Recipe preview -->
            <div class="grid gap-6 lg:grid-cols-2">
              <!-- Left: Details -->
              <div class="space-y-4">
                <div>
                  <img
                    v-if="editedRecipe.imageUrl"
                    :src="editedRecipe.imageUrl"
                    class="h-40 w-full rounded-lg object-cover"
                  >
                </div>

                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700">Titel</label>
                  <UInput v-model="editedRecipe.title" class="w-full" />
                </div>

                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700">Beskrivning</label>
                  <UTextarea v-model="editedRecipe.description" rows="2" class="w-full" />
                </div>

                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700">Förbered (min)</label>
                    <UInput v-model.number="editedRecipe.prepTime" type="number" />
                  </div>
                  <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700">Tillagning (min)</label>
                    <UInput v-model.number="editedRecipe.cookTime" type="number" />
                  </div>
                  <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700">Portioner</label>
                    <UInput v-model.number="editedRecipe.servings" type="number" />
                  </div>
                </div>
              </div>

              <!-- Right: Ingredients mapping -->
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700">
                  Ingredienser ({{ importResult.recipe.ingredients?.length || 0 }})
                </label>
                
                <div class="max-h-72 space-y-2 overflow-y-auto rounded-lg border p-3">
                  <div
                    v-for="(ing, idx) in importResult.recipe.ingredients"
                    :key="idx"
                    class="flex items-center justify-between rounded-lg p-2"
                    :class="manualMappings[`ing_${idx}`] ? 'bg-emerald-50' : 'bg-amber-50'"
                  >
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-medium">
                        {{ ing.amount }} {{ ing.unit }} {{ ing.name }}
                      </p>
                      <p class="text-xs" :class="manualMappings[`ing_${idx}`] ? 'text-emerald-600' : 'text-amber-600'">
                        → {{ manualMappings[`ing_${idx}`]?.name || 'Ej mappad' }}
                      </p>
                    </div>
                    
                    <USelect
                      :model-value="manualMappings[`ing_${idx}`]?.ingredientTypeId || ''"
                      :options="[
                        { label: 'Välj...', value: '' },
                        ...(ingredientTypes?.map(it => ({ label: it.name, value: it.id })) || [])
                      ]"
                      size="xs"
                      class="w-32"
                      @update:model-value="(val) => {
                        const it = ingredientTypes?.find(i => i.id === val)
                        if (it) manualMappings[`ing_${idx}`] = { ingredientTypeId: val, name: it.name, confidence: 1 }
                        else manualMappings[`ing_${idx}`] = undefined as any
                      }"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Instructions preview -->
            <div v-if="importResult.recipe.instructions?.length">
              <label class="mb-2 block text-sm font-medium text-gray-700">
                Instruktioner ({{ importResult.recipe.instructions.length }} steg)
              </label>
              <div class="max-h-40 space-y-2 overflow-y-auto rounded-lg border p-3">
                <div
                  v-for="(step, idx) in importResult.recipe.instructions.slice(0, 6)"
                  :key="idx"
                  class="flex gap-3"
                >
                  <span class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-medium text-emerald-700">
                    {{ idx + 1 }}
                  </span>
                  <p class="text-sm">{{ step }}</p>
                </div>
                <p
                  v-if="importResult.recipe.instructions.length > 6"
                  class="text-sm text-gray-500"
                >
                  ... och {{ importResult.recipe.instructions.length - 6 }} till
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-3 border-t px-6 py-4">
          <UButton variant="ghost" @click="close">
            Avbryt
          </UButton>
          <UButton
            color="primary"
            :loading="isSaving"
            :disabled="!importResult"
            @click="saveRecipe"
          >
            Spara recept
          </UButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
