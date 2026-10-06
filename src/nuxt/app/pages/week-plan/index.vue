<script setup lang="ts">
import type { Recipe, Store, StoreProduct, WeekPlan, WeekPlanRecipe } from '~/types'

interface RollingWeekPlan extends WeekPlan {
  planStartDate: string
  planEndDate: string
  today: string
}

interface CartIngredientBase {
  ingredientTypeId: string
  ingredientTypeName: string
  amount: number
  unit: string
  notes?: string
  sources: Array<{ recipeId: string, amount: number }>
}

interface MappedCartIngredient extends CartIngredientBase {
  storeProductId: string
  storeProductName: string
  brand?: string
  price: number
  totalPrice: number
  pricePerUnit?: number
}

interface UnmappedCartIngredient extends CartIngredientBase {
  category: string
}

interface CartSummary {
  storeId: string
  storeName: string
  totalMapped: number
  totalUnmapped: number
  estimatedPrice: number
  weekPlanId: string
  weekPlanName: string
}

interface GeneratedCartResult {
  success: boolean
  mappedIngredients: MappedCartIngredient[]
  unmappedIngredients: UnmappedCartIngredient[]
  summary: CartSummary
}

interface ProductSelection {
  ingredient: UnmappedCartIngredient
  products: StoreProduct[]
  selectedProduct: StoreProduct | null
}

const { data: weekPlan, refresh: refreshWeekPlan } = await useFetch<RollingWeekPlan>('/api/week-plan/current')
const { data: allRecipes } = await useFetch<Recipe[]>('/api/recipes')
const { data: stores } = await useFetch<Store[]>('/api/stores')

const showCartGenerator = ref(false)
const selectedDay = ref<number>(0)
const selectedStoreId = ref('')
const isGeneratingCart = ref(false)
const cartResult = ref<GeneratedCartResult | null>(null)

// Cart generation state
const mappedIngredients = ref<MappedCartIngredient[]>([])
const unmappedIngredients = ref<UnmappedCartIngredient[]>([])
const summary = ref<CartSummary | null>(null)
const selectedProducts = ref<Record<string, ProductSelection>>({})
const isSavingCart = ref(false)

// Modal state for adding recipe
const showAddModal = ref(false)
const addForm = ref({
  recipe: null as Recipe | null,
  mealType: 'dinner' as 'lunch' | 'dinner',
  servings: 4,
  person: ''
})

// Generate 9 days starting from today
const days = computed(() => {
  if (!weekPlan.value?.planStartDate) return []
  const start = new Date(weekPlan.value.planStartDate)
  return Array.from({ length: 9 }, (_, i) => {
    const date = new Date(start)
    date.setDate(date.getDate() + i)
    return {
      index: i,
      date,
      dayName: date.toLocaleDateString('sv-SE', { weekday: 'short' }),
      dayNum: date.getDate(),
      month: date.toLocaleDateString('sv-SE', { month: 'short' }),
      isToday: i === 0
    }
  })
})

function getRecipesForDayAndMeal(dayIndex: number, mealType: string): WeekPlanRecipe[] {
  if (!weekPlan.value?.recipes) return []
  return weekPlan.value.recipes.filter(recipe =>
    recipe.dayOfWeek === dayIndex && recipe.mealType === mealType
  )
}

function openAddForm(dayIndex: number, mealType: 'lunch' | 'dinner') {
  selectedDay.value = dayIndex
  addForm.value = {
    recipe: null,
    mealType,
    servings: 4,
    person: ''
  }
  showAddModal.value = true
}

async function addRecipeToWeek(recipe: Recipe) {
  if (!weekPlan.value) return

  try {
    await $fetch('/api/week-plan/recipes', {
      method: 'POST',
      body: {
        weekPlanId: weekPlan.value.id,
        recipeId: recipe.id,
        servings: addForm.value.servings || recipe.servings,
        dayOfWeek: selectedDay.value,
        mealType: addForm.value.mealType,
        person: addForm.value.person || null
      }
    })
    await refreshWeekPlan()
    showAddModal.value = false
  } catch (error) {
    console.error('Failed to add recipe:', error)
  }
}

async function removeRecipe(weekPlanRecipeId: string) {
  try {
    await $fetch(`/api/week-plan/recipes/${weekPlanRecipeId}`, {
      method: 'DELETE'
    })
    await refreshWeekPlan()
  } catch (error) {
    console.error('Failed to remove recipe:', error)
  }
}

