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
import AttachmentUpload from '@/pc/components/submission/AttachmentUpload.vue'
import CoverUpload from '@/pc/components/submission/CoverUpload.vue'
import MarkdownEditor from '@/pc/components/submission/MarkdownEditor.vue'

const message = useMessage()
const dialog = useDialog()
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
const companyTagOptions = [
  '拖欠工资',
  '无休假日',
  '强制加班',
  '虚假招聘',
  '恶意裁员',
  '拖欠社保',
  '职场霸凌',
  '霸王条款',
].map((tag) => ({ label: tag, value: tag }))
const form = reactive({
  title: '',
  companyName: '',
  companyTags: [],
  content: '',
  coverFileId: 0,
  coverUrl: '',
  attachments: [],
})

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
    form.companyTags = detail.company_tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
    form.content = detail.content
    form.coverFileId = detail.cover_file_id
    form.coverUrl = resolveApiUrl(detail.cover_url)
    form.attachments = detail.attachments || []
  } catch (error) {
    message.error(getErrorMessage(error))
  } finally {
    busy.value = false
  }
}

function handleCoverUploaded(file) {
  form.coverFileId = file.id
  form.coverUrl = file.preview_url
  errors.cover = ''
}

function validate() {
  errors.title = form.title.trim() ? '' : '请填写文章标题'
  errors.companyName = form.companyName.trim() ? '' : '请填写公司名'
  errors.companyTags = !form.companyTags.length
    ? '请选择或输入至少一个公司标签'
    : form.companyTags.join(',').length > 500
      ? '公司标签总长度不能超过 500 字'
      : ''
  errors.cover = form.coverFileId ? '' : '请上传封面图片'
  errors.attachments = form.attachments.some((item) => !item.attachment_name.trim())
    ? '附件名不能为空'
    : ''
  errors.content = form.content.trim() ? '' : '请填写 Markdown 正文'
  return (
    !errors.title &&
    !errors.companyName &&
    !errors.companyTags &&
    !errors.cover &&
    !errors.attachments &&
    !errors.content
  )
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

async function createNewArticle() {
  if (!validate() || busy.value) return
  busy.value = true
  try {
    await createArticle(buildPayload())
    message.success('新建稿件成功')
    clearForm()
    await loadArticles()
  } catch (error) {
    message.error(getErrorMessage(error))
  } finally {
    busy.value = false
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
    if (!silent) {
      message.success(saved.status === 'published' ? '修改已保存' : '草稿已保存')
    }
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
    content: '删除后无法恢复，已上传的封面和正文图片将被保留。',
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

function changePage(nextPage) {
  if (nextPage < 1 || nextPage > pageCount.value) return
  page.value = nextPage
  loadArticles()
}

function formatDate(value) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function updateCompanyTags(values) {
  form.companyTags = [...new Set(values.map((tag) => tag.trim()).filter(Boolean))]
  errors.companyTags = ''
}
</script>

<template>
  <section class="submission-page">
    <header class="page-heading">
      <div>
        <span>EXPOSURE DESK</span>
        <h1>曝光投稿工作台</h1>
        <p>用可核验的材料和清晰的时间线，完成一份经得起追问的公开记录。</p>
      </div>
      <button class="new-button" :disabled="busy" type="button" @click="createNewArticle">
        <span>＋</span>
        {{ busy ? '正在保存…' : '新建稿件' }}
      </button>
    </header>

    <div class="workspace">
      <aside class="article-sidebar">
        <div class="list-heading">
          <div>
            <span>MY SUBMISSIONS</span>
            <strong>我的投稿</strong>
          </div>
          <small>{{ total }} 篇</small>
        </div>

        <div class="status-tabs">
          <button
            v-for="option in [
              { label: '全部', value: '' },
              { label: '草稿', value: 'draft' },
              { label: '已发布', value: 'published' },
            ]"
            :key="option.value"
            :class="{ active: statusFilter === option.value }"
            type="button"
            @click="statusFilter = option.value"
          >
            {{ option.label }}
          </button>
        </div>

        <div class="article-list" :class="{ loading: loadingList }">
          <button
            v-for="article in articles"
            :key="article.id"
            class="article-item"
            :class="{ active: currentId === article.id }"
            type="button"
            @click="selectArticle(article)"
          >
            <img :src="resolveApiUrl(article.cover_url)" alt="" />
            <span>
              <b>{{ article.title }}</b>
              <em>{{ article.company_name }}</em>
              <small>
                <i :class="article.status">
                  {{ article.status === 'published' ? '已发布' : '草稿' }}
                </i>
                {{ formatDate(article.created_at) }}
              </small>
            </span>
          </button>

          <div v-if="!loadingList && articles.length === 0" class="empty-list">
            <b>暂无投稿</b>
            <span>从一份清晰的事实记录开始。</span>
          </div>
        </div>

        <div v-if="pageCount > 1" class="pagination">
          <button :disabled="page === 1" type="button" @click="changePage(page - 1)">←</button>
          <span>{{ page }} / {{ pageCount }}</span>
          <button :disabled="page === pageCount" type="button" @click="changePage(page + 1)">
            →
          </button>
        </div>
      </aside>

      <main class="article-editor">
        <div class="editor-heading">
          <div>
            <span>{{ currentId ? `CASE #${currentId}` : 'NEW CASE FILE' }}</span>
            <h2>{{ currentId ? '编辑曝光稿件' : '建立新的曝光档案' }}</h2>
          </div>
          <i :class="currentStatus">{{ isPublished ? '已发布' : '草稿' }}</i>
        </div>

        <label class="field">
          <span>文章标题 <b>*</b></span>
          <input
            v-model="form.title"
            maxlength="200"
            placeholder="一句话说清企业、事件与核心争议"
            type="text"
            @input="errors.title = ''"
          />
          <small v-if="errors.title">{{ errors.title }}</small>
        </label>

        <div class="company-fields">
          <label class="field">
            <span>公司名 <b>*</b></span>
            <input
              v-model="form.companyName"
              maxlength="200"
              placeholder="被曝光企业的完整名称"
              type="text"
              @input="errors.companyName = ''"
            />
            <small v-if="errors.companyName">{{ errors.companyName }}</small>
          </label>

          <label class="field">
            <span>公司标签 <b>*</b></span>
            <n-select
              class="company-tag-select"
              :value="form.companyTags"
              :options="companyTagOptions"
              multiple
              filterable
              tag
              clearable
              placeholder="选择标签，或输入后按回车创建"
              @update:value="updateCompanyTags"
            />
            <small v-if="errors.companyTags">{{ errors.companyTags }}</small>
          </label>
        </div>

        <div class="field">
          <span>封面图片 <b>*</b></span>
          <CoverUpload :preview-url="form.coverUrl" @uploaded="handleCoverUploaded" />
          <small v-if="errors.cover">{{ errors.cover }}</small>
        </div>

        <div class="field">
          <span>证据附件</span>
          <AttachmentUpload v-model="form.attachments" />
          <small v-if="errors.attachments">{{ errors.attachments }}</small>
        </div>

        <div class="field markdown-field">
          <span>Markdown 正文 <b>*</b></span>
          <MarkdownEditor v-model="form.content" @update:model-value="errors.content = ''" />
          <small v-if="errors.content">{{ errors.content }}</small>
        </div>

        <div class="editor-actions">
          <button
            v-if="currentId"
            class="danger-action"
            :disabled="busy"
            type="button"
            @click="confirmDelete"
          >
            删除
          </button>
          <span class="action-spacer"></span>
          <button
            v-if="isPublished"
            class="secondary-action"
            :disabled="busy"
            type="button"
            @click="withdraw"
          >
            撤回为草稿
          </button>
          <button class="secondary-action" :disabled="busy" type="button" @click="save()">
            {{ busy ? '处理中…' : isPublished ? '保存修改' : '保存草稿' }}
          </button>
          <button class="publish-action" :disabled="busy" type="button" @click="publish">
            {{ isPublished ? '发布更新' : '发布投稿' }}
            <span>→</span>
          </button>
        </div>
      </main>
    </div>
  </section>
</template>

<style scoped>
.submission-page {
  color: #292724;
}

.page-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 40px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #292724;
}

.page-heading > div > span,
.list-heading span,
.editor-heading > div > span {
  color: #a21d18;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.22em;
}

.page-heading h1 {
  margin: 5px 0 5px;
  font-family: 'Songti SC', STSong, serif;
  font-size: 30px;
}

.page-heading p {
  margin: 0;
  color: #8a7768;
  font-size: 11px;
}

.new-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border: 1px solid #292724;
  background: #292724;
  color: white;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 4px 4px 0 #a21d18;
}

