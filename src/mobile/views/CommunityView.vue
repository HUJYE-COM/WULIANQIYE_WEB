<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'

import TopicComposer from '@/mobile/components/community/TopicComposer.vue'
import ImageLightbox from '@/components/ImageLightbox.vue'
import LikeButton from '@/mobile/components/interaction/LikeButton.vue'
import StatIcon from '@/mobile/components/icons/StatIcon.vue'
import { resolveApiUrl } from '@/api/file'
import { formatTimeAgo, initial } from '@/mobile/utils/format'
import { createTopic, getHotTopicTags, getTopicList } from '@/api/topic'
import { getErrorMessage } from '@/constants/errorCodes'
import { usePublicUserStore } from '@/stores/publicUser'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const publicUserStore = usePublicUserStore()
const userStore = useUserStore()
const pageSize = 8
const topics = ref([])
const total = ref(0)
const page = ref(1)
const loading = ref(false)
const hasMore = ref(true)
const searchInput = ref('')
const search = ref('')
const activeTag = ref('')
const hotTags = ref([])
const composerOpen = ref(false)
const loadSentinel = ref(null)
const previewSrc = ref('')
let searchTimer
let observer
let requestSerial = 0

const suggestions = computed(() => hotTags.value.map((item) => item.tag))

watch(searchInput, () => {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(applySearch, 350)
})

onMounted(async () => {
  activeTag.value = normalizeTag(route.query.tag)
  loadHotTags()
  await loadTopics(true)
  await nextTick()
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) loadTopics()
    },
    { rootMargin: '240px 0px' },
  )
  if (loadSentinel.value) observer.observe(loadSentinel.value)
})

onBeforeUnmount(() => {
  window.clearTimeout(searchTimer)
  observer?.disconnect()
})