async function openCartGenerator() {
  if (!stores?.value?.length) return
  selectedStoreId.value = stores.value[0]?.id || ''
  cartResult.value = null
  mappedIngredients.value = []
  unmappedIngredients.value = []
  summary.value = null
  selectedProducts.value = {}
  showCartGenerator.value = true
}

async function generateCart() {
  if (!weekPlan.value || !selectedStoreId.value) return

  isGeneratingCart.value = true
  try {
    const result = await $fetch<GeneratedCartResult>('/api/cart/generate', {
      method: 'POST',
      body: {
        weekPlanId: weekPlan.value.id,
        storeId: selectedStoreId.value
      }
    })

    cartResult.value = result
    mappedIngredients.value = result.mappedIngredients || []
    unmappedIngredients.value = result.unmappedIngredients || []
    summary.value = result.summary
  } catch (error) {
    console.error('Failed to generate cart:', error)
  } finally {
    isGeneratingCart.value = false
  }
}

async function searchProductForIngredient(ingredient: UnmappedCartIngredient): Promise<StoreProduct[]> {
  if (!selectedStoreId.value) return []

  try {
    const results = await $fetch<StoreProduct[]>('/api/stores/search', {
      method: 'POST',
      body: {
        storeId: selectedStoreId.value,
        searchQuery: ingredient.ingredientTypeName
      }
    })
    return results
  } catch (error) {
    console.error('Search failed:', error)
    return []
  }
}

async function addMappedProduct(ingredient: UnmappedCartIngredient) {
  const products = await searchProductForIngredient(ingredient)
  selectedProducts.value[ingredient.ingredientTypeId] = {
    ingredient,
    products,
    selectedProduct: null
  }
}

function selectProductForIngredient(ingredient: UnmappedCartIngredient, product: StoreProduct) {
  const selection = selectedProducts.value[ingredient.ingredientTypeId]
  if (!selection) return
  selection.selectedProduct = product
}

async function saveCart() {
  if (!weekPlan.value || !selectedStoreId.value) return

  isSavingCart.value = true
  try {
    const cart = await $fetch<{ id: string }>('/api/cart', {
      method: 'POST',
      body: {
        weekPlanId: weekPlan.value.id,
        storeId: selectedStoreId.value
      }
    })

    for (const ing of mappedIngredients.value) {
      await $fetch('/api/cart/add-item', {
        method: 'POST',
        body: {
          cartId: cart.id,
          ingredientTypeId: ing.ingredientTypeId,
          storeId: selectedStoreId.value,
          storeProductId: ing.storeProductId,
          quantity: ing.amount,
          unit: ing.unit,
          pricePerUnit: ing.pricePerUnit
        }
      })
    }

    for (const [ingredientTypeId, state] of Object.entries(selectedProducts.value)) {
      if (state.selectedProduct) {
        const ingredient = unmappedIngredients.value.find(i => i.ingredientTypeId === ingredientTypeId)
        if (ingredient) {
          await $fetch('/api/cart/add-item', {
            method: 'POST',
            body: {
              cartId: cart.id,
              ingredientTypeId,
              storeId: selectedStoreId.value,
              storeProductId: state.selectedProduct.id,
              quantity: ingredient.amount,
              unit: ingredient.unit
            }
          })
        }
      }
    }

    showCartGenerator.value = false
    navigateTo('/cart')
  } catch (error) {
    console.error('Failed to save cart:', error)
  } finally {
    isSavingCart.value = false
  }
}

const totalRecipes = computed(() => weekPlan.value?.recipes?.length || 0)
const allIngredientsMapped = computed(() => unmappedIngredients.value.length === 0)

function formatPrice(price: number): string {
  return (price || 0).toFixed(2) + ' kr'
}

const mealTypes = [
  { value: 'lunch', label: 'Lunch', icon: 'i-lucide-sun', color: 'amber' },
  { value: 'dinner', label: 'Middag', icon: 'i-lucide-moon', color: 'indigo' }
]

const selectedRecipeForAdd = ref<Recipe | null>(null)

function selectRecipeForAdd(recipe: Recipe) {
  selectedRecipeForAdd.value = recipe
  addForm.value.recipe = recipe
  addForm.value.servings = recipe.servings
}
</script>