.new-button span {
  color: #ef6c62;
  font-size: 18px;
}

.new-button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.workspace {
  display: grid;
  align-items: start;
  grid-template-columns: 270px minmax(0, 1fr);
  gap: 18px;
}

.article-sidebar,
.article-editor {
  border: 1px solid #cfc5ba;
  background: rgba(246, 244, 237, 0.8);
}

.article-sidebar {
  position: sticky;
  top: 0;
}

.list-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #ddd2c7;
}

.list-heading > div {
  display: flex;
  flex-direction: column;
}

.list-heading strong {
  margin-top: 5px;
  font-family: 'Songti SC', STSong, serif;
  font-size: 19px;
}

.list-heading small {
  color: #9f8e81;
  font-size: 10px;
}

.status-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 10px;
  border-bottom: 1px solid #e1d8cf;
}

.status-tabs button {
  padding: 7px 4px;
  border: 0;
  background: transparent;
  color: #968476;
  font-size: 10px;
  cursor: pointer;
}

.status-tabs button.active {
  background: #e5d7d2;
  color: #a21d18;
  font-weight: 700;
}

.article-list {
  min-height: 260px;
  max-height: 610px;
  overflow-y: auto;
  padding: 8px;
}

.article-list.loading {
  opacity: 0.45;
}

