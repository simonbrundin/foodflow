<script setup lang="ts">
import type { ProductMapping, IngredientType, Store, StoreProduct } from '~/types'

interface Props {
  ingredientType: IngredientType
  stores: Store[]
  mappings: ProductMapping[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  saved: [mapping: ProductMapping]
  close: []
}>()

const selectedStoreId = ref(props.stores[0]?.id || '')
const searchQuery = ref(props.ingredientType.name)
const isSearching = ref(false)
const searchResults = ref<StoreProduct[]>([])
const selectedProduct = ref<StoreProduct | null>(null)

// Fetch mappings for this ingredient type
const { data: existingMappings } = await useFetch<ProductMapping[]>(
  `/api/mappings/${props.ingredientType.id}`
)

const hasMapping = computed(() => {
  return (storeId: string) => {
    return props.mappings.some(
      m => m.ingredientTypeId === props.ingredientType.id && m.storeId === storeId
    )
  }
})

const getMapping = computed(() => {
  return (storeId: string) => {
    return props.mappings.find(
      m => m.ingredientTypeId === props.ingredientType.id && m.storeId === storeId
    )
  }
})

async function searchProducts() {
  if (!selectedStoreId.value || !searchQuery.value) return
  
  isSearching.value = true
  try {
    const response = await $fetch<StoreProduct[]>('/api/stores/search', {
      method: 'POST',
      body: {
        storeId: selectedStoreId.value,
        searchQuery: searchQuery.value
      }
    })
    searchResults.value = response
  } catch (error) {
    console.error('Search failed:', error)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

async function saveMapping() {
  if (!selectedProduct.value || !selectedStoreId.value) return
  
  try {
    const mapping = await $fetch<ProductMapping>('/api/mappings', {
      method: 'POST',
      body: {
        ingredientTypeId: props.ingredientType.id,
        storeId: selectedStoreId.value,
        storeProductId: selectedProduct.value.id,
        isDefault: true
      }
    })
    emit('saved', mapping)
    selectedProduct.value = null
  } catch (error) {
    console.error('Failed to save mapping:', error)
  }
}

function selectProduct(product: StoreProduct) {
  selectedProduct.value = product
}
</script>

<template>
  <div class="rounded-lg border bg-white shadow-xl">
    <!-- Header -->
    <div class="flex items-center justify-between border-b px-6 py-4">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">
          Mappa: {{ ingredientType.name }}
        </h3>
        <p class="text-sm text-gray-500">
          Kategori: {{ ingredientType.category }}
        </p>
      </div>
      <button
        class="rounded-lg p-2 hover:bg-gray-100"
        @click="emit('close')"
      >
        <UIcon name="i-lucide-x" class="h-5 w-5 text-gray-500" />
      </button>
    </div>

    <div class="p-6">
      <!-- Store selector -->
      <div class="mb-4">
        <label class="mb-2 block text-sm font-medium text-gray-700">
          Välj butik
        </label>
        <USelect
          v-model="selectedStoreId"
          :options="stores.map(s => ({ label: s.name, value: s.id }))"
          class="w-full"
        />
      </div>

      <!-- Existing mappings -->
      <div v-if="existingMappings && existingMappings.length > 0" class="mb-4">
        <h4 class="mb-2 text-sm font-medium text-gray-700">Befintliga mappningar</h4>
        <div class="space-y-2">
          <div
            v-for="mapping in existingMappings"
            :key="mapping.id"
            class="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
          >
            <div>
              <span class="font-medium">{{ mapping.storeName }}</span>
              <span class="mx-2 text-gray-400">→</span>
              <span>{{ mapping.storeProductName }}</span>
            </div>
            <UBadge v-if="mapping.isDefault" color="emerald" size="sm">
              Standard
            </UBadge>
          </div>
        </div>
      </div>

      <!-- Search -->
      <div class="mb-4">
        <label class="mb-2 block text-sm font-medium text-gray-700">
          Sök produkt
        </label>
        <div class="flex gap-2">
          <UInput
            v-model="searchQuery"
            placeholder="Sök produkt..."
            class="flex-1"
            @keyup.enter="searchProducts"
          />
          <UButton
            color="primary"
            :loading="isSearching"
            @click="searchProducts"
          >
            Sök
          </UButton>
        </div>
      </div>

      <!-- Search results -->
      <div v-if="searchResults.length > 0" class="mb-4 space-y-2">
        <h4 class="text-sm font-medium text-gray-700">
          Resultat (sorterade på jämförelsepris)
        </h4>
        <div class="max-h-60 overflow-y-auto rounded-lg border">
          <button
            v-for="product in searchResults"
            :key="product.id"
            class="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-gray-50"
            :class="{ 'bg-emerald-50': selectedProduct?.id === product.id }"
            @click="selectProduct(product)"
          >
            <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-gray-100">
              <UIcon name="i-lucide-package" class="h-5 w-5 text-gray-400" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{{ product.name }}</p>
              <p v-if="product.brand" class="text-xs text-gray-500">{{ product.brand }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium">{{ product.price.toFixed(2) }} kr</p>
              <p class="text-xs text-emerald-600">{{ product.pricePerKg.toFixed(2) }} kr/kg</p>
            </div>
          </button>
        </div>
      </div>

      <!-- Selected product -->
      <div v-if="selectedProduct" class="rounded-lg bg-emerald-50 p-4">
        <h4 class="mb-2 text-sm font-medium text-emerald-800">Vald produkt</h4>
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-emerald-900">{{ selectedProduct.name }}</p>
            <p class="text-sm text-emerald-700">
              {{ selectedProduct.brand || 'Ingen märke' }} • 
              {{ selectedProduct.price.toFixed(2) }} kr/{{ selectedProduct.unit }} •
              {{ selectedProduct.pricePerKg.toFixed(2) }} kr/kg
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="flex justify-end gap-2 border-t px-6 py-4">
      <UButton variant="ghost" @click="emit('close')">
        Avbryt
      </UButton>
      <UButton
        color="primary"
        :disabled="!selectedProduct"
        @click="saveMapping"
      >
        Spara mappning
      </UButton>
    </div>
  </div>
</template>
