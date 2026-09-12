<script setup>
import { ref } from 'vue'
import { useMessage } from 'naive-ui'

import { getFileDownloadUrl, uploadFile } from '@/api/file'
import { getErrorMessage } from '@/constants/errorCodes'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])
const message = useMessage()
const input = ref(null)
const uploading = ref(false)
const progress = ref(0)
const typeNames = { image: '图', video: '影', audio: '音', other: '件' }
const extensionTypes = {
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image',
  mp4: 'video', webm: 'video', mov: 'video', m4v: 'video',
  mp3: 'audio', wav: 'audio', m4a: 'audio', aac: 'audio', ogg: 'audio', flac: 'audio',
  pdf: 'other', xls: 'other', xlsx: 'other', csv: 'other', doc: 'other', docx: 'other',
  ppt: 'other', pptx: 'other', txt: 'other', rtf: 'other', odt: 'other', ods: 'other',
}

function detectType(file) {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'audio'
  return extensionTypes[file.name.split('.').pop()?.toLowerCase()] || ''
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
        message.error(`${file.name} 不是支持的文件`)
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
      next.push({ file_id: uploaded.id, attachment_name: file.name, type })
      emit('update:modelValue', [...next])
    }
  } catch (error) {
    message.error(getErrorMessage(error))
  } finally {
    uploading.value = false
    progress.value = 0
  }
}

function updateName(index, name) {
  emit(
    'update:modelValue',
    props.modelValue.map((item, i) => (i === index ? { ...item, attachment_name: name } : item)),
  )
}

function remove(index) {
  emit(
    'update:modelValue',
    props.modelValue.filter((_, i) => i !== index),
  )
}
</script>

<template>
  <div class="box">
    <button :disabled="uploading" type="button" @click="input?.click()">
      {{ uploading ? `上传中 ${progress}%` : '＋ 添加证据附件' }}
    </button>
    <input
      ref="input"
      accept="image/*,video/*,audio/*,.pdf,.xls,.xlsx,.csv,.doc,.docx,.ppt,.pptx,.txt,.rtf,.odt,.ods"
      multiple
      type="file"
      @change="selectFiles"
    />
    <div v-for="(item, index) in modelValue" :key="item.file_id" class="row">
      <i>{{ typeNames[item.type] }}</i>
      <input :value="item.attachment_name" maxlength="255" @input="updateName(index, $event.target.value)" />
      <a :href="getFileDownloadUrl(item.file_id)" target="_blank">看</a>
      <button type="button" @click="remove(index)">删</button>
    </div>
    <p v-if="!modelValue.length">图片、录音、PDF 都可以，单件不超过 100M。</p>
  </div>
</template>

<style scoped>
.box {
  border: 1px solid #d8cabd;
  background: #f8f6ef;
}

.box > button {
  width: 100%;
  min-height: 44px;
  border: 0;
  border-bottom: 1px solid #e1d8cf;
  background: transparent;
  color: #a21d18;
  font-weight: 700;
}

.box > input {
  display: none;
}

.row {
  display: grid;
  align-items: center;
  grid-template-columns: 28px 1fr auto auto;
  gap: 8px;
  padding: 8px 10px;
}

.row i {
  display: grid;
  place-items: center;
  background: #eadbd6;
  color: #8f2924;
  font-size: 11px;
  font-style: normal;
}

.row input {
  min-width: 0;
  outline: 0;
  padding: 8px;
  border: 1px solid transparent;
  background: transparent;
  font-size: 13px;
}

.row a,
.row button {
  border: 0;
  background: transparent;
  color: #a21d18;
  font-size: 13px;
}

p {
  margin: 0;
  padding: 12px;
  color: #b1a195;
  font-size: 12px;
}
</style>
