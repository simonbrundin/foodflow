<script setup lang="ts">
import type { ProductMapping, IngredientType, Store, StoreProduct } from '~/types'

const search = ref('')
const showMapper = ref(false)
const selectedIngredient = ref<IngredientType | null>(null)

// Fetch all data
const { data: mappings, refresh: refreshMappings } = await useFetch<ProductMapping[]>('/api/mappings')
const { data: ingredients } = await useFetch<IngredientType[]>('/api/ingredient-types')
const { data: stores } = await useFetch<Store[]>('/api/stores')

// Get mapped ingredient IDs
const mappedIngredientIds = computed(() => {
  return new Set((mappings.value || []).map(m => m.ingredientTypeId))
})

// Get unmapped ingredients
const unmappedIngredients = computed(() => {
  return (ingredients.value || []).filter(
    ing => !mappedIngredientIds.value.has(ing.id)
  )
})

// Filter mapped ingredients for search
const filteredMappings = computed(() => {
  if (!search.value) return mappings.value || []
  const query = search.value.toLowerCase()
  return (mappings.value || []).filter(m =>
    m.ingredientTypeName?.toLowerCase().includes(query) ||
    m.storeProductName?.toLowerCase().includes(query) ||
    m.storeName?.toLowerCase().includes(query)
  )
})

// Group by ingredient
const mappingsByIngredient = computed(() => {
  const groups: Record<string, ProductMapping[]> = {}
  for (const mapping of filteredMappings.value) {
    const key = mapping.ingredientTypeId
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(mapping)
  }
  return groups
})

function openMapper(ingredient?: IngredientType) {
  selectedIngredient.value = ingredient || null
  showMapper.value = true
}

function closeMapper() {
  showMapper.value = false
  selectedIngredient.value = null
}

async function handleMappingSaved(mapping: ProductMapping) {
  await refreshMappings()
  closeMapper()
}

async function deleteMapping(id: string) {
  if (!confirm('Ta bort denna mappning?')) return
  
  try {
    await $fetch(`/api/mappings/${id}`, { method: 'DELETE' })
    await refreshMappings()
  } catch (error) {
    console.error('Failed to delete mapping:', error)
  }
}

