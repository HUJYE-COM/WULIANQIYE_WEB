<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useDialog, useMessage } from 'naive-ui'

import {
  createArticle,
  deleteArticle,
  getArticle,
  getMyArticles,
  publishArticle,
  updateArticle,
  withdrawArticle,
} from '@/api/article'
import { resolveApiUrl } from '@/api/file'
import { getErrorMessage } from '@/constants/errorCodes'
import AttachmentUpload from '@/mobile/components/upload/AttachmentUpload.vue'
import CoverUpload from '@/mobile/components/upload/CoverUpload.vue'
import MarkdownEditor from '@/mobile/components/submission/MarkdownEditor.vue'

const message = useMessage()
const dialog = useDialog()
const tab = ref('write')
const articles = ref([])
const total = ref(0)
const loadingList = ref(false)
const busy = ref(false)
const page = ref(1)
const pageSize = 10
const statusFilter = ref('')
const currentId = ref(null)
const currentStatus = ref('draft')
const errors = reactive({})
const presetTags = ['拖欠工资', '无休假日', '强制加班', '虚假招聘', '恶意裁员', '拖欠社保', '职场霸凌', '霸王条款']
const form = reactive({
  title: '',
  companyName: '',
  companyTags: [],
  content: '',
  coverFileId: 0,
  coverUrl: '',
  attachments: [],
})
const tagDraft = ref('')
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const isPublished = computed(() => currentStatus.value === 'published')

onMounted(loadArticles)
watch(statusFilter, () => {
  page.value = 1
  loadArticles()
})

async function loadArticles() {
  loadingList.value = true
  try {
    const data = await getMyArticles({
      page: page.value,
      page_size: pageSize,
      status: statusFilter.value || undefined,
    })
    articles.value = data.list
    total.value = data.total
  } catch (error) {
    message.error(getErrorMessage(error))
  } finally {
    loadingList.value = false
  }
}

function clearForm() {
  currentId.value = null
  currentStatus.value = 'draft'
  form.title = ''
  form.companyName = ''
  form.companyTags = []
  form.content = ''
  form.coverFileId = 0
  form.coverUrl = ''
  form.attachments = []
  Object.keys(errors).forEach((key) => delete errors[key])
}

async function selectArticle(article) {
  if (busy.value) return
  busy.value = true
  try {
    const detail = await getArticle(article.id)
    currentId.value = detail.id
    currentStatus.value = detail.status
    form.title = detail.title
    form.companyName = detail.company_name
    form.companyTags = detail.company_tags.split(',').map((tag) => tag.trim()).filter(Boolean)
    form.content = detail.content
    form.coverFileId = detail.cover_file_id
    form.coverUrl = resolveApiUrl(detail.cover_url)
    form.attachments = detail.attachments || []
    tab.value = 'write'
  } catch (error) {
    message.error(getErrorMessage(error))
  } finally {
    busy.value = false
  }
}

function handleCoverUploaded(file) {
  form.coverFileId = file.id
  form.coverUrl = resolveApiUrl(file.preview_url)
  errors.cover = ''
}

function addTag(raw) {
  const tag = String(raw).trim()
  if (!tag || form.companyTags.includes(tag)) return
  form.companyTags = [...form.companyTags, tag]
  tagDraft.value = ''
  errors.companyTags = ''
}

function validate() {
  errors.title = form.title.trim() ? '' : '请填写标题'
  errors.companyName = form.companyName.trim() ? '' : '请填写公司名'
  errors.companyTags = form.companyTags.length ? '' : '请至少添加一个标签'
  errors.cover = form.coverFileId ? '' : '请上传封面'
  errors.attachments = form.attachments.some((item) => !item.attachment_name.trim()) ? '附件名不能为空' : ''
  errors.content = form.content.trim() ? '' : '请填写正文'
  return !Object.values(errors).some(Boolean)
}

function buildPayload() {
  return {
    title: form.title.trim(),
    company_name: form.companyName.trim(),
    company_tags: form.companyTags.join(','),
    content: form.content,
    cover_file_id: form.coverFileId,
    attachments: form.attachments.map((item) => ({
      file_id: item.file_id,
      attachment_name: item.attachment_name.trim(),
      type: item.type,
    })),
  }
}

async function save({ silent = false } = {}) {
  if (!validate() || busy.value) return null
  busy.value = true
  try {
    const payload = buildPayload()
    const saved = currentId.value
      ? await updateArticle(currentId.value, payload)
      : await createArticle(payload)
    currentId.value = saved.id
    currentStatus.value = saved.status
    form.coverUrl = resolveApiUrl(saved.cover_url)
    if (!silent) message.success(saved.status === 'published' ? '修改已保存' : '草稿已保存')
    await loadArticles()
    return saved
  } catch (error) {
    message.error(getErrorMessage(error))
    return null
  } finally {
    busy.value = false
  }
}

async function publish() {
  const saved = await save({ silent: true })
  if (!saved) return
  busy.value = true
  try {
    await publishArticle(saved.id)
    currentStatus.value = 'published'
    message.success('投稿已发布')
    await loadArticles()
  } catch (error) {
    message.error(getErrorMessage(error))
  } finally {
    busy.value = false
  }
}

async function withdraw() {
  if (!currentId.value || busy.value) return
  busy.value = true
  try {
    await withdrawArticle(currentId.value)
    currentStatus.value = 'draft'
    message.success('已撤回为草稿')
    await loadArticles()
  } catch (error) {
    message.error(getErrorMessage(error))
  } finally {
    busy.value = false
  }
}

