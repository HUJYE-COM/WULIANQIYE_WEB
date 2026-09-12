<script setup>
import { ref } from 'vue'
import { useMessage } from 'naive-ui'

import { getFileDownloadUrl, uploadFile } from '@/api/file'
import { getErrorMessage } from '@/constants/errorCodes'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue'])
const message = useMessage()
const input = ref(null)
const uploading = ref(false)
const progress = ref(0)

const typeNames = {
  image: '图片',
  video: '视频',
  audio: '录音',
  other: '其他材料',
}

const extensionTypes = {
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  webp: 'image',
  mp4: 'video',
  webm: 'video',
  mov: 'video',
  m4v: 'video',
  mp3: 'audio',
  wav: 'audio',
  m4a: 'audio',
  aac: 'audio',
  ogg: 'audio',
  flac: 'audio',
  pdf: 'other',
  xls: 'other',
  xlsx: 'other',
  csv: 'other',
  doc: 'other',
  docx: 'other',
  ppt: 'other',
  pptx: 'other',
  txt: 'other',
  rtf: 'other',
  odt: 'other',
  ods: 'other',
}

function detectType(file) {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'audio'
  const extension = file.name.split('.').pop()?.toLowerCase()
  return extensionTypes[extension] || ''
}

async function selectFiles(event) {
  const files = Array.from(event.target.files || [])
  event.target.value = ''
  if (!files.length) return

  uploading.value = true
  try {
    const next = [...props.modelValue]
    for (const file of files) {
      const type = detectType(file)
      if (!type) {
        message.error(`${file.name} 不是支持的图片、视频、录音或办公文件`)
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
        attachment_name: file.name,
        type,
      })
      emit('update:modelValue', [...next])
    }
    if (next.length > props.modelValue.length) {
      message.success('附件上传成功')
    }
  } catch (error) {
    message.error(getErrorMessage(error))
  } finally {
    uploading.value = false
    progress.value = 0
  }
}

function updateName(index, name) {
  const next = props.modelValue.map((item, itemIndex) =>
    itemIndex === index ? { ...item, attachment_name: name } : item,
  )
  emit('update:modelValue', next)
}

function remove(index) {
  emit(
    'update:modelValue',
    props.modelValue.filter((_, itemIndex) => itemIndex !== index),
  )
}
</script>

<template>
  <div class="attachment-upload">
    <div class="attachment-toolbar">
      <div>
        <strong>证据附件</strong>
        <small>支持图片、视频、录音和 PDF、Excel 等办公文件，每个最大 100M</small>
      </div>
      <button :disabled="uploading" type="button" @click="input?.click()">
        {{ uploading ? `上传中 ${progress}%` : '＋ 添加附件' }}
      </button>
      <input
        ref="input"
        accept="image/*,video/*,audio/*,.pdf,.xls,.xlsx,.csv,.doc,.docx,.ppt,.pptx,.txt,.rtf,.odt,.ods"
        multiple
        type="file"
        @change="selectFiles"
      />
    </div>

    <div v-if="modelValue.length" class="attachment-list">
      <div v-for="(attachment, index) in modelValue" :key="attachment.file_id" class="attachment">
        <span class="type-badge" :class="attachment.type">{{ typeNames[attachment.type] }}</span>
        <input
          :value="attachment.attachment_name"
          maxlength="255"
          aria-label="附件名"
          @input="updateName(index, $event.target.value)"
        />
        <a :href="getFileDownloadUrl(attachment.file_id)" target="_blank">查看</a>
        <button type="button" @click="remove(index)">移除</button>
      </div>
    </div>
    <div v-else class="attachment-empty">尚未添加附件</div>
  </div>
</template>

<style scoped>
.attachment-upload {
  border: 1px solid #d8cabd;
  background: #f8f6ef;
}

.attachment-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
}

.attachment-toolbar > div {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.attachment-toolbar strong {
  color: #5f4e41;
  font-size: 11px;
}

.attachment-toolbar small {
  margin-top: 4px;
  color: #a08e7e;
  font-size: 9px;
}

.attachment-toolbar input {
  display: none;
}

.attachment-toolbar button {
  padding: 8px 12px;
  border: 1px solid #a21d18;
  background: transparent;
  color: #a21d18;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}

.attachment-toolbar button:disabled {
  cursor: wait;
  opacity: 0.5;
}

.attachment-list {
  border-top: 1px solid #e1d8cf;
}

.attachment {
  display: grid;
  align-items: center;
  grid-template-columns: 48px minmax(0, 1fr) auto auto;
  gap: 9px;
  padding: 9px 12px;
  border-bottom: 1px solid #eee7df;
}

.attachment:last-child {
  border-bottom: 0;
}

.type-badge {
  padding: 4px 5px;
  background: #e7ded3;
  color: #766457;
  font-size: 9px;
  text-align: center;
}

.type-badge.video {
  background: #ddd9e6;
  color: #5c526d;
}

.type-badge.audio {
  background: #dce5dc;
  color: #506351;
}

.type-badge.other {
  background: #e5dfd1;
  color: #6b5d3e;
}

.attachment input {
  min-width: 0;
  outline: none;
  padding: 7px 9px;
  border: 1px solid transparent;
  background: transparent;
  color: #4a3b31;
  font-size: 10px;
}

.attachment input:focus {
  border-color: #d8cabd;
  background: white;
}

.attachment a,
.attachment button {
  border: 0;
  background: transparent;
  color: #a21d18;
  font-size: 9px;
  text-decoration: none;
  cursor: pointer;
}

.attachment-empty {
  padding: 13px 16px;
  border-top: 1px solid #e1d8cf;
  color: #b1a195;
  font-size: 9px;
}

@media (max-width: 620px) {
  .attachment {
    grid-template-columns: 44px minmax(0, 1fr) auto;
  }

  .attachment a {
    display: none;
  }
}
</style>
