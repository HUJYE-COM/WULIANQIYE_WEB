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
      <path d="M3.6 10.2h3.6v10.2H3.6z" />
      <path
        d="M9 20.4V9.9l3.3-6a1.7 1.7 0 0 1 3.2.8v4.5h4a2 2 0 0 1 2 2.4l-1.4 7a2 2 0 0 1-2 1.6H9z"
      />
    </template>
    <template v-else-if="name === 'view'">
      <path
        d="M12 4.8C6.9 4.8 3 8.6 1.4 12 3 15.4 6.9 19.2 12 19.2s9-3.8 10.6-7.2C21 8.6 17.1 4.8 12 4.8zm0 11.4a4.2 4.2 0 1 1 0-8.4 4.2 4.2 0 0 1 0 8.4z"
      />
      <circle cx="12" cy="12" r="1.9" />
    </template>
    <template v-else-if="name === 'comment'">
      <path d="M3 3.6h18v12.6H9.9L3 21.3z" />
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
