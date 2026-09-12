<script setup>
import { ref } from 'vue'
import { useMessage } from 'naive-ui'

import { getFilePreviewUrl, uploadFile } from '@/api/file'
import { getErrorMessage } from '@/constants/errorCodes'
import ImageLightbox from '@/components/ImageLightbox.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  max: {
    type: Number,
    default: 9,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])
const message = useMessage()
const input = ref(null)
const uploading = ref(false)
const progress = ref(0)

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

async function selectFiles(event) {
  const files = Array.from(event.target.files || [])
  event.target.value = ''
  if (!files.length || props.disabled) return

  const remaining = props.max - props.modelValue.length
  if (remaining <= 0) {
    message.error(`最多上传 ${props.max} 张图片`)
    return
  }

  uploading.value = true
  try {
    const next = [...props.modelValue]
    for (const file of files.slice(0, remaining)) {
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
      next.push({
        file_id: uploaded.id,
        url: getFilePreviewUrl(uploaded.id),
        name: file.name,
      })
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
    props.modelValue.filter((_, itemIndex) => itemIndex !== index),
  )
}

const previewSrc = ref('')

function openPreview(image) {
  previewSrc.value = image.url
}

</script>

<template>
  <div class="image-upload">
    <div class="image-grid">
      <div v-for="(image, index) in modelValue" :key="image.file_id" class="image-tile">
        <button class="preview-hit" type="button" @click="openPreview(image)">
          <img :src="image.url" :alt="image.name || '建议配图'" />
        </button>
        <button class="remove-hit" type="button" aria-label="移除图片" @click="remove(index)">
          ×
        </button>
      </div>

      <button
        v-if="modelValue.length < max"
        class="add-tile"
        :disabled="disabled || uploading"
        type="button"
        @click="input?.click()"
      >
        <b>＋</b>
        <strong>{{ uploading ? `上传中 ${progress}%` : '添加图片' }}</strong>
        <small>JPG / PNG / GIF / WebP</small>
      </button>
    </div>
    <input
      ref="input"
      accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp"
      multiple
      type="file"
      @change="selectFiles"
    />
    <ImageLightbox :src="previewSrc" alt="建议配图" @close="previewSrc = ''" />
  </div>
</template>

<style scoped>
.image-upload input {
  display: none;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
  gap: 10px;
}

.image-tile,
.add-tile {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border: 1px dashed #bfae9e;
  background: #e9e5dc;
}

.image-tile img {
  width: 100%;
  height: 100%;
  display: block;
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
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  border: 0;
  background: rgba(41, 39, 36, 0.82);
  color: white;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}

.add-tile {
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  color: #776558;
  cursor: pointer;
}

.add-tile:disabled {
  cursor: wait;
  opacity: 0.55;
}

.add-tile b {
  color: #a21d18;
  font-size: 22px;
  font-weight: 300;
}

.add-tile strong {
  margin-top: 4px;
  font-size: 11px;
}

.add-tile small {
  margin-top: 4px;
  color: #ad9b8c;
  font-size: 9px;
}
</style>
