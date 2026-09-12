<script setup>
import { ref } from 'vue'
import { useMessage } from 'naive-ui'

import { getFilePreviewUrl, uploadFile } from '@/api/file'
import { getErrorMessage } from '@/constants/errorCodes'
import ImageLightbox from '@/components/ImageLightbox.vue'

const props = defineProps({
  previewUrl: { type: String, default: '' },
})

const emit = defineEmits(['uploaded'])
const message = useMessage()
const input = ref(null)
const uploading = ref(false)
const progress = ref(0)
const previewSrc = ref('')
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

async function selectFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (!allowedTypes.has(file.type)) {
    message.error('封面仅支持 JPG、PNG、GIF 或 WebP')
    return
  }
  if (file.size > 100 * 1024 * 1024) {
    message.error('文件大小不能超过 100M')
    return
  }
  uploading.value = true
  progress.value = 0
  try {
    const uploaded = await uploadFile(file, (event) => {
      if (event.total) progress.value = Math.round((event.loaded / event.total) * 100)
    })
    emit('uploaded', { ...uploaded, preview_url: getFilePreviewUrl(uploaded.id) })
    message.success('封面上传成功')
  } catch (error) {
    message.error(getErrorMessage(error))
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="cover-wrap">
    <button
      class="cover"
      type="button"
      @click="props.previewUrl ? (previewSrc = props.previewUrl) : input?.click()"
    >
      <input
        ref="input"
        accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp"
        type="file"
        @change="selectFile"
      />
      <img v-if="previewUrl" :src="previewUrl" alt="封面预览" />
      <span v-else class="placeholder">
        <b>＋</b>
        <strong>点按上传封面</strong>
        <small>JPG / PNG / GIF / WebP</small>
      </span>
      <span v-if="uploading" class="mask">上传中 {{ progress }}%</span>
    </button>
    <button
      v-if="previewUrl && !uploading"
      class="tip"
      type="button"
      @click="input?.click()"
    >
      更换封面
    </button>
    <ImageLightbox :src="previewSrc" alt="封面预览" @close="previewSrc = ''" />
  </div>
</template>

<style scoped>
.cover-wrap {
  position: relative;
}

.cover {
  position: relative;
  width: 100%;
  height: 168px;
  overflow: hidden;
  padding: 0;
  border: 1px dashed #bfae9e;
  background: #e9e3d5;
}

.cover input {
  display: none;
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder,
.mask {
  height: 100%;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  color: #776558;
}

.placeholder b {
  color: #a21d18;
  font-size: 26px;
  font-weight: 300;
}

.placeholder strong {
  margin-top: 6px;
  font-size: 13px;
}

.placeholder small,
.tip {
  color: #ad9b8c;
  font-size: 11px;
}

.mask {
  position: absolute;
  inset: 0;
  background: rgba(41, 39, 36, 0.78);
  color: white;
}

.tip {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 4px 8px;
  border: 0;
  background: rgba(41, 39, 36, 0.8);
  color: white;
}
</style>
