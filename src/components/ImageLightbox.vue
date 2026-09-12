<script setup>
import { onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  src: {
    type: String,
    default: '',
  },
  alt: {
    type: String,
    default: '图片预览',
  },
})

const emit = defineEmits(['close'])

function close() {
  emit('close')
}

function onKey(event) {
  if (event.key === 'Escape') close()
}

watch(
  () => props.src,
  (src) => {
    if (typeof document === 'undefined') return
    if (src) {
      window.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
    } else {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  if (typeof document !== 'undefined') document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="src"
      class="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="图片预览"
      @click="close"
    >
      <img :src="src" :alt="alt" @click.stop />
      <button type="button" aria-label="关闭" @click="close">×</button>
    </div>
  </Teleport>
</template>

<style scoped>
.lightbox {
  position: fixed;
  z-index: 5000;
  inset: 0;
  display: grid;
  padding: max(48px, calc(12px + env(safe-area-inset-top))) 12px
    max(24px, calc(12px + env(safe-area-inset-bottom)));
  place-items: center;
  background: rgba(24, 22, 20, 0.88);
  cursor: zoom-out;
  touch-action: manipulation;
}

.lightbox img {
  max-width: 100%;
  max-height: 100%;
  border: 3px solid #f2f0e9;
  object-fit: contain;
  cursor: default;
}

.lightbox button {
  position: absolute;
  top: max(10px, env(safe-area-inset-top));
  right: max(12px, env(safe-area-inset-right));
  width: 44px;
  height: 44px;
  border: 0;
  background: transparent;
  color: #f2f0e9;
  font-size: 32px;
  line-height: 1;
  cursor: pointer;
}
</style>
