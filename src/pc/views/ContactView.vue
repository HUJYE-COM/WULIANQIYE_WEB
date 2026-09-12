<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useMessage } from 'naive-ui'

import { resolveApiUrl } from '@/api/file'
import { createFeedback, getFeedbacks, replyFeedback } from '@/api/feedback'
import { getErrorMessage } from '@/constants/errorCodes'
import ImageLightbox from '@/components/ImageLightbox.vue'
import ImageUpload from '@/pc/components/contact/ImageUpload.vue'
import { useUserStore } from '@/stores/user'

const message = useMessage()
const userStore = useUserStore()
const items = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 8
const loading = ref(false)
const submitting = ref(false)
const isWebmaster = ref(false)
const errors = reactive({})
const form = reactive({
  content: '',
  images: [],
})
const replyDrafts = reactive({})
const replyBusy = reactive({})
const previewSrc = ref('')

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const canSubmit = computed(() => Boolean(form.content.trim()) && !submitting.value)

onMounted(loadFeedbacks)

async function loadFeedbacks() {
  loading.value = true
  try {
    const data = await getFeedbacks({
      page: page.value,
      page_size: pageSize,
    })
    items.value = data.list || []
    total.value = data.total || 0
    isWebmaster.value = Boolean(data.is_webmaster)
  } catch (error) {
    message.error(getErrorMessage(error))
  } finally {
    loading.value = false
  }
}

function validate() {
  errors.content = form.content.trim() ? '' : '请填写建议内容'
  return !errors.content
}

async function submit() {
  if (!validate() || submitting.value) return
  submitting.value = true
  try {
    await createFeedback({
      content: form.content.trim(),
      image_file_ids: form.images.map((image) => image.file_id),
    })
    form.content = ''
    form.images = []
    page.value = 1
    message.success('建议已送达站长')
    await loadFeedbacks()
  } catch (error) {
    message.error(getErrorMessage(error))
  } finally {
    submitting.value = false
  }
}

async function sendReply(item) {
  const content = (replyDrafts[item.id] || '').trim()
  if (!content || replyBusy[item.id]) return
  replyBusy[item.id] = true
  try {
    const reply = await replyFeedback(item.id, content)
    item.replies = [...(item.replies || []), reply]
    replyDrafts[item.id] = ''
    message.success('评论已发出')
  } catch (error) {
    message.error(getErrorMessage(error))
  } finally {
    replyBusy[item.id] = false
  }
}

function changePage(nextPage) {
  if (nextPage < 1 || nextPage > pageCount.value) return
  page.value = nextPage
  loadFeedbacks()
}

function formatDate(value) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function openPreview(url) {
  if (url) previewSrc.value = resolveApiUrl(url)
}
</script>

