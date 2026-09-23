<script setup lang="ts">
import type { Recipe, RecipeIngredient, IngredientType } from '~/types'
import draggable from 'vuedraggable'

const route = useRoute()
const id = route.params.id as string

const { data: recipe, pending, error, refresh } = await useFetch<Recipe>(`/api/recipes/${id}`)

// Ingredient types for editing
const { data: ingredientTypes } = useFetch<IngredientType[]>('/api/ingredient-types', {
  default: () => []
})

// Edit mode state
const showEditModal = ref(false)
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
  rating?: number
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
  sourceUrl: '',
  sourceName: '',
  ingredients: [],
  instructions: [],
  tags: []
})

// Initialize edit data when recipe loads or modal opens
watch([recipe, showEditModal], ([r, show]) => {
  if (show && r) {
    editedRecipe.value = {
      title: r.title,
      description: r.description,
      imageUrl: r.imageUrl || '',
      prepTime: r.prepTime,
      cookTime: r.cookTime,
      servings: r.servings,
      difficulty: r.difficulty,
      rating: r.rating,
      sourceUrl: r.sourceUrl || '',
      sourceName: r.sourceName || '',
      ingredients: JSON.parse(JSON.stringify(r.ingredients)),
      instructions: [...r.instructions],
      tags: [...r.tags]
    }
  }
}, { immediate: true })

