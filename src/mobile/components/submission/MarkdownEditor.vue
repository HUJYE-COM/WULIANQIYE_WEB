<script setup>
import { MdEditor } from 'md-editor-v3'
import { useMessage } from 'naive-ui'
import 'md-editor-v3/lib/style.css'

import { getFilePreviewUrl, uploadFile } from '@/api/file'
import { getErrorMessage } from '@/constants/errorCodes'

defineProps({
  modelValue: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])
const message = useMessage()
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

async function uploadImages(files, callback) {
  try {
    const urls = []
    for (const file of files) {
      if (!allowedImageTypes.has(file.type)) {
        throw new Error('图片仅支持 JPG、PNG、GIF 或 WebP')
      }
      const uploaded = await uploadFile(file)
      urls.push(getFilePreviewUrl(uploaded.id))
    }
    callback(urls)
  } catch (error) {
    message.error(getErrorMessage(error))
  }
}
</script>

<template>
  <MdEditor
    :model-value="modelValue"
    language="zh-CN"
    :preview="false"
    :toolbars="['bold', 'title', 'quote', 'unorderedList', 'image', 'link']"
    :on-upload-img="uploadImages"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>

<style scoped>
:deep(.md-editor) {
  height: 280px;
  border: 1px solid #d8cabd;
  background: #f8f6ef;
}

:deep(.md-editor-toolbar-wrapper),
:deep(.md-editor-footer) {
  background: #eee9df;
}
</style>