function normalizeTag(value) {
  return String(value || '').replace(/^[#＃\s]+/, '').trim()
}

function applySearch() {
  const raw = searchInput.value.trim()
  let nextSearch = raw
  let nextTag = activeTag.value
  if (/^[#＃]/.test(raw)) {
    nextTag = normalizeTag(raw)
    nextSearch = ''
    searchInput.value = ''
  }
  if (nextSearch === search.value && nextTag === activeTag.value) return
  search.value = nextSearch
  activeTag.value = nextTag
  loadTopics(true)
}

function selectTag(tag) {
  const next = tag === activeTag.value ? '' : tag
  if (next === activeTag.value) return
  activeTag.value = next
  loadTopics(true)
}

async function loadTopics(reset = false) {
  if (!reset && (loading.value || !hasMore.value)) return
  if (reset) {
    page.value = 1
    topics.value = []
    hasMore.value = true
  }
  const requestID = ++requestSerial
  loading.value = true
  try {
    const data = await getTopicList({
      page: page.value,
      page_size: pageSize,
      search: search.value || undefined,
      tag: activeTag.value || undefined,
    })
    if (requestID !== requestSerial) return
    total.value = data.total
    const existingIds = new Set(topics.value.map((item) => item.id))
    const incoming = data.list.filter((item) => !existingIds.has(item.id))
    topics.value.push(...incoming)
    incoming.forEach((item) => publicUserStore.fetchUser(item.created_by).catch(() => null))
    hasMore.value = topics.value.length < data.total
    if (hasMore.value) page.value += 1
  } catch (error) {
    if (requestID !== requestSerial) return
    message.error(getErrorMessage(error))
  } finally {
    if (requestID === requestSerial) loading.value = false
  }
}

async function loadHotTags() {
  try {
    const data = await getHotTopicTags({ limit: 12 })
    hotTags.value = data.list
  } catch {
    hotTags.value = []
  }
}

function openComposer() {
  if (!userStore.isLoggedIn) {
    message.warning('登录后才能发起话题')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  composerOpen.value = true
}

async function publishTopic(payload) {
  try {
    const created = await createTopic(payload)
    topics.value.unshift(created)
    total.value += 1
    publicUserStore.fetchUser(created.created_by).catch(() => null)
    composerOpen.value = false
    loadHotTags()
    message.success('话题已发布')
  } catch (error) {
    message.error(getErrorMessage(error))
    throw error
  }
}

function applyLike(topic, summary) {
  topic.liked = summary.liked
  topic.like_count = summary.count
}

function authorName(userId) {
  return publicUserStore.getCachedUser(userId)?.nickname || '匿名用户'
}

function excerpt(content) {
  const flat = content.replace(/\s+/g, ' ').trim()
  return flat.length > 90 ? `${flat.slice(0, 90)}…` : flat
}
</script>

<template>
  <section class="community">
    <div class="intro">
      <h1>社区广场</h1>
      <p>交换线索，先讲证据再讲态度。</p>
      <button type="button" @click="openComposer">＋ 发起话题</button>
    </div>

    <TopicComposer
      v-if="composerOpen"
      :submit="publishTopic"
      :suggestions="suggestions"
      @cancel="composerOpen = false"
    />

    <div class="chips">
      <button :class="{ on: !activeTag }" type="button" @click="selectTag('')">全部</button>
      <button
        v-for="item in hotTags.slice(0, 8)"
        :key="item.tag"
        :class="{ on: activeTag === item.tag }"
        type="button"
        @click="selectTag(item.tag)"
      >
        #{{ item.tag }}
      </button>
    </div>

    <label class="search">
      <input v-model="searchInput" maxlength="100" placeholder="搜索标题，或输入 #标签" type="search" />
    </label>

    <article v-for="topic in topics" :key="topic.id" class="post">
      <header>
        <i>{{ initial(authorName(topic.created_by)) }}</i>
        <div>
          <strong>{{ authorName(topic.created_by) }}</strong>
          <small>{{ formatTimeAgo(topic.created_at) }}</small>
        </div>
      </header>
      <h2>
        <router-link :to="{ name: 'topic-detail', params: { id: topic.id } }">
          {{ topic.title }}
        </router-link>
      </h2>
      <p>{{ excerpt(topic.content) }}</p>
      <div v-if="topic.images.length" class="pics">
        <button
          v-for="image in topic.images.slice(0, 3)"
          :key="image.file_id"
          type="button"
          @click="previewSrc = resolveApiUrl(image.url)"
        >
          <img :src="resolveApiUrl(image.url)" alt="" />
        </button>
      </div>
      <div class="tags">
        <button v-for="tag in topic.tags" :key="tag" type="button" @click="selectTag(tag)">
          #{{ tag }}
        </button>
      </div>
      <footer>
        <LikeButton
          target-type="topic"
          :target-id="topic.id"
          :liked="topic.liked"
          :count="topic.like_count"
          variant="chip"
          @change="applyLike(topic, $event)"
        />
        <router-link :to="{ name: 'topic-detail', params: { id: topic.id } }">
          <StatIcon name="comment" /> {{ topic.comment_count }}
        </router-link>
        <span><StatIcon name="view" /> {{ topic.browse_count }}</span>
      </footer>
    </article>

    <div v-if="!loading && !topics.length" class="empty">
      {{ search || activeTag ? '没有匹配话题' : '还没有人发起话题' }}
    </div>
    <div ref="loadSentinel" class="sentinel">
      <span v-if="loading">正在读取…</span>
      <span v-else-if="topics.length && !hasMore">已显示全部 {{ total }} 个</span>
    </div>
    <ImageLightbox :src="previewSrc" @close="previewSrc = ''" />
  </section>
</template>

<style scoped>
.intro {
  padding: 4px 0 16px;
}

h1 {
  margin: 0;
  font-family: 'Songti SC', STSong, serif;
  font-size: 28px;
}

.intro p {
  margin: 6px 0 12px;
  color: #8a7b6e;
  font-size: 13px;
}

.intro button {
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid #292724;
  background: #292724;
  color: white;
  font-weight: 700;
  box-shadow: 3px 3px 0 #a21d18;
}

.chips,
.tags {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.chips button,
.tags button {
  flex-shrink: 0;
  padding: 6px 10px;
  border: 1px solid #d4cbbd;
  background: #f7f3ea;
  color: #6d635a;
  font-size: 12px;
}

.chips .on,
.tags button {
  background: #eadbd6;
  color: #8f2924;
}

.chips .on {
  border-color: #a21d18;
}

.search {
  display: block;
  margin: 12px 0 14px;
}

.search input {
  width: 100%;
  height: 42px;
  outline: 0;
  padding: 0 12px;
  border: 1px solid #c8bdb2;
  background: #faf6ee;
}

.post {
  margin-bottom: 12px;
  padding: 14px;
  border: 1px solid #c8bdb2;
  background: #f7f3ea;
}

header {
  display: flex;
  align-items: center;
  gap: 8px;
}

header i {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #292724;
  color: white;
  font-style: normal;
}

header div {
  display: flex;
  flex-direction: column;
}

header small {
  color: #ae9d8e;
  font-size: 11px;
}

h2 {
  margin: 10px 0 6px;
  font-family: 'Songti SC', STSong, serif;
  font-size: 18px;
}

h2 a {
  text-decoration: none;
}

p {
  margin: 0;
  color: #6d635a;
  font-size: 13px;
  line-height: 1.6;
}

.pics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin-top: 10px;
}

.pics button {
  padding: 0;
  border: 0;
  background: transparent;
  cursor: zoom-in;
}

.pics img {
  width: 100%;
  height: 76px;
  object-fit: cover;
}

.tags {
  margin-top: 10px;
}

footer {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #eadfd4;
  color: #8a7b6e;
  font-size: 12px;
}

footer a {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  text-decoration: none;
}

.empty,
.sentinel {
  padding: 18px 0;
  color: #9c8876;
  font-size: 12px;
  text-align: center;
}
</style>
