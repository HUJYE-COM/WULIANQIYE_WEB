<script setup>
import { computed, ref } from 'vue'
import { useMessage } from 'naive-ui'

import { getFilePreviewUrl, resolveApiUrl, uploadFile } from '@/api/file'
import { getErrorMessage } from '@/constants/errorCodes'
import ImageLightbox from '@/components/ImageLightbox.vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  max: { type: Number, default: 9 },
  disabled: { type: Boolean, default: false },
  urlKey: { type: String, default: 'preview_url' },
})

const emit = defineEmits(['update:modelValue'])
const message = useMessage()
const input = ref(null)
const uploading = ref(false)
const progress = ref(0)
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
const remaining = computed(() => props.max - props.modelValue.length)
const previewSrc = ref('')

function previewOf(image) {
  return resolveApiUrl(image[props.urlKey] || image.preview_url || image.url)
}

async function selectFiles(event) {
  const files = Array.from(event.target.files || [])
  event.target.value = ''
  if (!files.length || props.disabled) return
  if (remaining.value <= 0) {
    message.error(`最多上传 ${props.max} 张`)
    return
  }
  uploading.value = true
  try {
    const next = [...props.modelValue]
    for (const file of files.slice(0, remaining.value)) {
      if (!allowedTypes.has(file.type)) {
        message.error(`${file.name} 仅支持 JPG、PNG、GIF 或 WebP`)
        continue
      }
      if (file.size > 100 * 1024 * 1024) {
        message.error(`${file.name} 超过 100M`)
        continue
      }
      progress.value = 0
      const uploaded = await uploadFile(file, (event) => {
        if (event.total) progress.value = Math.round((event.loaded / event.total) * 100)
      })
      const url = getFilePreviewUrl(uploaded.id)
      next.push({ file_id: uploaded.id, preview_url: url, url, name: file.name })
      emit('update:modelValue', [...next])
    }
  } catch (error) {
    message.error(getErrorMessage(error))
  } finally {
    uploading.value = false
    progress.value = 0
  }
}

function remove(index) {
  emit(
    'update:modelValue',
    props.modelValue.filter((_, i) => i !== index),
  )
}
</script>

<template>
  <div class="grid">
    <div v-for="(image, index) in modelValue" :key="image.file_id" class="tile">
      <button class="preview-hit" type="button" @click="previewSrc = previewOf(image)">
        <img :src="previewOf(image)" alt="" />
      </button>
      <button class="remove-hit" type="button" aria-label="移除" @click="remove(index)">×</button>
    </div>
    <button
      v-if="remaining > 0"
      class="add"
      :disabled="disabled || uploading"
      type="button"
      @click="input?.click()"
    >
      <b>＋</b>
      <span>{{ uploading ? `${progress}%` : `${modelValue.length}/${max}` }}</span>
    </button>
    <input
      ref="input"
      accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp"
      multiple
      type="file"
      @change="selectFiles"
    />
    <ImageLightbox :src="previewSrc" @close="previewSrc = ''" />
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.grid > input {
  display: none;
}

.tile,
.add {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border: 1px solid #d4cbbd;
  background: #e9e3d5;
}

.tile img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-hit {
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: zoom-in;
}

.remove-hit {
  position: absolute;
  z-index: 1;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border: 0;
  background: rgba(41, 39, 36, 0.82);
  color: white;
}

.add {
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  color: #8b7a6c;
}

.add b {
  color: #a21d18;
  font-size: 22px;
  font-weight: 300;
}
</style>