function confirmDelete() {
  if (!currentId.value) return
  dialog.warning({
    title: '删除投稿',
    content: '删除后无法恢复。',
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: remove,
  })
}

async function remove() {
  if (!currentId.value || busy.value) return
  busy.value = true
  try {
    await deleteArticle(currentId.value)
    message.success('投稿已删除')
    clearForm()
    await loadArticles()
  } catch (error) {
    message.error(getErrorMessage(error))
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="desk">
    <div class="switch">
      <button :class="{ on: tab === 'write' }" type="button" @click="tab = 'write'">写稿</button>
      <button :class="{ on: tab === 'list' }" type="button" @click="tab = 'list'">我的稿件</button>
    </div>

    <div v-if="tab === 'list'" class="list-pane">
      <div class="filters">
        <button
          v-for="option in [{ label: '全部', value: '' }, { label: '草稿', value: 'draft' }, { label: '已发布', value: 'published' }]"
          :key="option.value"
          :class="{ on: statusFilter === option.value }"
          type="button"
          @click="statusFilter = option.value"
        >
          {{ option.label }}
        </button>
      </div>
      <button
        v-for="article in articles"
        :key="article.id"
        class="item"
        type="button"
        @click="selectArticle(article)"
      >
        <img :src="resolveApiUrl(article.cover_url)" alt="" />
        <span>
          <b>{{ article.title }}</b>
          <small>{{ article.company_name }} · {{ article.status === 'published' ? '已发布' : '草稿' }}</small>
        </span>
      </button>
      <p v-if="!loadingList && !articles.length" class="empty">还没有稿件。</p>
      <div v-if="pageCount > 1" class="pager">
        <button :disabled="page === 1" type="button" @click="page -= 1; loadArticles()">上一页</button>
        <span>{{ page }}/{{ pageCount }}</span>
        <button :disabled="page === pageCount" type="button" @click="page += 1; loadArticles()">下一页</button>
      </div>
    </div>

    <form v-else class="form" @submit.prevent="save()">
      <small>{{ currentId ? `CASE #${currentId}` : 'NEW CASE' }} · {{ isPublished ? '已发布' : '草稿' }}</small>
      <input v-model="form.title" maxlength="200" placeholder="文章标题" />
      <small v-if="errors.title" class="err">{{ errors.title }}</small>
      <input v-model="form.companyName" maxlength="200" placeholder="公司全称" />
      <small v-if="errors.companyName" class="err">{{ errors.companyName }}</small>
      <div class="tag-box">
        <button v-for="tag in form.companyTags" :key="tag" type="button" @click="form.companyTags = form.companyTags.filter((item) => item !== tag)">
          {{ tag }} ×
        </button>
        <input
          v-model="tagDraft"
          placeholder="加标签，回车确认"
          @keydown.enter.prevent="addTag(tagDraft)"
        />
      </div>
      <div class="hints">
        <button v-for="tag in presetTags" :key="tag" type="button" @click="addTag(tag)">{{ tag }}</button>
      </div>
      <small v-if="errors.companyTags" class="err">{{ errors.companyTags }}</small>
      <CoverUpload :preview-url="form.coverUrl" @uploaded="handleCoverUploaded" />
      <small v-if="errors.cover" class="err">{{ errors.cover }}</small>
      <AttachmentUpload v-model="form.attachments" />
      <MarkdownEditor v-model="form.content" />
      <small v-if="errors.content" class="err">{{ errors.content }}</small>
      <div class="acts">
        <button v-if="currentId" type="button" @click="confirmDelete">删除</button>
        <button type="button" @click="clearForm">新开一份</button>
        <button v-if="isPublished" type="button" @click="withdraw">撤回</button>
        <button class="save" type="submit">{{ busy ? '处理中…' : '保存' }}</button>
        <button class="pub" type="button" @click="publish">{{ isPublished ? '更新发布' : '发布' }}</button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.switch,
.filters,
.acts {
  display: flex;
  gap: 8px;
}

.switch {
  margin-bottom: 14px;
}

.switch button,
.filters button,
.acts button,
.hints button,
.tag-box button {
  min-height: 36px;
  padding: 0 10px;
  border: 1px solid #d4cbbd;
  background: #f7f3ea;
  color: #6d635a;
  font-size: 13px;
}

.switch .on,
.filters .on {
  border-color: #292724;
  background: #292724;
  color: #f7f3ea;
}

.form,
.item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form input,
.tag-box {
  width: 100%;
  outline: 0;
  padding: 11px 12px;
  border: 1px solid #d5cabf;
  background: #fffdf8;
  font: inherit;
}

.tag-box {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-box input {
  min-width: 120px;
  flex: 1;
  padding: 0;
  border: 0;
}

.hints {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.item {
  flex-direction: row;
  align-items: center;
  width: 100%;
  margin-bottom: 8px;
  padding: 8px;
  text-align: left;
}

.item img {
  width: 64px;
  height: 48px;
  object-fit: cover;
}

.item span {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.item b {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item small,
.form > small,
.empty {
  color: #8a7b6e;
  font-size: 12px;
}

.err {
  color: #a21d18;
}

.acts {
  flex-wrap: wrap;
}

.acts .save,
.acts .pub {
  margin-left: auto;
  border-color: #292724;
  background: #292724;
  color: #f7f3ea;
  font-weight: 700;
}

.acts .pub {
  background: #a21d18;
  border-color: #a21d18;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 0;
}
</style>
