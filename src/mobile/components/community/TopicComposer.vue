<script setup>
import { computed, ref } from 'vue'

import ImageGridUpload from '@/mobile/components/upload/ImageGridUpload.vue'

const props = defineProps({
  submit: { type: Function, required: true },
  suggestions: { type: Array, default: () => [] },
})

const emit = defineEmits(['cancel'])
const title = ref('')
const content = ref('')
const tags = ref([])
const tagDraft = ref('')
const images = ref([])
const submitting = ref(false)
const tagError = ref('')
const canSubmit = computed(
  () => Boolean(title.value.trim()) && Boolean(content.value.trim()) && tags.value.length > 0,
)
const unusedSuggestions = computed(() =>
  props.suggestions.filter((tag) => !tags.value.includes(tag)).slice(0, 8),
)

function addTag(raw) {
  tagError.value = ''
  const tag = String(raw).replace(/^[#＃\s]+/, '').trim()
  if (!tag) return
  if (tags.value.length >= 5) {
    tagError.value = '最多 5 个标签'
    return
  }
  if (/[\s#＃]/.test(tag) || tag.length > 20) {
    tagError.value = '标签不能含空格或 #，且不超过 20 字'
    return
  }
  if (tags.value.includes(tag)) {
    tagError.value = '该标签已添加'
    return
  }
  tags.value.push(tag)
  tagDraft.value = ''
}

function handleTagKeydown(event) {
  if (['Enter', ' ', ',', '，'].includes(event.key)) {
    event.preventDefault()
    addTag(tagDraft.value)
  }
  if (event.key === 'Backspace' && !tagDraft.value) tags.value.pop()
}

async function send() {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true
  try {
    await props.submit({
      title: title.value.trim(),
      content: content.value.trim(),
      tags: [...tags.value],
      image_file_ids: images.value.map((image) => image.file_id),
      attachment_file_ids: [],
    })
    title.value = ''
    content.value = ''
    tags.value = []
    images.value = []
  } catch {
    // 保留已填内容
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="sheet" @submit.prevent="send">
    <header>
      <h3>发起话题</h3>
      <button type="button" @click="emit('cancel')">关闭</button>
    </header>
    <input v-model="title" maxlength="200" placeholder="一句话说清要讨论什么" />
    <textarea v-model="content" maxlength="5000" rows="5" placeholder="讲清经过与材料，勿泄露无关个人信息。"></textarea>
    <div class="tags">
      <button v-for="tag in tags" :key="tag" type="button" @click="tags = tags.filter((item) => item !== tag)">
        #{{ tag }} ×
      </button>
      <input
        v-if="tags.length < 5"
        v-model="tagDraft"
        placeholder="加标签，回车确认"
        @keydown="handleTagKeydown"
        @blur="addTag(tagDraft)"
      />
    </div>
    <small v-if="tagError" class="err">{{ tagError }}</small>
    <div v-if="unusedSuggestions.length" class="hints">
      <button v-for="tag in unusedSuggestions" :key="tag" type="button" @click="addTag(tag)">#{{ tag }}</button>
    </div>
    <ImageGridUpload v-model="images" />
    <button class="send" :disabled="!canSubmit || submitting" type="submit">
      {{ submitting ? '发布中…' : '发布话题' }}
    </button>
  </form>
</template>

<style scoped>
.sheet {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
  padding: 14px;
  border: 2px solid #292724;
  background: #ebe6d8;
}

header {
  display: flex;
  align-items: center;
}

h3 {
  margin: 0;
  font-family: 'Songti SC', STSong, serif;
  font-size: 20px;
}

header button {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: #8a7b6e;
}

input,
textarea {
  width: 100%;
  outline: 0;
  padding: 11px 12px;
  border: 1px solid #d5cabf;
  background: #fffdf8;
  font: inherit;
  font-size: 15px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px;
  border: 1px solid #d5cabf;
  background: #fffdf8;
}

.tags button,
.hints button {
  padding: 5px 8px;
  border: 1px solid #d4bdb6;
  background: #eadbd6;
  color: #8f2924;
  font-size: 12px;
}

.tags input {
  min-width: 120px;
  flex: 1;
  padding: 4px;
  border: 0;
}

.hints {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.hints button {
  background: transparent;
}

.err {
  color: #a21d18;
  font-size: 12px;
}

.send {
  min-height: 46px;
  border: 1px solid #292724;
  background: #292724;
  color: #f7f3ea;
  font-weight: 700;
}

.send:disabled {
  background: #cdc6bc;
  border-color: #cdc6bc;
}
</style>
