<script setup lang="ts">
import type { WeekPlan, Recipe, Store, ShoppingCart } from '~/types'

const { data: weekPlan, refresh: refreshWeekPlan } = await useFetch<WeekPlan>('/api/week-plan/current')
const { data: allRecipes } = await useFetch<Recipe[]>('/api/recipes')
const { data: stores } = await useFetch<Store[]>('/api/stores')

const showRecipePicker = ref(false)
const showCartGenerator = ref(false)
const selectedDay = ref<number | null>(null)
const selectedStoreId = ref('')
const isGeneratingCart = ref(false)
const cartResult = ref<any>(null)

// Cart generation state
const mappedIngredients = ref<any[]>([])
const unmappedIngredients = ref<any[]>([])
const summary = ref<any>(null)
const selectedProducts = ref<Record<string, any>>({})
const isSavingCart = ref(false)

const days = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag']

function getRecipesForDay(day: number) {
  if (!weekPlan.value?.recipes) return []
  return weekPlan.value.recipes.filter(r => r.dayOfWeek === day)
}

function openRecipePicker(day: number) {
  selectedDay.value = day
  showRecipePicker.value = true
}

async function addRecipeToWeek(recipe: Recipe) {
  if (!weekPlan.value) return
  
  try {
    await $fetch('/api/week-plan/recipes', {
      method: 'POST',
      body: {
        weekPlanId: weekPlan.value.id,
        recipeId: recipe.id,
        servings: recipe.servings,
        dayOfWeek: selectedDay.value
      }
    })
    await refreshWeekPlan()
    showRecipePicker.value = false
  } catch (error) {
    console.error('Failed to add recipe:', error)
  }
}

async function removeRecipe(recipeId: string) {
  // Would call DELETE /api/week-plan/recipes/:id
  console.log('Remove recipe:', recipeId)
  await refreshWeekPlan()
}

