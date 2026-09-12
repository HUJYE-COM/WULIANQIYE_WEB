<script setup>
import { ref } from 'vue'
import { useMessage } from 'naive-ui'

import { getFilePreviewUrl, uploadFile } from '@/api/file'
import { getErrorMessage } from '@/constants/errorCodes'

defineProps({
  previewUrl: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['uploaded'])
const message = useMessage()
const input = ref(null)
const uploading = ref(false)
const progress = ref(0)

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
      if (event.total) {
        progress.value = Math.round((event.loaded / event.total) * 100)
      }
    })
    emit('uploaded', {
      ...uploaded,
      preview_url: getFilePreviewUrl(uploaded.id),
    })
    message.success('封面上传成功')
  } catch (error) {
    message.error(getErrorMessage(error))
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <button class="cover-upload" type="button" @click="input?.click()">
    <input
      ref="input"
      accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp"
      type="file"
      @change="selectFile"
    />
    <img v-if="previewUrl" :src="previewUrl" alt="投稿封面预览" />
    <span v-else class="cover-placeholder">
      <b>＋</b>
      <strong>上传曝光封面</strong>
      <small>JPG / PNG / GIF / WebP，最大 100M</small>
    </span>
    <span v-if="uploading" class="upload-mask">
      正在上传 {{ progress }}%
      <i><b :style="{ width: `${progress}%` }"></b></i>
    </span>
    <span v-else-if="previewUrl" class="replace-tip">点击更换封面</span>
  </button>
</template>

<style scoped>
.cover-upload {
  position: relative;
  width: 100%;
  height: 190px;
  overflow: hidden;
  padding: 0;
  border: 1px dashed #bfae9e;
  border-radius: 2px;
  background: #e9e5dc;
  cursor: pointer;
}

.cover-upload input {
  display: none;
}

.cover-upload img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.cover-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  color: #776558;
}

.cover-placeholder b {
  color: #a21d18;
  font-size: 28px;
  font-weight: 300;
}

.cover-placeholder strong {
  margin-top: 7px;
  font-size: 12px;
}

.cover-placeholder small {
  margin-top: 5px;
  color: #ad9b8c;
  font-size: 9px;
}

.replace-tip {
  position: absolute;
  right: 10px;
  bottom: 10px;
  padding: 6px 9px;
  background: rgba(41, 39, 36, 0.82);
  color: white;
  font-size: 9px;
}

.upload-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  background: rgba(41, 39, 36, 0.84);
  color: white;
  font-size: 11px;
}

.upload-mask i {
  width: 55%;
  height: 3px;
  overflow: hidden;
  margin-top: 12px;
  background: rgba(255, 255, 255, 0.2);
}

.upload-mask i b {
  height: 100%;
  display: block;
  background: #ef6c62;
}
</style>
