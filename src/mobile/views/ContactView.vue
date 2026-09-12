<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useMessage } from 'naive-ui'

import ImageGridUpload from '@/mobile/components/upload/ImageGridUpload.vue'
import ImageLightbox from '@/components/ImageLightbox.vue'
import { resolveApiUrl } from '@/api/file'
import { formatDate } from '@/mobile/utils/format'
import { createFeedback, getFeedbacks, replyFeedback } from '@/api/feedback'
import { getErrorMessage } from '@/constants/errorCodes'
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
const form = reactive({ content: '', images: [] })
const replyDrafts = reactive({})
const replyBusy = reactive({})
const previewSrc = ref('')
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

onMounted(loadFeedbacks)

async function loadFeedbacks() {
  loading.value = true
  try {
    const data = await getFeedbacks({ page: page.value, page_size: pageSize })
    items.value = data.list || []
    total.value = data.total || 0
    isWebmaster.value = Boolean(data.is_webmaster)
  } catch (error) {
    message.error(getErrorMessage(error))
  } finally {
    loading.value = false
  }
}

async function submit() {
  errors.content = form.content.trim() ? '' : '请填写建议'
  if (errors.content || submitting.value) return
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
</script>

<template>
  <section class="contact">
    <p class="lead">把问题或建议交给馆方，往来仅自己与站长可见。</p>
    <form class="card" @submit.prevent="submit">
      <textarea v-model="form.content" maxlength="2000" rows="4" placeholder="例如某个页面打不开，或希望增加筛选…"></textarea>
      <small v-if="errors.content" class="err">{{ errors.content }}</small>
      <ImageGridUpload v-model="form.images" url-key="url" :disabled="submitting" />
      <button :disabled="submitting || !form.content.trim()" type="submit">
        {{ submitting ? '投递中…' : '投递建议' }}
      </button>
    </form>

    <article v-for="item in items" :key="item.id" class="card">
      <header>
        <b>{{ userStore.user?.nickname }}</b>
        <time>{{ formatDate(item.created_at, 'long') }}</time>
        <i>{{ item.replies?.length ? '已回复' : '待回复' }}</i>
      </header>
      <p>{{ item.content }}</p>
      <div v-if="item.images?.length" class="pics">
        <button
          v-for="image in item.images"
          :key="image.file_id"
          type="button"
          @click="previewSrc = resolveApiUrl(image.url)"
        >
          <img :src="resolveApiUrl(image.url)" alt="" />
        </button>
      </div>
      <div v-for="reply in item.replies" :key="reply.id" class="reply">
        <strong>站长 · {{ reply.author_nickname }}</strong>
        <p>{{ reply.content }}</p>
      </div>
      <form v-if="isWebmaster" @submit.prevent="sendReply(item)">
        <textarea v-model="replyDrafts[item.id]" rows="2" placeholder="以站长身份回复…"></textarea>
        <button type="submit">发出</button>
      </form>
    </article>

    <p v-if="!loading && !items.length" class="empty">还没有建议。</p>
    <div v-if="pageCount > 1" class="pager">
      <button :disabled="page === 1" type="button" @click="page -= 1; loadFeedbacks()">上一页</button>
      <span>{{ page }}/{{ pageCount }}</span>
      <button :disabled="page === pageCount" type="button" @click="page += 1; loadFeedbacks()">下一页</button>
    </div>
    <ImageLightbox :src="previewSrc" @close="previewSrc = ''" />
  </section>
</template>

<style scoped>
.lead {
  margin: 0 0 12px;
  color: #8a7b6e;
  font-size: 13px;
}

.card {
  margin-bottom: 12px;
  padding: 14px;
  border: 1px solid #c8bdb2;
  background: #f7f3ea;
}

textarea,
.card > button,
form button {
  width: 100%;
  outline: 0;
  margin-top: 8px;
  padding: 10px 12px;
  border: 1px solid #d5cabf;
  background: #fffdf8;
  font: inherit;
}

.card > button,
form button {
  min-height: 42px;
  border-color: #292724;
  background: #292724;
  color: #f7f3ea;
  font-weight: 700;
}

header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
}

header time,
.empty {
  color: #8a7b6e;
}

header i {
  margin-left: auto;
  color: #a21d18;
  font-style: normal;
}

.pics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-top: 8px;
}

.pics button {
  padding: 0;
  border: 0;
  background: transparent;
  cursor: zoom-in;
}

.pics img {
  width: 100%;
  height: 72px;
  object-fit: cover;
}

.reply {
  margin-top: 10px;
  padding: 10px;
  background: #ebe6d8;
}

.err {
  color: #a21d18;
  font-size: 12px;
}

.pager {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>