async function openCartGenerator() {
  if (!stores?.value?.length) return
  selectedStoreId.value = stores.value[0].id
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
    const result = await $fetch('/api/cart/generate', {
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

async function searchProductForIngredient(ingredient: any) {
  if (!selectedStoreId.value) return []
  
  try {
    const results = await $fetch('/api/stores/search', {
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

async function addMappedProduct(ingredient: any) {
  // Trigger product search
  const products = await searchProductForIngredient(ingredient)
  selectedProducts.value[ingredient.ingredientTypeId] = {
    ingredient,
    products,
    selectedProduct: null
  }
}

async function selectProductForIngredient(ingredient: any, product: any) {
  selectedProducts.value[ingredient.ingredientTypeId].selectedProduct = product
}

async function saveCart() {
  if (!weekPlan.value || !selectedStoreId.value) return
  
  isSavingCart.value = true
  try {
    // Create cart
    const cart = await $fetch('/api/cart', {
      method: 'POST',
      body: {
        weekPlanId: weekPlan.value.id,
        storeId: selectedStoreId.value
      }
    })
    
    // Add mapped items that already have products
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
    
    // Add selected products for unmapped
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
</script>

<template>
  <div class="page-shell space-y-7">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Planera veckan</p>
        <h1 class="mt-1 text-3xl font-extrabold tracking-tight text-gray-950">
          {{ weekPlan?.name || 'Veckan' }}
        </h1>
        <p class="text-sm text-gray-500">
          {{ weekPlan?.startDate ? new Date(weekPlan.startDate).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' }) : '' }}
          -
          {{ weekPlan?.endDate ? new Date(weekPlan.endDate).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' }) : '' }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <UButton variant="outline" size="sm">
          <UIcon name="i-lucide-chevron-left" class="h-4 w-4" />
        </UButton>
        <UButton variant="outline" size="sm">
          <UIcon name="i-lucide-chevron-right" class="h-4 w-4" />
        </UButton>
      </div>
    </div>

    <!-- Summary Card -->
    <UCard class="surface-card border-0">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
            <UIcon name="i-lucide-calendar-check" class="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">{{ totalRecipes }}</p>
            <p class="text-sm text-gray-500">Recept planerade</p>
          </div>
        </div>
        <UButton 
          color="primary"
          :disabled="totalRecipes === 0"
          @click="openCartGenerator"
        >
          <UIcon name="i-lucide-shopping-cart" class="mr-2 h-4 w-4" />
          Skapa inköpslista
        </UButton>
      </div>
    </UCard>

    <!-- Week Grid -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div
        v-for="(day, idx) in days"
        :key="day"
        class="min-h-[200px] rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-4 transition-colors hover:border-emerald-300"
      >
        <!-- Day Header -->
        <div class="mb-3 flex items-center justify-between">
          <h3 class="font-semibold text-gray-900">{{ day }}</h3>
          <UBadge v-if="getRecipesForDay(idx).length > 0" variant="subtle" color="emerald" size="sm">
            {{ getRecipesForDay(idx).length }}
          </UBadge>
        </div>

        <!-- Recipes for Day -->
        <div class="space-y-2">
          <div
            v-for="recipe in getRecipesForDay(idx)"
            :key="recipe.id"
            class="group relative rounded-lg bg-white p-3 shadow-sm"
          >
            <div class="flex gap-3">
              <img
                v-if="recipe.recipeImageUrl"
                :src="recipe.recipeImageUrl"
                class="h-12 w-12 rounded-md object-cover"
              >
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-gray-900">
                  {{ recipe.recipeName }}
                </p>
                <p class="text-xs text-gray-500">
                  {{ recipe.servings }} portioner
                </p>
              </div>
              <button
                class="opacity-0 transition-opacity group-hover:opacity-100"
                @click="removeRecipe(recipe.id)"
              >
                <UIcon name="i-lucide-x" class="h-4 w-4 text-gray-400 hover:text-red-500" />
              </button>
            </div>
          </div>
        </div>

        <!-- Add Button -->
        <button
          class="mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-2 text-sm text-gray-400 transition-colors hover:bg-white hover:text-emerald-600"
          @click="openRecipePicker(idx)"
        >
          <UIcon name="i-lucide-plus" class="h-4 w-4" />
          Lägg till recept
        </button>
      </div>
    </div>

    <!-- Recipe Picker Modal -->
    <UModal v-model:open="showRecipePicker" title="Välj recept" size="lg">
      <div class="space-y-4">
        <!-- Search -->
        <UInput
          placeholder="Sök recept..."
          icon="i-lucide-search"
          class="w-full"
        />

        <!-- Recipe Grid -->
        <div class="grid max-h-[400px] gap-3 overflow-y-auto sm:grid-cols-2">
          <button
            v-for="recipe in allRecipes"
            :key="recipe.id"
            class="flex items-center gap-3 rounded-lg bg-gray-50 p-3 text-left transition-colors hover:bg-emerald-50"
            @click="addRecipeToWeek(recipe)"
          >
            <img
              v-if="recipe.imageUrl"
              :src="recipe.imageUrl"
              class="h-12 w-12 rounded-md object-cover"
            >
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-900">{{ recipe.title }}</p>
              <p class="text-xs text-gray-500">{{ recipe.prepTime + recipe.cookTime }} min</p>
            </div>
          </button>
        </div>
      </div>

      <template #footer>
        <UButton variant="ghost" @click="showRecipePicker = false">
          Avbryt
        </UButton>
      </template>
    </UModal>

    <!-- Cart Generator Modal -->
    <UModal v-model:open="showCartGenerator" title="Skapa inköpslista" size="xl">
      <div class="space-y-6">
        <!-- Store Selection -->
        <div v-if="!cartResult">
          <h3 class="mb-3 text-sm font-medium text-gray-700">Välj butik</h3>
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
              <p class="font-medium">{{ store.name }}</p>
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
        <div v-else class="space-y-6">
          <!-- Summary -->
          <div class="rounded-lg bg-emerald-50 p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-emerald-900">{{ summary?.storeName }}</p>
                <p class="text-sm text-emerald-700">
                  {{ summary?.totalMapped }} mappade • 
                  {{ summary?.totalUnmapped }} omappade
                </p>
              </div>
              <div class="text-right">
                <p class="text-2xl font-bold text-emerald-900">
                  {{ formatPrice(summary?.estimatedPrice) }}
                </p>
                <p class="text-sm text-emerald-700">Beräknad kostnad</p>
              </div>
            </div>
          </div>

          <!-- Unmapped Ingredients -->
          <div v-if="unmappedIngredients.length > 0">
            <h3 class="mb-3 flex items-center gap-2 text-sm font-medium text-amber-600">
              <UIcon name="i-lucide-alert-triangle" class="h-4 w-4" />
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
                    <p class="font-medium text-gray-900">{{ ingredient.ingredientTypeName }}</p>
                    <p class="text-sm text-gray-600">
                      {{ ingredient.amount }} {{ ingredient.unit }}
                    </p>
                  </div>
                  <UButton size="xs" variant="outline" @click="addMappedProduct(ingredient)">
                    Välj produkt
                  </UButton>
                </div>

                <!-- Product Search/Selection -->
                <div v-if="selectedProducts[ingredient.ingredientTypeId]" class="mt-3">
                  <div v-if="!selectedProducts[ingredient.ingredientTypeId].selectedProduct">
                    <div v-if="selectedProducts[ingredient.ingredientTypeId].products.length > 0" class="space-y-2">
                      <button
                        v-for="product in selectedProducts[ingredient.ingredientTypeId].products"
                        :key="product.id"
                        class="flex w-full items-center justify-between rounded-lg bg-white p-3 text-left transition-colors hover:bg-gray-50"
                        @click="selectProductForIngredient(ingredient, product)"
                      >
                        <div>
                          <p class="font-medium">{{ product.name }}</p>
                          <p class="text-sm text-gray-500">{{ product.brand || 'Ingen märke' }}</p>
                        </div>
                        <div class="text-right">
                          <p class="font-medium">{{ formatPrice(product.price) }}</p>
                          <p class="text-xs text-emerald-600">{{ formatPrice(product.pricePerKg) }}/kg</p>
                        </div>
                      </button>
                    </div>
                    <p v-else class="text-sm text-gray-500">Inga produkter hittades</p>
                  </div>
                  <div v-else class="flex items-center justify-between rounded-lg bg-white p-3">
                    <div>
                      <p class="font-medium">{{ selectedProducts[ingredient.ingredientTypeId].selectedProduct.name }}</p>
                      <p class="text-sm text-emerald-600">
                        {{ formatPrice(selectedProducts[ingredient.ingredientTypeId].selectedProduct.pricePerKg) }}/kg
                      </p>
                    </div>
                    <UButton size="xs" variant="ghost" @click="selectedProducts[ingredient.ingredientTypeId].selectedProduct = null">
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
              <UIcon name="i-lucide-check-circle" class="mr-1 inline h-4 w-4" />
              Mappade ingredienser ({{ mappedIngredients.length }})
            </h3>
            <div class="max-h-60 overflow-y-auto rounded-lg border">
              <div
                v-for="ingredient in mappedIngredients"
                :key="ingredient.ingredientTypeId"
                class="flex items-center justify-between border-b px-4 py-2 last:border-b-0"
              >
                <div>
                  <p class="text-sm font-medium">{{ ingredient.ingredientTypeName }}</p>
                  <p class="text-xs text-gray-500">{{ ingredient.storeProductName }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-medium">{{ formatPrice(ingredient.totalPrice) }}</p>
                  <p class="text-xs text-gray-500">{{ ingredient.amount }} {{ ingredient.unit }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer v-if="cartResult">
        <div class="flex justify-between">
          <UButton variant="ghost" @click="cartResult = null">
            Byt butik
          </UButton>
          <div class="flex gap-2">
            <UButton variant="outline" @click="showCartGenerator = false">
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
