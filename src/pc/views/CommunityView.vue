<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'

import TopicComposer from '@/pc/components/community/TopicComposer.vue'
import LikeButton from '@/pc/components/interaction/LikeButton.vue'
import StatIcon from '@/pc/components/interaction/StatIcon.vue'
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
let searchTimer
let observer
let requestSerial = 0

const suggestions = computed(() => hotTags.value.map((item) => item.tag))
const loginRedirect = computed(() => ({
  path: '/login',
  query: { redirect: route.fullPath },
}))

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
  return String(value || '')
    .replace(/^[#＃\s]+/, '')
    .trim()
}

// 搜索框里直接输入 #标签 时转成标签筛选，与手动点选标签共用一套状态。
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

function clearFilters() {
  searchInput.value = ''
  search.value = ''
  activeTag.value = ''
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
    cacheAuthors(incoming)
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

function cacheAuthors(list) {
  new Set(list.map((item) => item.created_by)).forEach((userId) => {
    publicUserStore.fetchUser(userId).catch(() => null)
  })
}

function openComposer() {
  if (!userStore.isLoggedIn) {
    message.warning('登录后才能发起话题')
    router.push(loginRedirect.value)
    return
  }
  composerOpen.value = true
}

async function publishTopic(payload) {
  try {
    const created = await createTopic(payload)
    topics.value.unshift(created)
    total.value += 1
    cacheAuthors([created])
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
  return flat.length > 160 ? `${flat.slice(0, 160)}…` : flat
}

function formatTime(value) {
  const created = new Date(value)
  const minutes = Math.floor((Date.now() - created.getTime()) / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (minutes < 1440) return `${Math.floor(minutes / 60)} 小时前`
  if (minutes < 10080) return `${Math.floor(minutes / 1440)} 天前`
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(created)
}
</script>

<template>
  <section class="community-page">
    <header class="page-heading">
      <div>
        <span class="eyebrow">COMMUNITY</span>
        <h1>社区广场</h1>
        <p>交换线索、补充证据，让每一个“个例”都经得起核验。</p>
      </div>
      <button class="write-button" type="button" @click="openComposer">
        <span>＋</span>
        发起话题
      </button>
    </header>

    <div class="community-layout">
      <div class="feed">
        <TopicComposer
          v-if="composerOpen"
          :submit="publishTopic"
          :suggestions="suggestions"
          @cancel="composerOpen = false"
        />

        <div class="feed-toolbar">
          <nav class="topic-tabs" aria-label="标签筛选">
            <button :class="{ active: !activeTag }" type="button" @click="selectTag('')">
              全部话题
            </button>
            <button
              v-for="item in hotTags.slice(0, 5)"
              :key="item.tag"
              :class="{ active: activeTag === item.tag }"
              type="button"
              @click="selectTag(item.tag)"
            >
              #{{ item.tag }}
            </button>
            <button
              v-if="activeTag && !hotTags.slice(0, 5).some((item) => item.tag === activeTag)"
              class="active"
              type="button"
              @click="selectTag('')"
            >
              #{{ activeTag }}
            </button>
          </nav>

          <label class="search-box">
            <span>⌕</span>
            <input
              v-model="searchInput"
              maxlength="100"
              placeholder="搜索话题标题，或输入 #标签"
              type="search"
            />
            <button
              v-if="searchInput"
              type="button"
              aria-label="清空搜索"
              @click="searchInput = ''"
            >
              ×
            </button>
          </label>
        </div>

        <div v-if="search || activeTag" class="filter-summary">
          <span>
            共 {{ total }} 个话题
            <template v-if="activeTag">· 标签 <b>#{{ activeTag }}</b></template>
            <template v-if="search">· 标题含 <b>{{ search }}</b></template>
          </span>
          <button type="button" @click="clearFilters">清除筛选</button>
        </div>

        <div v-if="topics.length" class="post-list">
          <article v-for="topic in topics" :key="topic.id" class="post-card">
            <div class="post-meta">
              <span class="avatar">{{ authorName(topic.created_by).slice(0, 1) }}</span>
              <div>
                <strong>{{ authorName(topic.created_by) }}</strong>
                <span>{{ formatTime(topic.created_at) }}</span>
              </div>
            </div>

            <h2>
              <router-link :to="{ name: 'topic-detail', params: { id: topic.id } }">
                {{ topic.title }}
              </router-link>
            </h2>

            <p>{{ excerpt(topic.content) }}</p>

            <div v-if="topic.images.length" class="post-images">
              <router-link
                v-for="image in topic.images.slice(0, 3)"
                :key="image.file_id"
                :to="{ name: 'topic-detail', params: { id: topic.id } }"
              >
                <img :src="image.url" alt="话题配图" loading="lazy" />
                <b v-if="topic.images.length > 3 && image === topic.images[2]">
                  +{{ topic.images.length - 3 }}
                </b>
              </router-link>
            </div>

            <div class="post-tags">
              <button
                v-for="tag in topic.tags"
                :key="tag"
                :class="{ active: activeTag === tag }"
                type="button"
                @click="selectTag(tag)"
              >
                #{{ tag }}
              </button>
            </div>

            <div class="post-actions">
              <LikeButton
                target-type="topic"
                :target-id="topic.id"
                :liked="topic.liked"
                :count="topic.like_count"
                variant="ghost"
                @change="applyLike(topic, $event)"
              />
              <router-link
                class="action-link"
                :to="{ name: 'topic-detail', params: { id: topic.id } }"
              >
                <StatIcon name="comment" />
                {{ topic.comment_count }} 条讨论
              </router-link>
              <span class="action-stat">
                <StatIcon name="view" />
                {{ topic.browse_count }}
              </span>
            </div>
          </article>
        </div>

        <div v-else-if="!loading" class="empty-state">
          <strong>{{ search || activeTag ? '没有匹配的话题' : '还没有人发起话题' }}</strong>
          <span>
            {{ search || activeTag ? '换个标签或关键词试试' : '第一个话题交给你来开' }}
          </span>
        </div>

        <div ref="loadSentinel" class="load-sentinel">
          <span v-if="loading">正在读取话题…</span>
          <span v-else-if="topics.length && !hasMore">已显示全部 {{ total }} 个话题</span>
        </div>
      </div>

      <aside class="sidebar">
        <div class="side-card welcome-card">
          <span class="welcome-mark">✦</span>
          <h3>先讲证据，再讲态度</h3>
          <p>不造谣，不开盒，不泄露无关个人信息；标注来源与核验状态。</p>
        </div>

        <div class="side-card">
          <div class="side-title">
            <h3>热门标签</h3>
            <span>TAGS</span>
          </div>
          <div v-if="hotTags.length" class="tag-cloud">
            <button
              v-for="item in hotTags"
              :key="item.tag"
              :class="{ active: activeTag === item.tag }"
              type="button"
              @click="selectTag(item.tag)"
            >
              #{{ item.tag }}
              <small>{{ item.count }}</small>
            </button>
          </div>
          <p v-else class="side-empty">话题发布后标签会出现在这里</p>
        </div>

        <div class="side-card creator-card">
          <span>企业回应通道</span>
          <h3>被点名企业，也有完整回应的权利</h3>
          <router-link to="/submission">提交说明与佐证 →</router-link>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.community-page {
  color: #292724;
}

.page-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  margin-bottom: 38px;
}

.eyebrow {
  color: #a21d18;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.22em;
}

h1 {
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

.write-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 19px;
  border: 0;
  border-radius: 2px;
  background: #292724;
  color: white;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 4px 4px 0 #a21d18;
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.write-button:hover {
  background: #a21d18;
  box-shadow: 4px 4px 0 #292724;
}

.write-button span {
  color: #ef5b51;
  font-size: 18px;
}

.write-button:hover span {
  color: #f7d9d6;
}

.community-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  gap: 28px;
}

.feed {
  min-width: 0;
}

.feed-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e8ddd2;
}

.topic-tabs {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 6px;
}

.topic-tabs button {
  padding: 8px 14px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #8e7a69;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: 0.2s ease;
}

.topic-tabs button:hover,
.topic-tabs button.active {
  background: #292724;
  color: white;
}

.search-box {
  width: min(280px, 42%);
  height: 40px;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  border: 1px solid #bdb8ae;
  background: #f7f4ec;
}

.search-box > span {
  margin-left: 12px;
  color: #a21d18;
  font-size: 18px;
}

.search-box input {
  min-width: 0;
  height: 100%;
  flex: 1;
  outline: 0;
  padding: 0 9px;
  border: 0;
  background: transparent;
  color: #403a35;
  font-size: 12px;
}

.search-box button {
  width: 34px;
  height: 100%;
  border: 0;
  background: transparent;
  color: #9c8876;
  font-size: 17px;
  cursor: pointer;
}

.search-box:focus-within {
  border-color: #a21d18;
  box-shadow: 3px 3px 0 rgba(162, 29, 24, 0.16);
}

.filter-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  padding: 10px 14px;
  border-left: 3px solid #a21d18;
  background: rgba(233, 228, 217, 0.8);
  color: #7b6b5d;
  font-size: 12px;
}

.filter-summary b {
  color: #a21d18;
}

.filter-summary button {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: #a21d18;
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.post-list {
  display: grid;
  gap: 14px;
}

.post-card {
  padding: 24px 28px 18px;
  border: 1px solid #c7c1b7;
  border-radius: 2px;
  background: rgba(246, 244, 237, 0.82);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.post-card:hover {
  box-shadow: 5px 5px 0 rgba(41, 39, 36, 0.9);
  transform: translateY(-2px);
}

.post-meta {
  display: flex;
  align-items: center;
}

.avatar {
  width: 36px;
  height: 36px;
  display: grid;
  flex-shrink: 0;
  margin-right: 10px;
  place-items: center;
  border-radius: 50%;
  background: #292724;
  color: white;
  font-size: 13px;
  font-weight: 700;
}

.post-meta div {
  display: flex;
  flex-direction: column;
}

.post-meta strong {
  font-size: 12px;
}

.post-meta div span {
  margin-top: 2px;
  color: #ae9d8e;
  font-family: Georgia, serif;
  font-size: 11px;
}

.post-card h2 {
  margin: 17px 0 10px;
  font-family: 'Songti SC', STSong, serif;
  font-size: 21px;
  line-height: 1.45;
}

.post-card h2 a {
  color: inherit;
  text-decoration: none;
}

.post-card h2 a:hover {
  color: #a21d18;
}

.post-card > p {
  margin: 0;
  color: #7b6b5d;
  font-size: 13px;
  line-height: 1.75;
}

.post-images {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.post-images a {
  position: relative;
  width: 118px;
  height: 86px;
  overflow: hidden;
  border: 1px solid #d5cabf;
  background: #e5e0d5;
}

.post-images img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.post-images a:hover img {
  transform: scale(1.04);
}

.post-images b {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(41, 39, 36, 0.6);
  color: white;
  font-family: Georgia, serif;
  font-size: 17px;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 15px;
}

.post-tags button {
  padding: 5px 9px;
  border: 1px solid #d4bdb6;
  background: #eadbd6;
  color: #8f2924;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: 0.2s ease;
}

.post-tags button:hover,
.post-tags button.active {
  border-color: #a21d18;
  background: #a21d18;
  color: #f7f3ea;
}

.post-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 16px;
  padding-top: 13px;
  border-top: 1px solid #f0e8df;
}

.action-link,
.action-stat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #a08f7f;
  font-size: 12px;
  text-decoration: none;
}

.action-link:hover {
  color: #a21d18;
}

.action-stat {
  margin-left: auto;
}

.sidebar {
  display: grid;
  align-content: start;
  gap: 16px;
}

.side-card {
  padding: 24px;
  border: 1px solid #c7c1b7;
  border-radius: 2px;
  background: rgba(246, 244, 237, 0.78);
}

.welcome-card {
  background: #292724;
  color: white;
}

.welcome-mark {
  color: #ed5b51;
  font-size: 22px;
}

.side-card h3 {
  margin: 11px 0 8px;
  font-family: 'Songti SC', STSong, serif;
  font-size: 17px;
}

.welcome-card p {
  margin: 0;
  color: #cbbeb3;
  font-size: 12px;
  line-height: 1.7;
}

.side-card a {
  color: #a21d18;
  font-size: 11px;
  font-weight: 600;
  text-decoration: none;
}

.side-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  padding-bottom: 13px;
  border-bottom: 1px solid #eee5dc;
}

.side-title h3 {
  margin: 0;
}

.side-title > span {
  color: #baa998;
  font-size: 8px;
  letter-spacing: 0.18em;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.tag-cloud button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 9px;
  border: 1px solid #d9c7bc;
  background: #eee4df;
  color: #8a302b;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: 0.2s ease;
}

.tag-cloud button:hover,
.tag-cloud button.active {
  border-color: #a21d18;
  background: #a21d18;
  color: #f7f3ea;
}

.tag-cloud small {
  color: #b57772;
  font-family: Georgia, serif;
  font-size: 11px;
}

.tag-cloud button:hover small,
.tag-cloud button.active small {
  color: #f0cfcc;
}

.side-empty {
  margin: 0;
  color: #a0907f;
  font-size: 11px;
}

.creator-card {
  overflow: hidden;
  background:
    repeating-linear-gradient(-45deg, transparent 0 8px, rgba(162, 29, 24, 0.04) 8px 9px),
    #e7e2d8;
}

.creator-card > span {
  color: #a21d18;
  font-size: 9px;
  letter-spacing: 0.18em;
}

.creator-card h3 {
  max-width: 200px;
  margin-bottom: 16px;
  font-size: 19px;
  line-height: 1.5;
}

.empty-state {
  min-height: 240px;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  border: 1px dashed #c8bdb2;
  color: #9c8876;
}

.empty-state strong {
  color: #65574d;
  font-family: 'Songti SC', STSong, serif;
  font-size: 20px;
}

.empty-state span {
  margin-top: 8px;
  font-size: 11px;
}

.load-sentinel {
  min-height: 70px;
  display: grid;
  place-items: center;
  color: #9c8876;
  font-size: 10px;
}

@media (max-width: 900px) {
  .community-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 620px) {
  .page-heading {
    align-items: stretch;
    flex-direction: column;
    gap: 18px;
  }

  .feed-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .search-box {
    width: 100%;
  }

  .sidebar {
    grid-template-columns: 1fr;
  }

  .post-images a {
    width: calc((100% - 16px) / 3);
    height: 72px;
  }
}
</style>