<template>
  <div class="page-shell space-y-7">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
          Planera måltider
        </p>
        <h1 class="mt-1 text-3xl font-extrabold tracking-tight text-gray-950">
          Kommande 9 dagar
        </h1>
        <p class="text-sm text-gray-500">
          {{ weekPlan?.planStartDate ? new Date(weekPlan.planStartDate).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' }) : '' }}
        </p>
      </div>
    </div>

    <!-- Summary Card -->
    <UCard class="surface-card border-0">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
            <UIcon
              name="i-lucide-calendar-check"
              class="h-6 w-6 text-emerald-600"
            />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">
              {{ totalRecipes }}
            </p>
            <p class="text-sm text-gray-500">
              Måltider planerade
            </p>
          </div>
        </div>
        <UButton
          color="primary"
          :disabled="totalRecipes === 0"
          @click="openCartGenerator"
        >
          <UIcon
            name="i-lucide-shopping-cart"
            class="mr-2 h-4 w-4"
          />
          Skapa inköpslista
        </UButton>
      </div>
    </UCard>

    <!-- 9-Day Grid -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      <div
        v-for="day in days"
        :key="day.index"
        class="rounded-xl border-2 transition-all"
        :class="day.isToday
          ? 'border-emerald-400 bg-emerald-50/30'
          : 'border-gray-200 bg-gray-50/50'"
      >
        <!-- Day Header -->
        <div class="border-b border-gray-200 p-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span
                class="text-lg font-bold"
                :class="day.isToday ? 'text-emerald-600' : 'text-gray-900'"
              >
                {{ day.dayName }}
              </span>
              <UBadge
                v-if="day.isToday"
                variant="subtle"
                color="emerald"
                size="xs"
              >
                Idag
              </UBadge>
            </div>
            <span class="text-sm text-gray-500">{{ day.dayNum }} {{ day.month }}</span>
          </div>
        </div>

        <!-- Meal Types -->
        <div class="divide-y divide-gray-100">
          <div
            v-for="meal in mealTypes"
            :key="meal.value"
            class="p-3"
          >
            <!-- Meal Header -->
            <div class="mb-2 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon
                  :name="meal.icon"
                  class="h-4 w-4 text-gray-400"
                />
                <span class="text-sm font-medium text-gray-700">{{ meal.label }}</span>
              </div>
              <UBadge
                v-if="getRecipesForDayAndMeal(day.index, meal.value).length > 0"
                variant="subtle"
                :color="meal.color === 'amber' ? 'amber' : 'indigo'"
                size="xs"
              >
                {{ getRecipesForDayAndMeal(day.index, meal.value).length }}
              </UBadge>
            </div>

            <!-- Recipes -->
            <div class="space-y-2">
              <div
                v-for="recipe in getRecipesForDayAndMeal(day.index, meal.value)"
                :key="recipe.id"
                class="group relative rounded-lg bg-white p-2 shadow-sm"
              >
                <div class="flex gap-2">
                  <img
                    v-if="recipe.recipeImageUrl"
                    :src="recipe.recipeImageUrl"
                    class="h-10 w-10 rounded-md object-cover"
                  >
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-gray-900">
                      {{ recipe.recipeName }}
                    </p>
                    <p class="flex items-center gap-1 text-xs text-gray-500">
                      <span>{{ recipe.servings }} portioner</span>
                      <span
                        v-if="recipe.person"
                        class="text-emerald-600"
                      >• {{ recipe.person }}</span>
                    </p>
                  </div>
                  <button
                    class="opacity-0 transition-opacity group-hover:opacity-100"
                    @click="removeRecipe(recipe.id)"
                  >
                    <UIcon
                      name="i-lucide-x"
                      class="h-4 w-4 text-gray-400 hover:text-red-500"
                    />
                  </button>
                </div>
              </div>

              <!-- Add Button -->
              <button
                class="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-2 text-xs text-gray-400 transition-colors hover:border-emerald-400 hover:bg-white hover:text-emerald-600"
                @click="openAddForm(day.index, meal.value as 'lunch' | 'dinner')"
              >
                <UIcon
                  name="i-lucide-plus"
                  class="h-3 w-3"
                />
                Lägg till
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Recipe Modal -->
    <UModal
      v-model:open="showAddModal"
      title="Lägg till recept"
      size="lg"
    >
      <div class="space-y-4">
        <!-- Step 1: Select Recipe -->
        <div v-if="!selectedRecipeForAdd">
          <h3 class="mb-3 text-sm font-medium text-gray-700">
            Välj recept
          </h3>
          <UInput
            placeholder="Sök recept..."
            icon="i-lucide-search"
            class="mb-3 w-full"
          />
          <div class="grid max-h-[300px] gap-2 overflow-y-auto">
            <button
              v-for="recipe in allRecipes"
              :key="recipe.id"
              class="flex items-center gap-3 rounded-lg bg-gray-50 p-3 text-left transition-colors hover:bg-emerald-50"
              @click="selectRecipeForAdd(recipe)"
            >
              <img
                v-if="recipe.imageUrl"
                :src="recipe.imageUrl"
                class="h-10 w-10 rounded-md object-cover"
              >
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-gray-900">
                  {{ recipe.title }}
                </p>
                <p class="text-xs text-gray-500">
                  {{ recipe.prepTime + recipe.cookTime }} min
                </p>
              </div>
            </button>
          </div>
        </div>

        <!-- Step 2: Configure -->
        <div
          v-else
          class="space-y-4"
        >
          <div class="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
            <img
              v-if="selectedRecipeForAdd.imageUrl"
              :src="selectedRecipeForAdd.imageUrl"
              class="h-12 w-12 rounded-md object-cover"
            >
            <div class="flex-1">
              <p class="font-medium text-gray-900">
                {{ selectedRecipeForAdd.title }}
              </p>
              <p class="text-sm text-gray-500">
                {{ selectedRecipeForAdd.prepTime + selectedRecipeForAdd.cookTime }} min
              </p>
            </div>
            <UButton
              size="xs"
              variant="ghost"
              @click="selectedRecipeForAdd = null"
            >
              Ändra
            </UButton>
          </div>

          <!-- Servings -->
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Antal portioner</label>
            <UInputNumber
              v-model="addForm.servings"
              :min="1"
              :max="20"
              class="w-32"
            />
          </div>

          <!-- Person (optional) -->
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Person <span class="text-xs text-gray-400">(valfritt)</span>
            </label>
            <UInput
              v-model="addForm.person"
              placeholder="t.ex. Alla, Mamma, Pappa, Barn"
              class="w-full"
            />
            <p class="mt-1 text-xs text-gray-400">
              Lämna tomt om måltiden gäller alla
            </p>
          </div>
        </div>
      </div>

      <template
        v-if="selectedRecipeForAdd"
        #footer
      >
        <div class="flex justify-end gap-2">
          <UButton
            variant="ghost"
            @click="showAddModal = false"
          >
            Avbryt
          </UButton>
          <UButton
            color="primary"
            @click="addRecipeToWeek(selectedRecipeForAdd)"
          >
            Lägg till
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Cart Generator Modal -->
    <UModal
      v-model:open="showCartGenerator"
      title="Skapa inköpslista"
      size="xl"
    >
      <div class="space-y-6">
        <!-- Store Selection -->
        <div v-if="!cartResult">
          <h3 class="mb-3 text-sm font-medium text-gray-700">
            Välj butik
          </h3>
          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="store in stores"
              :key="store.id"
              class="rounded-lg border-2 p-4 text-center transition-all"
              :class="selectedStoreId === store.id
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200 hover:border-gray-300'"
              @click="selectedStoreId = store.id"
            >
              <p class="font-medium">
                {{ store.name }}
              </p>
            </button>
          </div>
          <div class="mt-4 flex justify-end">
            <UButton
              color="primary"
              :loading="isGeneratingCart"
              :disabled="!selectedStoreId"
              @click="generateCart"
            >
              Generera inköpslista
            </UButton>
          </div>
        </div>

        <!-- Cart Preview -->
        <div
          v-else
          class="space-y-6"
        >
          <!-- Summary -->
          <div class="rounded-lg bg-emerald-50 p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-emerald-900">
                  {{ summary?.storeName }}
                </p>
                <p class="text-sm text-emerald-700">
                  {{ summary?.totalMapped }} mappade •
                  {{ summary?.totalUnmapped }} omappade
                </p>
              </div>
              <div class="text-right">
                <p class="text-2xl font-bold text-emerald-900">
                  {{ formatPrice(summary?.estimatedPrice) }}
                </p>
                <p class="text-sm text-emerald-700">
                  Beräknad kostnad
                </p>
              </div>
            </div>
          </div>

          <!-- Unmapped Ingredients -->
          <div v-if="unmappedIngredients.length > 0">
            <h3 class="mb-3 flex items-center gap-2 text-sm font-medium text-amber-600">
              <UIcon
                name="i-lucide-alert-triangle"
                class="h-4 w-4"
              />
              Välj produkter för omappade ingredienser ({{ unmappedIngredients.length }})
            </h3>
            <div class="space-y-4">
              <div
                v-for="ingredient in unmappedIngredients"
                :key="ingredient.ingredientTypeId"
                class="rounded-lg border border-amber-200 bg-amber-50 p-4"
              >
                <div class="mb-3 flex items-center justify-between">
                  <div>
                    <p class="font-medium text-gray-900">
                      {{ ingredient.ingredientTypeName }}
                    </p>
                    <p class="text-sm text-gray-600">
                      {{ ingredient.amount }} {{ ingredient.unit }}
                    </p>
                  </div>
                  <UButton
                    size="xs"
                    variant="outline"
                    @click="addMappedProduct(ingredient)"
                  >
                    Välj produkt
                  </UButton>
                </div>

                <!-- Product Search/Selection -->
                <div
                  v-if="selectedProducts[ingredient.ingredientTypeId]"
                  class="mt-3"
                >
                  <div v-if="!selectedProducts[ingredient.ingredientTypeId].selectedProduct">
                    <div
                      v-if="selectedProducts[ingredient.ingredientTypeId].products.length > 0"
                      class="space-y-2"
                    >
                      <button
                        v-for="product in selectedProducts[ingredient.ingredientTypeId].products"
                        :key="product.id"
                        class="flex w-full items-center justify-between rounded-lg bg-white p-3 text-left transition-colors hover:bg-gray-50"
                        @click="selectProductForIngredient(ingredient, product)"
                      >
                        <div>
                          <p class="font-medium">
                            {{ product.name }}
                          </p>
                          <p class="text-sm text-gray-500">
                            {{ product.brand || 'Ingen märke' }}
                          </p>
                        </div>
                        <div class="text-right">
                          <p class="font-medium">
                            {{ formatPrice(product.price) }}
                          </p>
                          <p class="text-xs text-emerald-600">
                            {{ formatPrice(product.pricePerKg) }}/kg
                          </p>
                        </div>
                      </button>
                    </div>
                    <p
                      v-else
                      class="text-sm text-gray-500"
                    >
                      Inga produkter hittades
                    </p>
                  </div>
                  <div
                    v-else
                    class="flex items-center justify-between rounded-lg bg-white p-3"
                  >
                    <div>
                      <p class="font-medium">
                        {{ selectedProducts[ingredient.ingredientTypeId].selectedProduct.name }}
                      </p>
                      <p class="text-sm text-emerald-600">
                        {{ formatPrice(selectedProducts[ingredient.ingredientTypeId].selectedProduct.pricePerKg) }}/kg
                      </p>
                    </div>
                    <UButton
                      size="xs"
                      variant="ghost"
                      @click="selectedProducts[ingredient.ingredientTypeId].selectedProduct = null"
                    >
                      Ändra
                    </UButton>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Mapped Ingredients -->
          <div v-if="mappedIngredients.length > 0">
            <h3 class="mb-3 text-sm font-medium text-emerald-600">
              <UIcon
                name="i-lucide-check-circle"
                class="mr-1 inline h-4 w-4"
              />
              Mappade ingredienser ({{ mappedIngredients.length }})
            </h3>
            <div class="max-h-60 overflow-y-auto rounded-lg border">
              <div
                v-for="ingredient in mappedIngredients"
                :key="ingredient.ingredientTypeId"
                class="flex items-center justify-between border-b px-4 py-2 last:border-b-0"
              >
                <div>
                  <p class="text-sm font-medium">
                    {{ ingredient.ingredientTypeName }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ ingredient.storeProductName }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-medium">
                    {{ formatPrice(ingredient.totalPrice) }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ ingredient.amount }} {{ ingredient.unit }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template
        v-if="cartResult"
        #footer
      >
        <div class="flex justify-between">
          <UButton
            variant="ghost"
            @click="cartResult = null"
          >
            Byt butik
          </UButton>
          <div class="flex gap-2">
            <UButton
              variant="outline"
              @click="showCartGenerator = false"
            >
              Avbryt
            </UButton>
            <UButton
              color="primary"
              :loading="isSavingCart"
              :disabled="unmappedIngredients.length > 0 && !allIngredientsMapped"
              @click="saveCart"
            >
              Spara inköpslista ({{ formatPrice(summary?.estimatedPrice) }})
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