.article-item {
  width: 100%;
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  gap: 10px;
  margin-bottom: 5px;
  padding: 8px;
  border: 1px solid transparent;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.article-item:hover,
.article-item.active {
  border-color: #c9b8aa;
  background: #ece6dc;
}

.article-item.active {
  border-left: 3px solid #a21d18;
}

.article-item img {
  width: 54px;
  height: 48px;
  object-fit: cover;
  background: #ddd5cb;
}

.article-item > span {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.article-item b {
  overflow: hidden;
  color: #4a3b31;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.article-item em {
  overflow: hidden;
  margin-top: 3px;
  color: #a21d18;
  font-size: 9px;
  font-style: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.article-item small {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 7px;
  color: #a49487;
  font-size: 8px;
}

.article-item i,
.editor-heading i {
  padding: 3px 5px;
  border: 1px solid #cdbfb2;
  color: #806f62;
  font-style: normal;
}

.article-item i.published,
.editor-heading i.published {
  border-color: #a21d18;
  color: #a21d18;
}

.empty-list {
  min-height: 240px;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  color: #a7978a;
}

.empty-list b {
  color: #756256;
  font-size: 12px;
}

.empty-list span {
  margin-top: 7px;
  font-size: 9px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 13px;
  padding: 12px;
  border-top: 1px solid #e1d8cf;
}

.pagination button {
  border: 0;
  background: transparent;
  color: #a21d18;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.25;
}

.pagination span {
  color: #968476;
  font-size: 9px;
}

.article-editor {
  padding: 24px 28px 28px;
  box-shadow: 7px 7px 0 rgba(41, 39, 36, 0.14);
}

.editor-heading {
  display: flex;
  align-items: start;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ddd2c7;
}

.editor-heading h2 {
  margin: 4px 0 0;
  font-family: 'Songti SC', STSong, serif;
  font-size: 21px;
}

.editor-heading i {
  font-size: 9px;
}

.field {
  display: block;
  margin-bottom: 23px;
}

.company-fields {
  display: grid;
  grid-template-columns: 1fr 1.25fr;
  gap: 14px;
}

.field > span {
  display: block;
  margin-bottom: 8px;
  color: #665447;
  font-size: 11px;
  font-weight: 700;
}

.field > span b {
  color: #c57042;
  font-weight: 400;
}

.field > input {
  width: 100%;
  height: 46px;
  outline: none;
  padding: 0 14px;
  border: 1px solid #d8cabd;
  border-radius: 2px;
  background: #f8f6ef;
  color: #3e3026;
  font-size: 13px;
}

.field > input:focus {
  border-color: #a21d18;
  box-shadow: 0 0 0 3px rgba(162, 29, 24, 0.08);
}

:deep(.company-tag-select .n-base-selection) {
  --n-border: 1px solid #d8cabd !important;
  --n-border-hover: 1px solid #a21d18 !important;
  --n-border-active: 1px solid #a21d18 !important;
  --n-box-shadow-active: 0 0 0 3px rgba(162, 29, 24, 0.08) !important;
  --n-color: #f8f6ef !important;
  min-height: 46px;
}

:deep(.company-tag-select .n-tag) {
  border: 1px solid #d3b9b5;
  border-radius: 2px;
  background: #ead8d5;
  color: #8d1a16;
}

.field > small {
  display: block;
  margin-top: 6px;
  color: #a21d18;
  font-size: 9px;
}

.markdown-field {
  margin-bottom: 27px;
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 9px;
  padding-top: 22px;
  border-top: 1px solid #ddd2c7;
}

.action-spacer {
  flex: 1;
}

.editor-actions button {
  padding: 10px 14px;
  border-radius: 2px;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}

.editor-actions button:disabled {
  cursor: wait;
  opacity: 0.45;
}

.secondary-action {
  border: 1px solid #bfae9e;
  background: transparent;
  color: #655348;
}

.danger-action {
  border: 0;
  background: transparent;
  color: #a21d18;
}

.publish-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #292724;
  background: #292724;
  color: white;
}

.publish-action span {
  color: #ef6c62;
  font-size: 15px;
}

@media (max-width: 980px) {
  .workspace {
    grid-template-columns: 1fr;
  }

  .article-sidebar {
    position: static;
  }

  .article-list {
    max-height: 300px;
  }
}

@media (max-width: 620px) {
  .page-heading {
    align-items: start;
    flex-direction: column;
  }

  .article-editor {
    padding: 22px 16px;
  }

  .company-fields {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .editor-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .action-spacer {
    display: none;
  }
}
</style>
