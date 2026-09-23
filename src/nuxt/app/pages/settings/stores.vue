<script setup lang="ts">
import type { Store, StoreProduct } from '~/types'

const { data: stores } = await useFetch<Store[]>('/api/stores')

const selectedStore = ref<Store | null>(null)
const searchQuery = ref('')
const isSearching = ref(false)
const products = ref<StoreProduct[]>([])

// Chain colors
const chainColors: Record<string, string> = {
  willys: '#FFD600',
  ica: '#0069BA',
  coop: '#046A38',
  hemkop: '#E31E24',
  citygross: '#FF6600',
  netto: '#006BBE',
  lidl: '#003399'
}

const chainLogos: Record<string, string> = {
  willys: 'W',
  ica: 'I',
  coop: 'C',
  hemkop: 'H',
  citygross: 'CG',
  netto: 'N',
  lidl: 'L'
}

function selectStore(store: Store) {
  selectedStore.value = store
  searchQuery.value = ''
  products.value = []
}

async function searchProducts() {
  if (!selectedStore.value || !searchQuery.value) return
  
  isSearching.value = true
  try {
    const response = await $fetch<StoreProduct[]>('/api/stores/search', {
      method: 'POST',
      body: {
        storeId: selectedStore.value.id,
        searchQuery: searchQuery.value
      }
    })
    products.value = response
  } catch (error) {
    console.error('Search failed:', error)
    products.value = []
  } finally {
    isSearching.value = false
  }
}

function formatPrice(price: number): string {
  return price.toFixed(2) + ' kr'
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Butiker</h1>
      <p class="mt-1 text-sm text-gray-500">
        Hantera dina matbutiker och sök produkter
      </p>
    </div>

    <!-- Store Cards -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <UCard
        v-for="store in stores"
        :key="store.id"
        class="cursor-pointer transition-all hover:border-emerald-500 hover:shadow-md"
        :class="selectedStore?.id === store.id ? 'ring-2 ring-emerald-500' : ''"
        @click="selectStore(store)"
      >
        <div class="flex items-center gap-4">
          <div
            class="flex h-14 w-14 items-center justify-center rounded-xl font-bold text-white"
            :style="{ backgroundColor: chainColors[store.chainId] || '#666' }"
          >
            {{ chainLogos[store.chainId] || store.name.charAt(0) }}
          </div>
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900">{{ store.name }}</h3>
            <p class="text-sm text-gray-500 capitalize">{{ store.chainId }}</p>
          </div>
          <UIcon
            v-if="selectedStore?.id === store.id"
            name="i-lucide-check-circle"
            class="h-6 w-6 text-emerald-500"
          />
        </div>
      </UCard>
    </div>

    <!-- Store Details & Product Search -->
    <div v-if="selectedStore" class="grid gap-6 lg:grid-cols-2">
      <!-- Search -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg font-bold text-white"
              :style="{ backgroundColor: chainColors[selectedStore.chainId] || '#666' }"
            >
              {{ chainLogos[selectedStore.chainId] || selectedStore.name.charAt(0) }}
            </div>
            <div>
              <h2 class="font-semibold text-gray-900">Sök produkter</h2>
              <p class="text-sm text-gray-500">i {{ selectedStore.name }}</p>
            </div>
          </div>
        </template>

        <div class="space-y-4">
          <div class="flex gap-2">
            <UInput
              v-model="searchQuery"
              placeholder="t.ex. mjölk, pasta, ägg..."
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

          <!-- Quick search buttons -->
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="term in ['mjölk', 'pasta', 'ägg', 'ris', 'olivolja', 'kyckling']"
              :key="term"
              size="xs"
              variant="outline"
              @click="searchQuery = term; searchProducts()"
            >
              {{ term }}
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Results -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-gray-900">
            {{ products.length > 0 ? `Resultat (${products.length})` : 'Sökresultat' }}
          </h2>
        </template>

        <div v-if="products.length === 0" class="py-8 text-center">
          <UIcon name="i-lucide-search" class="mx-auto h-12 w-12 text-gray-300" />
          <p class="mt-2 text-gray-500">
            Sök efter produkter för att se resultat
          </p>
          <p class="mt-1 text-sm text-gray-400">
            Produkter sorteras efter jämförelsepris (kr/kg)
          </p>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="product in products"
            :key="product.id"
            class="flex items-center gap-3 rounded-lg border p-3"
          >
            <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
              <UIcon v-if="!product.imageUrl" name="i-lucide-package" class="h-6 w-6 text-gray-400" />
              <img v-else :src="product.imageUrl" class="h-12 w-12 rounded-lg object-cover" />
            </div>

            <div class="min-w-0 flex-1">
              <p class="truncate font-medium text-gray-900">{{ product.name }}</p>
              <p class="text-sm text-gray-500">
                {{ product.brand || 'Ingen märke' }}
                <span v-if="product.category" class="text-gray-400">• {{ product.category }}</span>
              </p>
            </div>

            <div class="text-right">
              <p class="font-medium text-gray-900">{{ formatPrice(product.price) }}</p>
              <p class="text-xs text-gray-500">{{ product.unit }}</p>
              <p class="text-sm font-medium text-emerald-600">
                {{ formatPrice(product.pricePerKg) }}/kg
              </p>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Empty state for stores -->
    <UCard v-if="!stores || stores.length === 0">
      <div class="py-8 text-center">
        <UIcon name="i-lucide-store" class="mx-auto h-16 w-16 text-gray-300" />
        <h3 class="mt-4 text-lg font-medium text-gray-900">Inga butiker</h3>
        <p class="mt-2 text-sm text-gray-500">
          Lägg till butiker för att kunna söka produkter
        </p>
      </div>
    </UCard>

    <!-- Info -->
    <UCard class="border-gray-200">
      <div class="flex gap-4">
        <UIcon name="i-lucide-info" class="h-6 w-6 flex-shrink-0 text-gray-400" />
        <div>
          <h4 class="font-medium text-gray-900">Om butikssökning</h4>
          <p class="mt-1 text-sm text-gray-600">
            Produkterna är förifyllda med exempeldata. För att få aktuella priser 
            behöver du koppla upp mot butikernas API:er eller scrapa deras hemsidor.
            Priser och tillgänglighet kan variera.
          </p>
        </div>
      </div>
    </UCard>
  </div>
</template>
