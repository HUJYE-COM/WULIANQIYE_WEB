<script setup>
import { computed, ref } from 'vue'
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
})

const emit = defineEmits(['update:modelValue'])
const message = useMessage()
const input = ref(null)
const uploading = ref(false)
const progress = ref(0)

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
const remaining = computed(() => props.max - props.modelValue.length)
const previewSrc = ref('')

async function selectFiles(event) {
  const files = Array.from(event.target.files || [])
  event.target.value = ''
  if (!files.length) return
  if (files.length > remaining.value) {
    message.warning(`最多还能再添加 ${remaining.value} 张图片`)
  }

  uploading.value = true
  try {
    const next = [...props.modelValue]
    for (const file of files.slice(0, remaining.value)) {
      if (!allowedTypes.has(file.type)) {
        message.error(`${file.name} 不是 JPG、PNG、GIF 或 WebP 图片`)
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
      next.push({ file_id: uploaded.id, preview_url: getFilePreviewUrl(uploaded.id) })
      emit('update:modelValue', [...next])
    }
  } catch (error) {
    message.error(getErrorMessage(error))
  } finally {
    uploading.value = false
    progress.value = 0
  }
}

function remove(fileId) {
  emit(
    'update:modelValue',
    props.modelValue.filter((item) => item.file_id !== fileId),
  )
}
</script>

<template>
  <div class="image-upload">
    <div v-for="image in modelValue" :key="image.file_id" class="image-cell">
      <button class="preview-hit" type="button" @click="previewSrc = image.preview_url">
        <img :src="image.preview_url" alt="话题配图" />
      </button>
      <button class="remove-hit" type="button" aria-label="移除图片" @click="remove(image.file_id)">
        ×
      </button>
    </div>

    <button
      v-if="remaining > 0"
      class="add-cell"
      :disabled="uploading"
      type="button"
      @click="input?.click()"
    >
      <b v-if="!uploading">＋</b>
      <span v-if="uploading">{{ progress }}%</span>
      <span v-else>配图 {{ modelValue.length }}/{{ max }}</span>
    </button>

    <input
      ref="input"
      accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp"
      multiple
      type="file"
      @change="selectFiles"
    />
    <ImageLightbox :src="previewSrc" alt="话题配图" @close="previewSrc = ''" />
  </div>
</template>

<style scoped>
.image-upload {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.image-upload > input {
  display: none;
}

.image-cell {
  position: relative;
  width: 86px;
  height: 86px;
  overflow: hidden;
  border: 1px solid #c8bdb2;
  background: #e5e0d5;
}

.image-cell img {
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
  top: 0;
  right: 0;
  width: 21px;
  height: 21px;
  border: 0;
  background: rgba(41, 39, 36, 0.82);
  color: white;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}

.remove-hit:hover {
  background: #a21d18;
}

.add-cell {
  width: 86px;
  height: 86px;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  border: 1px dashed #bfae9e;
  background: #ebe7de;
  color: #8b7a6c;
  font: inherit;
  font-size: 10px;
  cursor: pointer;
}

.add-cell:hover:not(:disabled) {
  border-color: #a21d18;
  color: #a21d18;
}

.add-cell:disabled {
  cursor: wait;
}

.add-cell b {
  color: #a21d18;
  font-size: 22px;
  font-weight: 300;
}
</style>