function openEditModal() {
  editError.value = ''
  showEditModal.value = true
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
    
    // Update local state
    recipe.value = result
    showEditModal.value = false
  } catch (e: any) {
    editError.value = e.data?.message || e.message || 'Kunde inte spara receptet'
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
    unit: 'st'
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

const { isInWeekPlan, getWeekPlanEntries, getTotalServings, addToWeekPlan, removeFromWeekPlan } = useWeekPlan()

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
const totalServingsInPlan = computed(() => recipe.value ? getTotalServings(recipe.value.id) : 0)

const showWeekPlanModal = ref(false)
const selectedDay = ref(0)
const selectedServings = ref(recipe.value?.servings || 4)
const days = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag']

const difficultyConfig = {
  easy: { label: 'Lätt', color: 'text-green-600 bg-green-50', icon: 'i-lucide-smile' },
  medium: { label: 'Medel', color: 'text-amber-600 bg-amber-50', icon: 'i-lucide-meh' },
  hard: { label: 'Svår', color: 'text-red-600 bg-red-50', icon: 'i-lucide-frown' }
}

const difficulty = computed(() => recipe.value ? difficultyConfig[recipe.value.difficulty] : difficultyConfig.easy)

const totalTime = computed(() => {
  if (!recipe.value) return 0
  return recipe.value.prepTime + recipe.value.cookTime
})

// Handle instruction reordering (like Dinnia's drag-and-drop)
function onDragEnd(event: { oldIndex: number, newIndex: number }) {
  // In a real app, this would update the order in the database
  // using the linked list approach from Dinnia
  console.log('Reordered instructions:', editableInstructions.value)
  console.log('Moved from', event.oldIndex, 'to', event.newIndex)
}

// Add to week plan
function openWeekPlanModal() {
  selectedServings.value = servings.value
  selectedDay.value = 0
  showWeekPlanModal.value = true
}

async function confirmAddToWeekPlan() {
  if (!recipe.value) return
  const success = await addToWeekPlan(recipe.value, selectedDay.value, selectedServings.value)
  if (success) {
    showWeekPlanModal.value = false
  }
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
        
        <!-- Edit Button -->
        <UButton
          variant="outline"
          size="sm"
          @click="openEditModal"
        >
          <UIcon
            name="i-lucide-pencil"
            class="mr-1 h-4 w-4"
          />
          Redigera
        </UButton>
      </div>

      <!-- Hero Image -->
      <div
        class="relative aspect-[2/1] overflow-hidden rounded-xl bg-gray-100"
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

        <!-- In Week Plan Badge -->
        <div
          v-if="isInPlan"
          class="absolute bottom-4 right-4 rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-lg flex items-center gap-2"
        >
          <UIcon
            name="i-lucide-calendar-check"
            class="h-4 w-4"
          />
          I veckoplanen ({{ totalServingsInPlan }} portioner)
        </div>
      </div>

      <!-- Header -->
      <div>
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">
              {{ recipe.title }}
            </h1>
            <p class="mt-2 text-gray-600">
              {{ recipe.description }}
            </p>
          </div>
          <UBadge
            :class="difficulty.color"
            class="px-3 py-1 text-sm"
          >
            <UIcon
              :name="difficulty.icon"
              class="mr-1 h-4 w-4"
            />
            {{ difficulty.label }}
          </UBadge>
        </div>

        <!-- Meta -->
        <div class="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <div class="flex items-center gap-1">
            <UIcon
              name="i-lucide-clock"
              class="h-5 w-5"
            />
            <span>{{ totalTime }} min</span>
          </div>
          <div class="flex items-center gap-1">
            <UIcon
              name="i-lucide-chef-hat"
              class="h-5 w-5"
            />
            <span>{{ recipe.prepTime }} min förberedelse</span>
          </div>
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
          <div
            v-if="recipe.rating"
            class="flex items-center gap-1 text-amber-500"
          >
            <UIcon
              name="i-lucide-star"
              class="h-5 w-5 fill-current"
            />
            <span class="font-medium">{{ recipe.rating.toFixed(1) }}</span>
            <span class="text-gray-400">/ 5</span>
          </div>
        </div>

        <!-- Tags -->
        <div
          v-if="recipe.tags?.length"
          class="mt-4 flex flex-wrap gap-2"
        >
          <UBadge
            v-for="tag in recipe.tags"
            :key="tag"
            variant="subtle"
            color="gray"
          >
            {{ tag }}
          </UBadge>
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

      <!-- Content Grid -->
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Ingredients -->
        <div class="lg:col-span-1">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold">
                  Ingredienser
                </h2>
                <!-- Servings Adjuster (like Dinnia's portions picker) -->
                <div class="flex items-center gap-2">
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

            <ul class="space-y-3">
              <li
                v-for="ing in scaledIngredients"
                :key="ing.id"
                class="flex items-start gap-3"
              >
                <UIcon
                  name="i-lucide-check-circle"
                  class="mt-1 h-5 w-5 flex-shrink-0 text-emerald-500"
                />
                <div class="flex-1">
                  <span class="font-medium">{{ ing.scaledAmount }} {{ ing.unit }}</span>
                  <span class="text-gray-600"> {{ ing.ingredientTypeName || ing.ingredientTypeId }}</span>
                  <span
                    v-if="ing.notes"
                    class="text-gray-400"
                  > ({{ ing.notes }})</span>
                </div>
              </li>
            </ul>
          </UCard>
        </div>

        <!-- Instructions (with drag-and-drop like Dinnia) -->
        <div class="lg:col-span-2">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold">
                  Instruktioner
                </h2>
                <span class="text-sm text-gray-500">Dra för att ändra ordning</span>
              </div>
            </template>

            <draggable
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
                  <!-- Drag Handle -->
                  <div class="drag-handle cursor-grab text-gray-400 hover:text-gray-600">
                    <UIcon
                      name="i-lucide-grip-vertical"
                      class="h-5 w-5"
                    />
                  </div>

                  <!-- Step Number -->
                  <span class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                    {{ index + 1 }}
                  </span>

                  <!-- Step Text -->
                  <p class="flex-1 pt-1 text-gray-700">
                    {{ element }}
                  </p>
                </li>
              </template>
            </draggable>
          </UCard>

          <!-- Add to Week Plan Card -->
          <UCard class="mt-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-gray-900">
                  Vill du laga detta denna vecka?
                </h3>
                <p class="text-sm text-gray-500">
                  Lägg till i din veckoplan
                </p>
              </div>
              <UButton
                :color="isInPlan ? 'emerald' : 'primary'"
                @click="openWeekPlanModal"
              >
                <UIcon
                  :name="isInPlan ? 'i-lucide-calendar-check' : 'i-lucide-plus'"
                  class="mr-2 h-4 w-4"
                />
                {{ isInPlan ? 'Lägg till fler dagar' : 'Lägg till i veckoplanen' }}
              </UButton>
            </div>
          </UCard>
        </div>
      </div>
    </div>

    <!-- Edit Recipe Modal -->
    <UModal
      v-model:open="showEditModal"
      title="Redigera recept"
      size="lg"
    >
      <div class="space-y-6">
        <!-- Error -->
        <UAlert
          v-if="editError"
          color="error"
          variant="soft"
        >
          {{ editError }}
        </UAlert>
        
        <!-- Basic Info -->
        <div class="space-y-4">
          <UFormField
            label="Titel"
            required
          >
            <UInput
              v-model="editedRecipe.title"
              placeholder="Receptets namn"
              class="w-full"
            />
          </UFormField>
          
          <UFormField label="Beskrivning">
            <UTextarea
              v-model="editedRecipe.description"
              placeholder="Kort beskrivning av receptet"
              rows="2"
              class="w-full"
            />
          </UFormField>
          
          <UFormField label="Bild-URL">
            <UInput
              v-model="editedRecipe.imageUrl"
              placeholder="https://..."
              class="w-full"
            />
          </UFormField>
          
          <!-- Time and Servings Grid -->
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <UFormField label="Förbered (min)">
              <UInput
                v-model.number="editedRecipe.prepTime"
                type="number"
                min="0"
              />
            </UFormField>
            
            <UFormField label="Tillagning (min)">
              <UInput
                v-model.number="editedRecipe.cookTime"
                type="number"
                min="0"
              />
            </UFormField>
            
            <UFormField label="Portioner">
              <UInput
                v-model.number="editedRecipe.servings"
                type="number"
                min="1"
              />
            </UFormField>
            
            <UFormField label="Svårighetsgrad">
              <USelect
                v-model="editedRecipe.difficulty"
                :options="[
                  { label: 'Lätt', value: 'easy' },
                  { label: 'Medel', value: 'medium' },
                  { label: 'Svår', value: 'hard' }
                ]"
              />
            </UFormField>
            
            <UFormField label="Betyg (0-5)">
              <UInput
                v-model.number="editedRecipe.rating"
                type="number"
                min="0"
                max="5"
                step="0.5"
                placeholder="0-5"
              />
            </UFormField>
          </div>
          
          <!-- Source -->
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Källa (namn)">
              <UInput
                v-model="editedRecipe.sourceName"
                placeholder="T.ex. Allrecipes"
              />
            </UFormField>
            
            <UFormField label="Källa (URL)">
              <UInput
                v-model="editedRecipe.sourceUrl"
                placeholder="https://..."
              />
            </UFormField>
          </div>
        </div>
        
        <!-- Tags -->
        <div>
          <UFormField label="Taggar">
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="(tag, idx) in editedRecipe.tags"
                :key="tag"
                variant="subtle"
                class="pr-1"
              >
                {{ tag }}
                <button
                  class="ml-1 rounded p-0.5 hover:bg-gray-200"
                  @click="removeTag(idx)"
                >
                  <UIcon
                    name="i-lucide-x"
                    class="h-3 w-3"
                  />
                </button>
              </UBadge>
            </div>
            <div class="mt-2 flex gap-2">
              <UInput
                v-model="newTag"
                placeholder="Lägg till tagg..."
                class="flex-1"
                @keyup.enter="addTag"
              />
              <UButton
                size="sm"
                variant="outline"
                @click="addTag"
              >
                Lägg till
              </UButton>
            </div>
          </UFormField>
        </div>
        
        <!-- Ingredients -->
        <div>
          <div class="mb-3 flex items-center justify-between">
            <h3 class="font-medium">Ingredienser</h3>
            <UButton
              size="xs"
              variant="outline"
              @click="addIngredient"
            >
              <UIcon
                name="i-lucide-plus"
                class="mr-1 h-3 w-3"
              />
              Lägg till
            </UButton>
          </div>
          
          <div class="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-3">
            <div
              v-for="(ing, idx) in editedRecipe.ingredients"
              :key="idx"
              class="flex items-center gap-2"
            >
              <UInput
                v-model.number="ing.amount"
                type="number"
                step="0.1"
                min="0"
                placeholder="Mängd"
                class="w-20"
              />
              <USelect
                v-model="ing.unit"
                :options="[
                  { label: 'st', value: 'st' },
                  { label: 'g', value: 'g' },
                  { label: 'kg', value: 'kg' },
                  { label: 'ml', value: 'ml' },
                  { label: 'l', value: 'l' },
                  { label: 'msk', value: 'msk' },
                  { label: 'tsk', value: 'tsk' },
                  { label: 'krm', value: 'krm' }
                ]"
                class="w-20"
              />
              <USelect
                v-model="ing.ingredientTypeId"
                :options="[
                  { label: 'Välj...', value: '' },
                  ...(ingredientTypes?.map((it: IngredientType) => ({ label: it.name, value: it.id })) || [])
                ]"
                placeholder="Ingrediens"
                class="flex-1"
              />
              <UInput
                v-model="ing.notes"
                placeholder="Anteckning"
                class="w-28"
              />
              <UButton
                variant="ghost"
                color="error"
                size="xs"
                @click="removeIngredient(idx)"
              >
                <UIcon
                  name="i-lucide-trash-2"
                  class="h-4 w-4"
                />
              </UButton>
            </div>
            
            <p
              v-if="editedRecipe.ingredients.length === 0"
              class="py-4 text-center text-sm text-gray-500"
            >
              Inga ingredienser. Lägg till en ovan.
            </p>
          </div>
        </div>
        
        <!-- Instructions -->
        <div>
          <div class="mb-3 flex items-center justify-between">
            <h3 class="font-medium">Instruktioner</h3>
            <UButton
              size="xs"
              variant="outline"
              @click="addInstruction"
            >
              <UIcon
                name="i-lucide-plus"
                class="mr-1 h-3 w-3"
              />
              Lägg till
            </UButton>
          </div>
          
          <div class="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-3">
            <div
              v-for="(step, idx) in editedRecipe.instructions"
              :key="idx"
              class="flex items-start gap-2"
            >
              <span class="mt-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-medium text-emerald-700">
                {{ idx + 1 }}
              </span>
              <UTextarea
                v-model="editedRecipe.instructions[idx]"
                :rows="2"
                placeholder="Beskriv steget..."
                class="flex-1"
              />
              <UButton
                variant="ghost"
                color="error"
                size="xs"
                class="mt-1"
                @click="removeInstruction(idx)"
              >
                <UIcon
                  name="i-lucide-trash-2"
                  class="h-4 w-4"
                />
              </UButton>
            </div>
            
            <p
              v-if="editedRecipe.instructions.length === 0"
              class="py-4 text-center text-sm text-gray-500"
            >
              Inga instruktioner. Lägg till en ovan.
            </p>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            variant="ghost"
            @click="showEditModal = false"
          >
            Avbryt
          </UButton>
          <UButton
            color="primary"
            :loading="isSaving"
            @click="saveRecipe"
          >
            <UIcon
              name="i-lucide-save"
              class="mr-1 h-4 w-4"
            />
            Spara ändringar
          </UButton>
        </div>
      </template>
    </UModal>
    
    <!-- Week Plan Modal -->
    <UModal
      v-model:open="showWeekPlanModal"
      title="Lägg till i veckoplanen"
      size="sm"
    >
      <div class="space-y-6">
        <div>
          <label class="mb-3 block text-sm font-medium text-gray-700">Vilken dag?</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="(day, idx) in days"
              :key="day"
              class="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              :class="selectedDay === idx
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              @click="selectedDay = idx"
            >
              {{ day }}
            </button>
          </div>
        </div>

        <div>
          <label class="mb-3 block text-sm font-medium text-gray-700">Antal portioner</label>
          <div class="flex items-center gap-4">
            <UButton
              variant="outline"
              size="sm"
              :disabled="selectedServings <= 1"
              @click="selectedServings--"
            >
              -
            </UButton>
            <span class="w-16 text-center text-2xl font-bold">{{ selectedServings }}</span>
            <UButton
              variant="outline"
              size="sm"
              @click="selectedServings++"
            >
              +
            </UButton>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            variant="ghost"
            @click="showWeekPlanModal = false"
          >
            Avbryt
          </UButton>
          <UButton
            color="primary"
            @click="confirmAddToWeekPlan"
          >
            <UIcon
              name="i-lucide-plus"
              class="mr-1 h-4 w-4"
            />
            Lägg till
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