<template>
  <section class="contact-page">
    <header class="page-heading">
      <div>
        <span class="eyebrow">CONTACT DESK</span>
        <h1>联系站长</h1>
        <p>把站点问题、功能建议或核验求助直接交给馆方。往来记录仅自己与站长可见。</p>
      </div>
      <small>{{ total }} 条往来</small>
    </header>

    <form class="composer-card" novalidate @submit.prevent="submit">
      <div class="composer-heading">
        <span>NEW NOTE</span>
        <strong>投递一条建议</strong>
      </div>
      <label class="field">
        <span>文字说明 <b>*</b></span>
        <textarea
          v-model="form.content"
          maxlength="2000"
          placeholder="例如：某个页面打不开、希望增加筛选、发现一处需要核验的内容…"
          rows="5"
          @input="errors.content = ''"
        ></textarea>
        <small v-if="errors.content" class="field-error">{{ errors.content }}</small>
      </label>
      <div class="field">
        <span>配图 <em>选填，最多 9 张</em></span>
        <ImageUpload v-model="form.images" :disabled="submitting" />
      </div>
      <div class="composer-footer">
        <small>{{ form.content.length }} / 2000</small>
        <button :disabled="!canSubmit" type="submit">
          {{ submitting ? '正在投递…' : '投递建议' }}
        </button>
      </div>
    </form>

    <div class="history">
      <div class="history-heading">
        <span>ARCHIVE</span>
        <strong>过往建议</strong>
      </div>

      <div class="history-list" :class="{ loading }">
        <article v-for="item in items" :key="item.id" class="feedback-card">
          <header>
            <div>
              <b>{{ userStore.user?.nickname }}</b>
              <time>{{ formatDate(item.created_at) }}</time>
            </div>
            <i :class="{ replied: item.replies?.length }">
              {{ item.replies?.length ? '已回复' : '待回复' }}
            </i>
          </header>
          <p>{{ item.content }}</p>
          <div v-if="item.images?.length" class="preview-grid">
            <button
              v-for="image in item.images"
              :key="image.file_id"
              type="button"
              @click="openPreview(image.url)"
            >
              <img :src="resolveApiUrl(image.url)" alt="建议配图" />
            </button>
          </div>

          <div class="reply-thread">
            <div v-if="item.replies?.length" class="replies">
              <div v-for="reply in item.replies" :key="reply.id" class="reply">
                <span>
                  <b>站长</b>
                  <small>{{ reply.author_nickname }}</small>
                </span>
                <time>{{ formatDate(reply.created_at) }}</time>
                <p>{{ reply.content }}</p>
              </div>
            </div>
            <p v-else class="empty-reply">站长还没有评论。</p>

            <form
              v-if="isWebmaster"
              class="reply-form"
              @submit.prevent="sendReply(item)"
            >
              <textarea
                v-model="replyDrafts[item.id]"
                maxlength="2000"
                placeholder="以站长身份回复这条建议…"
                rows="3"
              ></textarea>
              <button :disabled="!String(replyDrafts[item.id] || '').trim() || replyBusy[item.id]" type="submit">
                {{ replyBusy[item.id] ? '发送中…' : '发出评论' }}
              </button>
            </form>
          </div>
        </article>

        <div v-if="!loading && items.length === 0" class="empty-list">
          <b>还没有建议</b>
          <span>第一封信可以很短，把最想改的那件事写清楚就好。</span>
        </div>
      </div>

      <div v-if="pageCount > 1" class="pagination">
        <button :disabled="page === 1" type="button" @click="changePage(page - 1)">←</button>
        <span>{{ page }} / {{ pageCount }}</span>
        <button :disabled="page === pageCount" type="button" @click="changePage(page + 1)">
          →
        </button>
      </div>
    </div>
    <ImageLightbox :src="previewSrc" alt="建议配图" @close="previewSrc = ''" />
  </section>
</template>

<style scoped>
.contact-page {
  color: #292724;
}

.page-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
  padding-bottom: 18px;
  border-bottom: 2px solid #292724;
}

.eyebrow,
.composer-heading span,
.history-heading span {
  color: #a21d18;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.22em;
}

.page-heading h1 {
  margin: 8px 0 7px;
  font-family: 'Songti SC', STSong, serif;
  font-size: 42px;
  letter-spacing: -0.03em;
}

.page-heading p {
  margin: 0;
  color: #968372;
  font-size: 14px;
}

.page-heading small {
  color: #9f8e81;
  font-size: 11px;
  white-space: nowrap;
}

.composer-card,
.history {
  border: 1px solid #c7c1b7;
  background: rgba(246, 244, 237, 0.82);
}

.composer-card {
  margin-bottom: 22px;
  padding: 24px 26px 20px;
}

