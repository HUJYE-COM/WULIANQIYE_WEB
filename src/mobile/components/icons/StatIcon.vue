<script setup>
defineProps({
  name: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <svg class="stat-icon" viewBox="0 0 24 24" aria-hidden="true">
    <template v-if="name === 'like'">
      <path d="M3.4 10h4v10.4h-4z" />
      <path d="M8.8 20.4V9.6l3.4-6.2a1.7 1.7 0 0 1 3.3.8V8.8H20a2 2 0 0 1 2 2.4l-1.5 7.2a2 2 0 0 1-2 1.6H8.8z" />
    </template>
    <template v-else-if="name === 'view'">
      <path d="M12 4.6C6.8 4.6 2.8 8.5 1.2 12 2.8 15.5 6.8 19.4 12 19.4s9.2-3.9 10.8-7.4C21.2 8.5 17.2 4.6 12 4.6zm0 11.6a4.2 4.2 0 1 1 0-8.4 4.2 4.2 0 0 1 0 8.4z" />
      <circle cx="12" cy="12" r="2" />
    </template>
    <template v-else-if="name === 'comment'">
      <path d="M3 3.4h18v13H9.6L3 21.6z" />
    </template>
  </svg>
</template>

<style scoped>
.stat-icon {
  width: 1em;
  height: 1em;
  flex-shrink: 0;
  fill: currentColor;
}
</style>