const categoryLabels: Record<string, string> = {
  'grönsaker': 'Grönsaker',
  'frukt': 'Frukt',
  'mejeri': 'Mejeri',
  'kött': 'Kött',
  'fågel': 'Fågel',
  'fisk': 'Fisk',
  'pasta': 'Pasta',
  'spannmål': 'Spannmål',
  'kryddor': 'Kryddor',
  'öl': 'Örter',
  'sås': 'Sås',
  'baljväxt': 'Baljväxt',
  'annat': 'Övrigt'
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Produktmappningar</h1>
      <p class="mt-1 text-sm text-gray-500">
        Koppla ingredienser till produkter i butikerna
      </p>
    </div>

    <!-- Info Card -->
    <UCard class="border-blue-200 bg-blue-50">
      <div class="flex gap-4">
        <UIcon name="i-lucide-lightbulb" class="h-6 w-6 flex-shrink-0 text-blue-600" />
        <div>
          <h4 class="font-medium text-blue-900">Så fungerar mappningar</h4>
          <p class="mt-1 text-sm text-blue-700">
            När du skapar en inköpslista matchas ingredienser automatiskt mot produkter 
            i den valda butiken. Mappa ingredienser till produkter för att slippa välja 
            manuellt varje gång.
          </p>
        </div>
      </div>
    </UCard>

    <!-- Stats -->
    <div class="grid gap-4 md:grid-cols-3">
      <UCard>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <UIcon name="i-lucide-check" class="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">
              {{ mappings?.length || 0 }}
            </p>
            <p class="text-sm text-gray-500">Mappningar</p>
          </div>
        </div>
      </UCard>
      
      <UCard>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <UIcon name="i-lucide-alert-circle" class="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">
              {{ unmappedIngredients.length }}
            </p>
            <p class="text-sm text-gray-500">Omappade</p>
          </div>
        </div>
      </UCard>
      
      <UCard>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <UIcon name="i-lucide-store" class="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">
              {{ stores?.length || 0 }}
            </p>
            <p class="text-sm text-gray-500">Butiker</p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Search & Add -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <UInput
        v-model="search"
        placeholder="Sök ingrediens eller produkt..."
        icon="i-lucide-search"
        class="w-full sm:w-80"
      />
      
      <UButton color="primary" @click="openMapper()">
        <UIcon name="i-lucide-plus" class="mr-2 h-4 w-4" />
        Ny mappning
      </UButton>
    </div>

    <!-- Unmapped ingredients warning -->
    <UCard v-if="unmappedIngredients.length > 0" class="border-amber-200 bg-amber-50">
      <div class="flex items-start gap-4">
        <UIcon name="i-lucide-alert-triangle" class="h-6 w-6 flex-shrink-0 text-amber-600" />
        <div class="flex-1">
          <h4 class="font-medium text-amber-900">
            Ingredienser utan mappning ({{ unmappedIngredients.length }})
          </h4>
          <div class="mt-2 flex flex-wrap gap-2">
            <UButton
              v-for="ing in unmappedIngredients.slice(0, 10)"
              :key="ing.id"
              size="xs"
              variant="outline"
              color="amber"
              @click="openMapper(ing)"
            >
              {{ ing.name }}
            </UButton>
            <UBadge v-if="unmappedIngredients.length > 10" color="amber">
              +{{ unmappedIngredients.length - 10 }} till
            </UBadge>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Mappings list -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">Alla mappningar</h2>
      </template>

      <div v-if="filteredMappings.length === 0" class="py-8 text-center">
        <UIcon name="i-lucide-link" class="mx-auto h-12 w-12 text-gray-300" />
        <p class="mt-2 text-gray-500">Inga mappningar ännu</p>
        <UButton variant="outline" class="mt-4" @click="openMapper()">
          Skapa första mappningen
        </UButton>
      </div>

      <div v-else class="space-y-6">
        <div
          v-for="(ingredientMappings, ingredientId) in mappingsByIngredient"
          :key="ingredientId"
          class="rounded-lg border bg-gray-50 p-4"
        >
          <div class="mb-3 flex items-center justify-between">
            <h3 class="font-medium text-gray-900">
              {{ ingredientMappings[0]?.ingredientTypeName }}
            </h3>
            <UButton
              size="xs"
              variant="ghost"
              @click="openMapper(ingredients?.find(i => i.id === ingredientId))"
            >
              <UIcon name="i-lucide-plus" class="mr-1 h-3 w-3" />
              Lägg till
            </UButton>
          </div>
          
          <div class="space-y-2">
            <div
              v-for="mapping in ingredientMappings"
              :key="mapping.id"
              class="flex items-center justify-between rounded-lg bg-white p-3"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                  :class="{
                    'bg-yellow-400': mapping.storeName === 'Willys',
                    'bg-blue-600': mapping.storeName === 'ICA',
                    'bg-green-600': mapping.storeName === 'Coop'
                  }"
                >
                  {{ mapping.storeName?.charAt(0) }}
                </div>
                <div>
                  <p class="font-medium text-gray-900">{{ mapping.storeProductName }}</p>
                  <p class="text-sm text-gray-500">
                    {{ mapping.productBrand || 'Ingen märke' }} • 
                    {{ mapping.productPrice?.toFixed(2) }} kr •
                    {{ mapping.pricePerKg?.toFixed(2) }} kr/kg
                  </p>
                </div>
              </div>
              
              <div class="flex items-center gap-2">
                <UBadge v-if="mapping.isDefault" variant="subtle" color="emerald" size="sm">
                  Standard
                </UBadge>
                <UButton
                  variant="ghost"
                  size="xs"
                  color="error"
                  @click="deleteMapping(mapping.id)"
                >
                  <UIcon name="i-lucide-trash-2" class="h-4 w-4" />
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Product Mapper Modal -->
    <Teleport to="body">
      <div
        v-if="showMapper && stores && stores.length > 0"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      >
        <div class="w-full max-w-lg">
          <ProductMapper
            v-if="selectedIngredient"
            :ingredient-type="selectedIngredient"
            :stores="stores"
            :mappings="mappings || []"
            @saved="handleMappingSaved"
            @close="closeMapper"
          />
          <ProductSelector
            v-else
            :store-id="stores[0]?.id || ''"
            search-query=""
            @close="closeMapper"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>
