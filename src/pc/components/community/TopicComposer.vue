<script setup>
import { computed, ref } from 'vue'

import TopicImageUpload from './TopicImageUpload.vue'

const props = defineProps({
  submit: {
    type: Function,
    required: true,
  },
  suggestions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['cancel'])

const maxTitle = 200
const maxContent = 5000
const maxTags = 5
const maxTagLength = 20

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
  if (tags.value.length >= maxTags) {
    tagError.value = `最多 ${maxTags} 个标签`
    return
  }
  if (/[\s#＃]/.test(tag)) {
    tagError.value = '标签不能包含空格或 #'
    return
  }
  if (tag.length > maxTagLength) {
    tagError.value = `单个标签不超过 ${maxTagLength} 字`
    return
  }
  if (tags.value.includes(tag)) {
    tagError.value = '该标签已添加'
    return
  }
  tags.value.push(tag)
  tagDraft.value = ''
}

function commitDraft() {
  addTag(tagDraft.value)
  tagDraft.value = ''
}

// 回车、空格、逗号都视为一个标签结束；退格在草稿为空时删掉上一个标签。
function handleTagKeydown(event) {
  if (['Enter', ' ', ',', '，'].includes(event.key)) {
    event.preventDefault()
    commitDraft()
    return
  }
  if (event.key === 'Backspace' && !tagDraft.value) {
    tags.value.pop()
  }
}

function removeTag(tag) {
  tags.value = tags.value.filter((item) => item !== tag)
  tagError.value = ''
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
    tagDraft.value = ''
    images.value = []
  } catch {
    // 失败时保留已填内容，错误提示由调用方负责
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="topic-composer" @submit.prevent="send">
    <div class="composer-heading">
      <span class="eyebrow">NEW THREAD</span>
      <h3>发起一个话题</h3>
      <button class="close" type="button" aria-label="收起" @click="emit('cancel')">×</button>
    </div>

    <label class="field">
      <span>话题标题</span>
      <input
        v-model="title"
        :maxlength="maxTitle"
        placeholder="一句话说清你要讨论什么"
        type="text"
      />
    </label>

    <label class="field">
      <span>话题正文</span>
      <textarea
        v-model="content"
        :maxlength="maxContent"
        placeholder="讲清时间、地点、经过与你掌握的材料；请勿泄露无关个人信息。"
        rows="6"
      ></textarea>
      <small class="counter">{{ content.length }} / {{ maxContent }}</small>
    </label>

    <div class="field">
      <span>话题标签</span>
      <div class="tag-editor" :class="{ invalid: tagError }">
        <button v-for="tag in tags" :key="tag" type="button" @click="removeTag(tag)">
          #{{ tag }}
          <i>×</i>
        </button>
        <input
          v-if="tags.length < maxTags"
          v-model="tagDraft"
          :maxlength="maxTagLength + 1"
          :placeholder="tags.length ? '继续添加' : '如 #拖欠工资，回车确认'"
          type="text"
          @keydown="handleTagKeydown"
          @blur="commitDraft"
        />
      </div>
      <small v-if="tagError" class="tag-error">{{ tagError }}</small>
      <small v-else class="tag-hint">
        1-5 个标签，回车或空格确认；标签决定别人能否搜到这个话题
      </small>

      <div v-if="unusedSuggestions.length" class="tag-suggestions">
        <small>常用：</small>
        <button
          v-for="tag in unusedSuggestions"
          :key="tag"
          type="button"
          @click="addTag(tag)"
        >
          #{{ tag }}
        </button>
      </div>
    </div>

    <div class="field">
      <span>话题配图</span>
      <TopicImageUpload v-model="images" />
    </div>

    <div class="composer-footer">
      <small>发布后所有人可见，请基于可核验事实发言。</small>
      <button class="cancel" type="button" @click="emit('cancel')">取消</button>
      <button class="send" type="submit" :disabled="!canSubmit || submitting">
        {{ submitting ? '发布中…' : '发布话题' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.topic-composer {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-bottom: 18px;
  padding: 22px 24px 20px;
  border: 2px solid #292724;
  background: #ebe7dc;
  box-shadow: 7px 7px 0 #292724;
}

.composer-heading {
  position: relative;
  padding-bottom: 13px;
  border-bottom: 2px solid #292724;
}

.eyebrow {
  color: #a21d18;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.22em;
}

.composer-heading h3 {
  margin: 6px 0 0;
  font-family: 'Songti SC', STSong, serif;
  font-size: 21px;
}

.close {
  position: absolute;
  top: -4px;
  right: 0;
  border: 0;
  background: transparent;
  color: #8d7d70;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

.close:hover {
  color: #a21d18;
}

.field {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field > span {
  color: #5f4e41;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.field input[type='text'],
.field textarea {
  width: 100%;
  outline: 0;
  padding: 10px 12px;
  border: 1px solid #d5cabf;
  background: #fdfbf5;
  color: #3d3732;
  font: inherit;
  font-size: 14px;
  line-height: 1.7;
}

.field textarea {
  resize: vertical;
}

.field input[type='text']:focus,
.field textarea:focus {
  border-color: #a21d18;
  box-shadow: 3px 3px 0 rgba(162, 29, 24, 0.14);
}

.counter {
  position: absolute;
  right: 2px;
  bottom: -15px;
  color: #a0907f;
  font-family: Georgia, serif;
  font-size: 11px;
}

.tag-editor {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  padding: 8px 10px;
  border: 1px solid #d5cabf;
  background: #fdfbf5;
}

.tag-editor.invalid {
  border-color: #a21d18;
}

.tag-editor:focus-within {
  border-color: #a21d18;
  box-shadow: 3px 3px 0 rgba(162, 29, 24, 0.14);
}

.tag-editor > button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 9px;
  border: 1px solid #d4bdb6;
  background: #eadbd6;
  color: #8f2924;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.tag-editor > button i {
  color: #b57772;
  font-style: normal;
}

.tag-editor > button:hover {
  border-color: #a21d18;
}

.tag-editor > input {
  min-width: 150px;
  flex: 1;
  outline: 0;
  padding: 4px 2px;
  border: 0;
  background: transparent;
  color: #3d3732;
  font: inherit;
  font-size: 13px;
}

.tag-hint,
.tag-error {
  font-size: 11px;
}

.tag-hint {
  color: #a0907f;
}

.tag-error {
  color: #a21d18;
  font-weight: 700;
}

.tag-suggestions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-suggestions small {
  color: #a0907f;
  font-size: 11px;
}

.tag-suggestions button {
  padding: 4px 8px;
  border: 1px dashed #c8bdb2;
  background: transparent;
  color: #7b6b5d;
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}

.tag-suggestions button:hover {
  border-color: #a21d18;
  color: #a21d18;
}

.composer-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px dashed #c8bdb2;
}

.composer-footer small {
  flex: 1;
  color: #a0907f;
  font-size: 11px;
}

.composer-footer button {
  padding: 10px 18px;
  border: 1px solid #292724;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}

.composer-footer .cancel {
  border-color: rgba(41, 39, 36, 0.4);
  background: transparent;
  color: #6d635a;
}

.composer-footer .cancel:hover {
  border-color: #292724;
  color: #292724;
}

.composer-footer .send {
  background: #292724;
  color: #f7f3ea;
  box-shadow: 3px 3px 0 rgba(162, 29, 24, 0.7);
}

.composer-footer .send:hover:not(:disabled) {
  background: #a21d18;
  box-shadow: 3px 3px 0 #292724;
}

.composer-footer .send:disabled {
  border-color: #bdb5ab;
  background: #cdc6bc;
  color: #f2efe8;
  box-shadow: none;
  cursor: not-allowed;
}

@media (max-width: 620px) {
  .composer-footer {
    flex-wrap: wrap;
  }

  .composer-footer small {
    width: 100%;
    flex: none;
  }
}
</style>
