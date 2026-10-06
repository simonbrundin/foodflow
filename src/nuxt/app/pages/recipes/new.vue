<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

useSeoMeta({
  title: 'Nytt recept — Foodflow',
  description: 'Skapa ett nytt recept'
})
</script>

<template>
  <div class="page-shell">
    <RecipeImport />
  </div>
</template>