.composer-heading,
.history-heading {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.composer-heading strong,
.history-heading strong {
  margin-top: 6px;
  font-family: 'Songti SC', STSong, serif;
  font-size: 22px;
}

.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.field > span {
  margin-bottom: 8px;
  color: #5f4e41;
  font-size: 12px;
  font-weight: 700;
}

.field > span b {
  color: #a21d18;
}

.field > span em {
  margin-left: 8px;
  color: #a08e7e;
  font-size: 10px;
  font-style: normal;
  font-weight: 400;
}

.field textarea,
.reply-form textarea {
  width: 100%;
  outline: 0;
  padding: 12px 14px;
  border: 1px solid #d5cabf;
  background: #fdfbf5;
  color: #3d3732;
  font: inherit;
  font-size: 14px;
  line-height: 1.7;
  resize: vertical;
}

.field textarea:focus,
.reply-form textarea:focus {
  border-color: #a21d18;
  box-shadow: 3px 3px 0 rgba(162, 29, 24, 0.14);
}

.field-error {
  margin-top: 6px;
  color: #a21d18;
  font-size: 11px;
}

.composer-footer,
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.composer-footer small {
  color: #a0907f;
  font-size: 11px;
}

.composer-footer button,
.reply-form button {
  padding: 10px 16px;
  border: 1px solid #292724;
  background: #292724;
  color: #f7f3ea;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 3px 3px 0 rgba(162, 29, 24, 0.7);
}

.composer-footer button:hover:not(:disabled),
.reply-form button:hover:not(:disabled) {
  background: #a21d18;
  box-shadow: 3px 3px 0 #292724;
}

.composer-footer button:disabled,
.reply-form button:disabled {
  border-color: #bdb5ab;
  background: #cdc6bc;
  color: #f2efe8;
  box-shadow: none;
  cursor: not-allowed;
}

.history-heading {
  padding: 22px 24px 0;
}

.history-list {
  display: grid;
  gap: 14px;
  min-height: 160px;
  padding: 8px 16px 20px;
}

.history-list.loading {
  opacity: 0.55;
}

.feedback-card {
  padding: 20px 22px 18px;
  border: 1px solid #c7c1b7;
  background: #f6f4ed;
}

.feedback-card header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.feedback-card header > div {
  display: flex;
  flex-direction: column;
}

.feedback-card header b {
  font-size: 13px;
}

.feedback-card time,
.reply time {
  margin-top: 4px;
  color: #ae9d8e;
  font-size: 11px;
}

.feedback-card header i {
  padding: 4px 8px;
  border: 1px solid #cdbfb2;
  color: #806f62;
  font-size: 10px;
  font-style: normal;
  white-space: nowrap;
}

.feedback-card header i.replied {
  border-color: #a21d18;
  color: #a21d18;
}

.feedback-card > p,
.reply p {
  margin: 0;
  color: #4b3c31;
  font-size: 14px;
  line-height: 1.75;
  white-space: pre-wrap;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 8px;
  margin-top: 14px;
}

.preview-grid button {
  overflow: hidden;
  padding: 0;
  border: 1px solid #d8cabd;
  background: #e9e5dc;
  cursor: zoom-in;
}

.preview-grid img {
  width: 100%;
  height: 88px;
  display: block;
  object-fit: cover;
}

.reply-thread {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #eee5dc;
}

.replies {
  display: grid;
  gap: 10px;
}

.reply {
  padding: 12px 14px;
  background: #efe8dc;
}

.reply span {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.reply b {
  color: #a21d18;
  font-size: 12px;
}

.reply small {
  color: #8a7768;
  font-size: 11px;
}

.reply p {
  margin-top: 8px;
}

.empty-reply {
  margin: 0;
  color: #b1a195;
  font-size: 12px;
}

.reply-form {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.reply-form button {
  justify-self: end;
}

.empty-list {
  min-height: 180px;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  color: #a7978a;
}

.empty-list b {
  color: #756256;
  font-size: 14px;
}

.empty-list span {
  margin-top: 8px;
  font-size: 12px;
}

.pagination {
  justify-content: center;
  padding: 0 16px 18px;
}

.pagination button {
  border: 0;
  background: transparent;
  color: #a21d18;
  font-size: 16px;
  cursor: pointer;
}

.pagination button:disabled {
  color: #cbbfb4;
  cursor: default;
}

.pagination span {
  color: #8a7768;
  font-size: 12px;
}

@media (max-width: 720px) {
  .page-heading {
    align-items: start;
    flex-direction: column;
  }

  .page-heading h1 {
    font-size: 32px;
  }

  .composer-card,
  .feedback-card {
    padding: 18px 16px;
  }
}
</style>
