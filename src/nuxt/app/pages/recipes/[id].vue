<script setup lang="ts">
import type { Recipe, RecipeIngredient, IngredientType, Unit, IngredientConversion } from '~/types'
import { getErrorMessage } from '~/utils/errors'
import draggable from 'vuedraggable'

const route = useRoute()
const id = route.params.id as string

const { data: recipe, pending, error, refresh } = await useFetch<Recipe>(`/api/recipes/${id}`)

const { data: priceData } = await useFetch(`/api/recipes/${id}/price`, {
  query: computed(() => ({
    servings: recipe.value?.servings || 1
  })),
  default: () => null
})

// Ingredient types for editing
const { data: ingredientTypes } = useFetch<IngredientType[]>('/api/ingredient-types', {
  default: () => []
})

// Units for unit selection
const { data: units } = useFetch<Unit[]>('/api/units', {
  default: () => []
})

// Conversions for showing alternatives
const { data: conversions } = useFetch<IngredientConversion[]>('/api/ingredient-conversions', {
  default: () => []
})

// Get unit by ID
function getUnit(unitId: string): Unit | undefined {
  return units.value?.find(u => u.id === unitId)
}

// Get available units for an ingredient type
function getAvailableUnits(ingredientTypeId: string): Unit[] {
  if (!units.value) return []

  // Get conversions for this ingredient
  const ingredientConversions = conversions.value?.filter(
    c => c.ingredientTypeId === ingredientTypeId
  ) || []

  // Get the default unit for this ingredient type
  const ingredientType = ingredientTypes.value?.find(it => it.id === ingredientTypeId)
  const defaultUnitId = ingredientType?.defaultUnitId || 'st'
  const defaultUnit = units.value.find(u => u.id === defaultUnitId)

  // Start with the default unit
  const availableUnitIds = new Set<string>([defaultUnitId])

  // Add units from conversions
  for (const conv of ingredientConversions) {
    availableUnitIds.add(conv.unitFrom)
  }

  // If we still only have 1 unit, add other units of the same type
  // so the user has something to cycle through
  if (availableUnitIds.size <= 1 && defaultUnit) {
    const sameTypeUnits = units.value.filter(u => u.type === defaultUnit.type)
    for (const u of sameTypeUnits) {
      availableUnitIds.add(u.id)
    }
  }

  // Return units sorted by type
  return units.value
    .filter(u => availableUnitIds.has(u.id))
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

// Get next unit in cycle
function getNextUnit(currentUnitId: string, ingredientTypeId: string): Unit | null {
  const available = getAvailableUnits(ingredientTypeId)
  if (available.length <= 1) {
    return null
  }

  const currentIndex = available.findIndex(u => u.id === currentUnitId)
  const nextIndex = (currentIndex + 1) % available.length
  return available[nextIndex] ?? null
}

// Convert an amount between two units. Ingredient-specific conversions take
// precedence over generic weight/volume conversions.
function convertAmount(
  amount: number,
  fromUnitId: string,
  toUnitId: string,
  ingredientTypeId: string
): number {
  if (fromUnitId === toUnitId) return amount

  const directConversion = conversions.value?.find(
    conversion => conversion.ingredientTypeId === ingredientTypeId
      && conversion.unitFrom === fromUnitId
      && conversion.unitTo === toUnitId
  )
  if (directConversion) {
    return amount * directConversion.conversionFactor
  }

  const reverseConversion = conversions.value?.find(
    conversion => conversion.ingredientTypeId === ingredientTypeId
      && conversion.unitFrom === toUnitId
      && conversion.unitTo === fromUnitId
  )
  if (reverseConversion && reverseConversion.conversionFactor !== 0) {
    return amount / reverseConversion.conversionFactor
  }

  const fromUnit = getUnit(fromUnitId)
  const toUnit = getUnit(toUnitId)

  // Generic conversion within the same dimension.
  if (
    fromUnit?.type === 'weight'
    && toUnit?.type === 'weight'
    && fromUnit.toGramFactor
    && toUnit.toGramFactor
  ) {
    return amount * fromUnit.toGramFactor / toUnit.toGramFactor
  }

  if (
    fromUnit?.type === 'volume'
    && toUnit?.type === 'volume'
    && fromUnit.toMlFactor
    && toUnit.toMlFactor
  ) {
    return amount * fromUnit.toMlFactor / toUnit.toMlFactor
  }

  // No safe conversion exists, so keep the amount unchanged.
  return amount
}

// Cycle to next unit
async function cycleUnit(ing: RecipeIngredient, index: number) {
  const nextUnit = getNextUnit(ing.unitId, ing.ingredientTypeId)
  if (!nextUnit) return

  // Update locally first for immediate feedback
  if (recipe.value && index >= 0 && index < recipe.value.ingredients.length) {
    // Convert the amount as well as changing the displayed unit.
    const newAmount = convertAmount(
      ing.amount,
      ing.unitId,
      nextUnit.id,
      ing.ingredientTypeId
    )

    // Create a new ingredients array with the updated ingredient
    // This is necessary for Vue to detect the change (reactive deep updates)
    const currentIngredient = recipe.value.ingredients[index]
    if (!currentIngredient) return

    const newIngredients = [...recipe.value.ingredients]
    newIngredients[index] = {
      ...currentIngredient,
      unitId: nextUnit.id,
      amount: newAmount
    }
    recipe.value = {
      ...recipe.value,
      ingredients: newIngredients
    }

    // Save to backend using index as ingredientId (since ingredients don't have IDs)
    try {
      await $fetch(`/api/recipes/${id}/ingredients/${index}`, {
        method: 'PUT',
        body: {
          unitId: nextUnit.id,
          amount: newAmount
        }
      })
    } catch (e) {
      console.error('Failed to update unit:', e)
      // Refresh to get correct state
      await refresh()
    }
  }
}

// Get unit label
function getUnitLabel(unitId: string): string {
  return getUnit(unitId)?.shortName || unitId
}

// Edit mode state
const isEditing = ref(false)
const isSaving = ref(false)
const editError = ref('')

// Editable recipe data
const editedRecipe = ref<{
  title: string
  description: string
  imageUrl: string
  prepTime: number
  cookTime: number
  servings: number
  difficulty: 'easy' | 'medium' | 'hard'
  rating: number
  sourceUrl: string
  sourceName: string
  ingredients: RecipeIngredient[]
  instructions: string[]
  tags: string[]
}>({
  title: '',
  description: '',
  imageUrl: '',
  prepTime: 0,
  cookTime: 0,
  servings: 4,
  difficulty: 'medium',
  rating: 0,
  sourceUrl: '',
  sourceName: '',
  ingredients: [],
  instructions: [],
  tags: []
})

// Initialize edit data when the page enters edit mode
watch([recipe, isEditing], ([r, editing]) => {
  if (editing && r) {
    editedRecipe.value = {
      title: r.title,
      description: r.description,
      imageUrl: r.imageUrl || '',
      prepTime: r.prepTime,
      cookTime: r.cookTime,
      servings: r.servings,
      difficulty: r.difficulty,
      rating: r.rating ?? 0,
      sourceUrl: r.sourceUrl || '',
      sourceName: r.sourceName || '',
      ingredients: JSON.parse(JSON.stringify(r.ingredients)),
      instructions: [...r.instructions],
      tags: [...r.tags]
    }
  }
}, { immediate: true })

function startEditing() {
  editError.value = ''
  isEditing.value = true
}

function cancelEditing() {
  editError.value = ''
  isEditing.value = false
}

// Delete confirmation
const showDeleteModal = ref(false)
const isDeleting = ref(false)
const deleteError = ref('')

async function deleteRecipe() {
  if (!recipe.value) return

  isDeleting.value = true
  deleteError.value = ''

  try {
    await $fetch(`/api/recipes/${id}`, {
      method: 'DELETE'
    })
    navigateTo('/recipes')
  } catch (caughtError: unknown) {
    deleteError.value = getErrorMessage(caughtError, 'Kunde inte ta bort receptet')
    isDeleting.value = false
  }
}

async function saveRecipe() {
  if (!recipe.value) return

  isSaving.value = true
  editError.value = ''

  try {
    const result = await $fetch<Recipe>(`/api/recipes/${id}`, {
      method: 'PUT',
      body: editedRecipe.value
    })

    // Update local state and keep the servings picker in sync.
    recipe.value = result
    servings.value = result.servings
    isEditing.value = false
  } catch (caughtError: unknown) {
    editError.value = getErrorMessage(caughtError, 'Kunde inte spara receptet')
  } finally {
    isSaving.value = false
  }
}

// Ingredient management in edit mode
function addIngredient() {
  editedRecipe.value.ingredients.push({
    id: `temp_${Date.now()}`,
    recipeId: id,
    ingredientTypeId: '',
    amount: 0,
    unitId: 'st'
  })
}

function removeIngredient(index: number) {
  editedRecipe.value.ingredients.splice(index, 1)
}

function addInstruction() {
  editedRecipe.value.instructions.push('')
}

function removeInstruction(index: number) {
  editedRecipe.value.instructions.splice(index, 1)
}

// Tags management
const newTag = ref('')

function addTag() {
  const tag = newTag.value.trim()
  if (tag && !editedRecipe.value.tags.includes(tag)) {
    editedRecipe.value.tags.push(tag)
  }
  newTag.value = ''
}

function removeTag(index: number) {
  editedRecipe.value.tags.splice(index, 1)
}

function getIngredientName(ingredient: RecipeIngredient) {
  return ingredient.ingredientTypeName || ingredient.ingredientTypeId
}

const { isInWeekPlan, getWeekPlanEntries, removeFromWeekPlan } = useWeekPlan()

// Local editable state for instructions (like Dinnia's linked list concept)
const editableInstructions = ref<string[]>([])

// Watch for recipe changes to sync instructions
watch(() => recipe.value?.instructions, (newInstructions) => {
  if (newInstructions) {
    editableInstructions.value = [...newInstructions]
  }
}, { immediate: true })

// Servings adjuster
const servings = ref(recipe.value?.servings || 4)
const scaledIngredients = computed(() => {
  if (!recipe.value) return []
  const scale = servings.value / recipe.value.servings
  return recipe.value.ingredients.map(ing => ({
    ...ing,
    scaledAmount: (ing.amount * scale).toFixed(ing.amount < 1 ? 2 : 0)
  }))
})

// Week plan integration
const isInPlan = computed(() => recipe.value ? isInWeekPlan(recipe.value.id) : false)
const weekPlanEntries = computed(() => recipe.value ? getWeekPlanEntries(recipe.value.id) : [])
const days = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag']

const totalTime = computed(() => {
  if (!recipe.value) return 0
  return recipe.value.prepTime + recipe.value.cookTime
})

const showPrice = computed(() => priceData.value?.hasPrice === true)
const formattedPrice = computed(() => {
  if (!priceData.value?.hasPrice) return ''
  const price = priceData.value.pricePerServing
  return price % 1 === 0 ? `${price.toFixed(0)} kr` : `${price.toFixed(2)} kr`
})
const showRating = computed(() => recipe.value?.rating !== undefined && recipe.value?.rating !== null && recipe.value.rating > 0)
const ratingPercent = computed(() => ((recipe.value?.rating || 0) / 10) * 100)

// Handle instruction reordering (like Dinnia's drag-and-drop)
function onDragEnd(event: { oldIndex: number, newIndex: number }) {
  // In a real app, this would update the order in the database
  // using the linked list approach from Dinnia
  console.log('Reordered instructions:', editableInstructions.value)
  console.log('Moved from', event.oldIndex, 'to', event.newIndex)
}

async function handleRemoveFromPlan(entryId: string) {
  await removeFromWeekPlan(entryId)
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div
      v-if="pending"
      class="space-y-6"
    >
      <USkeleton class="h-64 w-full rounded-lg" />
      <div class="space-y-4">
        <USkeleton class="h-8 w-1/2" />
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-3/4" />
      </div>
    </div>

    <!-- Error -->
    <UCard
      v-else-if="error"
      color="error"
    >
      <div class="text-center">
        <UIcon
          name="i-lucide-alert-circle"
          class="mx-auto h-12 w-12"
        />
        <h3 class="mt-4 text-lg font-medium">
          Receptet hittades inte
        </h3>
        <UButton
          to="/recipes"
          variant="outline"
          class="mt-4"
        >
          Tillbaka till recept
        </UButton>
      </div>
    </UCard>

    <!-- Recipe -->
    <div
      v-else-if="recipe"
      class="space-y-6"
    >
      <!-- Back Button -->
      <div class="flex items-center justify-between">
        <UButton
          to="/recipes"
          variant="ghost"
          size="sm"
        >
          <UIcon
            name="i-lucide-arrow-left"
            class="mr-1 h-4 w-4"
          />
          Tillbaka
        </UButton>

        <!-- Edit actions -->
        <div class="flex items-center gap-3">
          <template v-if="isEditing">
            <UButton
              color="neutral"
              :disabled="isSaving"
              class="!border !border-slate-600/80 !bg-slate-800/80 !px-4 !py-2.5 !font-semibold !text-slate-200 rounded-xl shadow-sm transition hover:!border-slate-500 hover:!bg-slate-700/80 hover:shadow-md focus-visible:ring-2 focus-visible:ring-slate-400/50"
              @click="cancelEditing"
            >
              <UIcon
                name="i-lucide-x"
                class="mr-2 h-4 w-4 text-slate-400"
              />
              Avbryt
            </UButton>
            <UButton
              color="primary"
              :loading="isSaving"
              class="!border !border-emerald-300/20 !bg-emerald-300/10 !px-4 !py-2.5 !font-semibold !text-emerald-100 rounded-xl shadow-sm transition hover:!border-emerald-300/35 hover:!bg-emerald-300/15 hover:shadow focus-visible:ring-2 focus-visible:ring-emerald-300/40"
              @click="saveRecipe"
            >
              <UIcon
                name="i-lucide-check"
                class="mr-2 h-4 w-4 text-emerald-300"
              />
              Spara ändringar
            </UButton>
          </template>
          <template v-else>
            <UButton
              color="primary"
              class="!border !border-emerald-300/20 !bg-emerald-300/10 !px-4 !py-2.5 !font-semibold !text-emerald-100 rounded-xl shadow-sm transition hover:!border-emerald-300/35 hover:!bg-emerald-300/15 hover:shadow focus-visible:ring-2 focus-visible:ring-emerald-300/40"
              @click="startEditing"
            >
              <UIcon
                name="i-lucide-pencil"
                class="mr-2 h-4 w-4 text-emerald-300"
              />
              Redigera recept
            </UButton>
            <UButton
              color="neutral"
              class="!border !border-slate-600/80 !bg-slate-800/80 !px-4 !py-2.5 !font-semibold !text-slate-200 rounded-xl shadow-sm transition hover:!border-slate-500 hover:!bg-slate-700/80 hover:shadow-md focus-visible:ring-2 focus-visible:ring-slate-400/50"
              @click="showDeleteModal = true"
            >
              <UIcon
                name="i-lucide-trash-2"
                class="mr-2 h-4 w-4 text-slate-400"
              />
              Ta bort
            </UButton>
          </template>
        </div>
      </div>

      <UAlert
        v-if="isEditing && editError"
        color="error"
        variant="soft"
      >
        {{ editError }}
      </UAlert>

      <div class="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)] lg:items-center">
        <!-- Hero Image -->
        <div
          class="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-gray-100 shadow-xl shadow-black/10"
          :class="{ 'ring-4 ring-emerald-500 ring-offset-4': isInPlan }"
        >
          <img
            v-if="recipe.imageUrl"
            :src="recipe.imageUrl"
            :alt="recipe.title"
            class="h-full w-full object-cover"
          >
          <div
            v-else
            class="flex h-full items-center justify-center"
          >
            <UIcon
              name="i-lucide-image"
              class="h-24 w-24 text-gray-300"
            />
          </div>

          <!-- Rating Badge -->
          <div
            v-if="showRating"
            class="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-gray-950/85 px-2.5 py-1.5 text-xs font-bold text-white shadow-lg shadow-black/25 backdrop-blur-sm"
          >
            <div class="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center">
              <UIcon
                name="i-lucide-star"
                class="block h-3.5 w-3.5 text-gray-500"
              />
              <div
                class="absolute inset-0 overflow-hidden"
                :style="{ width: ratingPercent + '%' }"
              >
                <UIcon
                  name="i-lucide-star"
                  class="block h-3.5 w-3.5 fill-amber-400 text-amber-400"
                />
              </div>
            </div>
            <span class="leading-none">{{ recipe.rating?.toFixed(1) }}</span>
          </div>

          <!-- In Week Plan Badge -->
          <div
            v-if="isInPlan"
            class="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/25"
          >
            <UIcon
              name="i-lucide-check"
              class="h-3.5 w-3.5"
            />
            I planen
          </div>
        </div>

        <!-- Header -->
        <div>
          <template v-if="isEditing">
            <div class="space-y-5 rounded-2xl border border-emerald-200/15 bg-slate-950/25 p-5 shadow-sm">
              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-emerald-200/75">Titel</label>
                <UInput
                  v-model="editedRecipe.title"
                  size="lg"
                  placeholder="Receptets titel"
                  class="w-full"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-emerald-200/75">Beskrivning</label>
                <UTextarea
                  v-model="editedRecipe.description"
                  :rows="4"
                  placeholder="Beskriv receptet kort"
                  class="w-full"
                />
              </div>
              <div>
                <span class="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-emerald-200/75">Svårighetsgrad</span>
                <div class="grid grid-cols-3 gap-2">
                  <UButton
                    :variant="editedRecipe.difficulty === 'easy' ? 'solid' : 'outline'"
                    :color="editedRecipe.difficulty === 'easy' ? 'primary' : 'neutral'"
                    size="sm"
                    class="justify-center"
                    @click="editedRecipe.difficulty = 'easy'"
                  >
                    Lätt
                  </UButton>
                  <UButton
                    :variant="editedRecipe.difficulty === 'medium' ? 'solid' : 'outline'"
                    :color="editedRecipe.difficulty === 'medium' ? 'primary' : 'neutral'"
                    size="sm"
                    class="justify-center"
                    @click="editedRecipe.difficulty = 'medium'"
                  >
                    Medel
                  </UButton>
                  <UButton
                    :variant="editedRecipe.difficulty === 'hard' ? 'solid' : 'outline'"
                    :color="editedRecipe.difficulty === 'hard' ? 'primary' : 'neutral'"
                    size="sm"
                    class="justify-center"
                    @click="editedRecipe.difficulty = 'hard'"
                  >
                    Svår
                  </UButton>
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            <h1 class="text-3xl font-bold text-gray-900">
              {{ recipe.title }}
            </h1>
            <p class="mt-2 text-gray-600">
              {{ recipe.description }}
            </p>
          </template>

          <!-- Meta -->
          <div class="mt-5 flex flex-wrap items-end gap-4 text-sm text-gray-500">
            <template v-if="isEditing">
              <div class="grid w-full grid-cols-2 gap-3 rounded-2xl border border-slate-700/60 bg-slate-950/20 p-4 sm:grid-cols-3">
                <div>
                  <label class="mb-1.5 block text-xs font-semibold text-slate-400">Förberedelse</label>
                  <div class="relative">
                    <UInput
                      v-model.number="editedRecipe.prepTime"
                      type="number"
                      min="0"
                      class="w-full pr-12"
                    />
                    <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500">min</span>
                  </div>
                </div>
                <div>
                  <label class="mb-1.5 block text-xs font-semibold text-slate-400">Tillagning</label>
                  <div class="relative">
                    <UInput
                      v-model.number="editedRecipe.cookTime"
                      type="number"
                      min="0"
                      class="w-full pr-12"
                    />
                    <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500">min</span>
                  </div>
                </div>
                <div>
                  <label class="mb-1.5 block text-xs font-semibold text-slate-400">Portioner</label>
                  <UInput
                    v-model.number="editedRecipe.servings"
                    type="number"
                    min="1"
                    class="w-full"
                  />
                </div>
              </div>
              <div class="w-full rounded-2xl border border-slate-700/60 bg-slate-950/20 p-4">
                <div class="mb-3 flex items-center justify-between gap-3">
                  <label
                    for="recipe-rating"
                    class="text-xs font-semibold text-slate-400"
                  >Betyg</label>
                  <div class="flex items-center gap-2">
                    <input
                      id="recipe-rating"
                      v-model.number="editedRecipe.rating"
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      class="w-16 rounded-lg border border-slate-600 bg-slate-900 px-2 py-1 text-center text-sm font-bold text-amber-300 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                      aria-label="Betyg mellan 0 och 10"
                    >
                    <span class="text-sm text-slate-500">/ 10</span>
                  </div>
                </div>
                <input
                  id="recipe-rating-slider"
                  v-model.number="editedRecipe.rating"
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  class="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-emerald-400"
                  aria-label="Justera betyg mellan 0 och 10"
                >
                <div class="mt-1 flex justify-between text-[11px] text-slate-500">
                  <span>0</span>
                  <span>10</span>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="inline-flex items-center gap-1.5 rounded-full border border-slate-700/70 bg-slate-900/60 px-3 py-1.5 text-xs font-bold text-slate-200">
                <UIcon
                  name="i-lucide-timer"
                  class="h-3.5 w-3.5 text-emerald-300"
                />
                <span>{{ totalTime }} min</span>
              </div>
              <div
                v-if="showPrice"
                class="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-emerald-950/20"
              >
                <UIcon
                  name="i-lucide-wallet-cards"
                  class="h-3.5 w-3.5 text-emerald-100"
                />
                <span>{{ formattedPrice }}</span>
              </div>
            </template>
            <div
              v-if="recipe.sourceName"
              class="flex items-center gap-1"
            >
              <UIcon
                name="i-lucide-link"
                class="h-5 w-5"
              />
              <a
                :href="recipe.sourceUrl"
                target="_blank"
                class="hover:text-emerald-600"
              >
                {{ recipe.sourceName }}
              </a>
            </div>
          </div>

          <!-- Tags -->
          <div
            v-if="isEditing || recipe.tags?.length"
            class="mt-4 flex flex-wrap items-center gap-2"
          >
            <div
              v-if="isEditing"
              class="w-full rounded-2xl border border-slate-700/60 bg-slate-950/20 p-4"
            >
              <label class="mb-2 block text-xs font-semibold text-slate-400">Taggar</label>
              <div class="flex flex-wrap items-center gap-2">
                <UBadge
                  v-for="(tag, index) in editedRecipe.tags"
                  :key="`${tag}-${index}`"
                  variant="subtle"
                  color="primary"
                  class="rounded-full pr-1"
                >
                  {{ tag }}
                  <button
                    type="button"
                    class="ml-1 rounded-full p-0.5 hover:bg-emerald-300/20"
                    @click="removeTag(index)"
                  >
                    <UIcon
                      name="i-lucide-x"
                      class="h-3 w-3"
                    />
                  </button>
                </UBadge>
                <UInput
                  v-model="newTag"
                  placeholder="Ny tagg"
                  size="sm"
                  class="min-w-32 flex-1"
                  @keyup.enter="addTag"
                />
                <UButton
                  size="sm"
                  color="primary"
                  variant="soft"
                  @click="addTag"
                >
                  <UIcon
                    name="i-lucide-plus"
                    class="mr-1 h-3.5 w-3.5"
                  />
                  Lägg till
                </UButton>
              </div>
            </div>
            <template v-else>
              <UBadge
                v-for="tag in recipe.tags"
                :key="tag"
                variant="subtle"
                color="gray"
              >
                {{ tag }}
              </UBadge>
            </template>
          </div>

          <!-- Week Plan Entries -->
          <div
            v-if="isInPlan"
            class="mt-4 flex flex-wrap gap-2"
          >
            <div
              v-for="entry in weekPlanEntries"
              :key="entry.id"
              class="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm"
            >
              <span class="font-medium text-emerald-700">
                {{ days[entry.dayOfWeek || 0] }}
              </span>
              <span class="text-emerald-600">
                {{ entry.servings }} portioner
              </span>
              <button
                class="text-emerald-400 hover:text-red-500"
                @click="handleRemoveFromPlan(entry.id)"
              >
                <UIcon
                  name="i-lucide-x"
                  class="h-4 w-4"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Ingredients -->
        <div class="lg:col-span-1">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between gap-3">
                <h2 class="text-lg font-semibold">
                  Ingredienser
                </h2>
                <div
                  v-if="!isEditing"
                  class="flex items-center gap-2"
                >
                  <span class="text-sm text-gray-500">Portioner:</span>
                  <UButton
                    variant="outline"
                    size="xs"
                    :disabled="servings <= 1"
                    @click="servings--"
                  >
                    -
                  </UButton>
                  <span class="w-8 text-center font-medium">{{ servings }}</span>
                  <UButton
                    variant="outline"
                    size="xs"
                    @click="servings++"
                  >
                    +
                  </UButton>
                </div>
              </div>
            </template>

            <div
              v-if="isEditing"
              class="space-y-3"
            >
              <div
                v-for="(ing, index) in editedRecipe.ingredients"
                :key="ing.id || index"
                class="rounded-2xl border border-slate-700/60 bg-slate-950/20 p-3"
              >
                <div class="grid grid-cols-[4.5rem_4.5rem_minmax(0,1fr)_auto] items-end gap-2">
                  <div>
                    <label class="mb-1 block text-[11px] font-semibold text-slate-500">Mängd</label>
                    <UInput
                      v-model.number="ing.amount"
                      type="number"
                      min="0"
                      step="0.1"
                      aria-label="Mängd"
                    />
                  </div>
                  <div>
                    <label class="mb-1 block text-[11px] font-semibold text-slate-500">Enhet</label>
                    <USelect
                      v-model="ing.unitId"
                      :items="units?.map((u: Unit) => ({ label: u.shortName, value: u.id })) || []"
                      aria-label="Enhet"
                    />
                  </div>
                  <div class="min-w-0">
                    <label class="mb-1 block text-[11px] font-semibold text-slate-500">Ingrediens</label>
                    <USelect
                      v-model="ing.ingredientTypeId"
                      :items="[
                        { label: 'Välj ingrediens', value: '' },
                        ...(ingredientTypes?.map((item: IngredientType) => ({ label: item.name, value: item.id })) || [])
                      ]"
                      aria-label="Ingrediens"
                    />
                  </div>
                  <UButton
                    variant="soft"
                    color="error"
                    size="sm"
                    aria-label="Ta bort ingrediens"
                    class="mb-0.5"
                    @click="removeIngredient(index)"
                  >
                    <UIcon
                      name="i-lucide-trash-2"
                      class="h-4 w-4"
                    />
                  </UButton>
                </div>
                <div class="mt-3">
                  <label class="mb-1 block text-[11px] font-semibold text-slate-500">Anteckning</label>
                  <UInput
                    v-model="ing.notes"
                    placeholder="Till exempel finhackad"
                    size="sm"
                    class="w-full"
                  />
                </div>
              </div>
              <UButton
                color="primary"
                variant="soft"
                size="sm"
                class="w-full justify-center"
                @click="addIngredient"
              >
                <UIcon
                  name="i-lucide-plus"
                  class="mr-1 h-4 w-4"
                />
                Lägg till ingrediens
              </UButton>
            </div>

            <ul
              v-else
              class="divide-y divide-gray-100"
            >
              <li
                v-for="(ing, index) in scaledIngredients"
                :key="index"
                class="group flex items-center gap-4 py-3 first:pt-0 last:pb-0"
              >
                <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                  {{ index + 1 }}
                </span>
                <div class="min-w-0 flex-1 text-left">
                  <div class="truncate font-medium text-gray-800">
                    {{ getIngredientName(ing) }}
                  </div>
                  <div
                    v-if="ing.notes"
                    class="mt-0.5 truncate text-sm italic text-gray-400"
                  >
                    {{ ing.notes }}
                  </div>
                </div>
                <div class="flex shrink-0 items-center justify-end gap-1 text-right">
                  <span class="font-semibold tabular-nums text-gray-900">
                    {{ ing.scaledAmount }}
                  </span>
                  <button
                    v-if="getAvailableUnits(ing.ingredientTypeId).length > 1"
                    class="cursor-pointer rounded px-1 py-0.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800"
                    :title="'Klicka för att byta enhet'"
                    @click="cycleUnit(ing, index)"
                  >
                    {{ getUnitLabel(ing.unitId) }}
                  </button>
                  <span
                    v-else
                    class="px-1 text-sm text-gray-500"
                  >
                    {{ getUnitLabel(ing.unitId) }}
                  </span>
                </div>
              </li>
            </ul>
          </UCard>
        </div>

        <!-- Instructions (with drag-and-drop like Dinnia) -->
        <div class="lg:col-span-2">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between gap-3">
                <h2 class="text-lg font-semibold">
                  Instruktioner
                </h2>
                <span
                  v-if="!isEditing"
                  class="text-sm text-gray-500"
                >Dra för att ändra ordning</span>
              </div>
            </template>

            <div
              v-if="isEditing"
              class="space-y-3"
            >
              <div
                v-for="(step, index) in editedRecipe.instructions"
                :key="index"
                class="rounded-2xl border border-slate-700/60 bg-slate-950/20 p-3"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <span class="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400/15 text-sm font-bold text-emerald-300">
                      {{ index + 1 }}
                    </span>
                    <span class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Steg {{ index + 1 }}</span>
                  </div>
                  <UButton
                    variant="soft"
                    color="error"
                    size="xs"
                    aria-label="Ta bort steg"
                    @click="removeInstruction(index)"
                  >
                    <UIcon
                      name="i-lucide-trash-2"
                      class="h-3.5 w-3.5"
                    />
                  </UButton>
                </div>
                <UTextarea
                  v-model="editedRecipe.instructions[index]"
                  :rows="3"
                  placeholder="Beskriv steget"
                  class="mt-3 w-full"
                />
              </div>
              <UButton
                color="primary"
                variant="soft"
                size="sm"
                class="w-full justify-center"
                @click="addInstruction"
              >
                <UIcon
                  name="i-lucide-plus"
                  class="mr-1 h-4 w-4"
                />
                Lägg till steg
              </UButton>
            </div>

            <draggable
              v-else
              v-model="editableInstructions"
              item-key="index"
              handle=".drag-handle"
              ghost-class="opacity-50"
              animation="200"
              class="space-y-4"
              @end="onDragEnd"
            >
              <template #item="{ element, index }">
                <li class="flex gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4 transition-shadow hover:shadow-md">
                  <div class="drag-handle cursor-grab text-gray-400 hover:text-gray-600">
                    <UIcon
                      name="i-lucide-grip-vertical"
                      class="h-5 w-5"
                    />
                  </div>
                  <span class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                    {{ index + 1 }}
                  </span>
                  <p class="flex-1 pt-1 text-gray-700">
                    {{ element }}
                  </p>
                </li>
              </template>
            </draggable>
          </UCard>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
        @click.self="showDeleteModal = false"
      >
        <div
          class="w-full max-w-md overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900 text-slate-100 shadow-2xl shadow-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-recipe-title"
        >
          <div class="flex items-center justify-between border-b border-slate-700/80 bg-slate-900 px-5 py-4 sm:px-7">
            <div class="flex items-center gap-3">
              <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-lg shadow-amber-950/30">
                <UIcon
                  name="i-lucide-trash-2"
                  class="h-5 w-5"
                />
              </div>
              <div>
                <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
                  Bekräfta åtgärd
                </p>
                <h2
                  id="delete-recipe-title"
                  class="text-xl font-bold tracking-tight text-white"
                >
                  Ta bort recept
                </h2>
              </div>
            </div>
            <button
              type="button"
              aria-label="Stäng bekräftelsedialogen"
              class="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              @click="showDeleteModal = false"
            >
              <UIcon
                name="i-lucide-x"
                class="h-5 w-5"
              />
            </button>
          </div>

          <div class="space-y-4 bg-slate-900 p-5 sm:p-7">
            <p class="text-sm leading-6 text-slate-300">
              Är du säker på att du vill ta bort receptet
              <span class="font-semibold text-white">"{{ recipe?.title }}"</span>?
            </p>
            <p class="flex items-center gap-2 text-sm text-amber-300">
              <UIcon
                name="i-lucide-alert-triangle"
                class="h-4 w-4"
              />
              Detta kan inte ångras.
            </p>
            <UAlert
              v-if="deleteError"
              color="error"
              variant="soft"
            >
              {{ deleteError }}
            </UAlert>
          </div>

          <div class="flex flex-col-reverse gap-3 border-t border-slate-700/80 bg-slate-950/40 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
            <UButton
              variant="outline"
              color="neutral"
              class="!border-slate-600 !text-slate-200 hover:!bg-slate-800"
              @click="showDeleteModal = false"
            >
              Avbryt
            </UButton>
            <UButton
              color="primary"
              class="!bg-amber-400 !text-slate-950 shadow-lg shadow-amber-950/30 hover:!bg-amber-300"
              :loading="isDeleting"
              @click="deleteRecipe"
            >
              <UIcon
                name="i-lucide-trash-2"
                class="mr-2 h-4 w-4"
              />
              Ta bort recept
            </UButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
