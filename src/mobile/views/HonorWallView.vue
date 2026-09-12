<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useMessage } from 'naive-ui'

import StatIcon from '@/mobile/components/icons/StatIcon.vue'
import { articleTags, formatDate, initial } from '@/mobile/utils/format'
import { getHotArticles, getPublishedArticles } from '@/api/article'
import { resolveApiUrl } from '@/api/file'
import { getErrorMessage } from '@/constants/errorCodes'
import { usePublicUserStore } from '@/stores/publicUser'

const message = useMessage()
const publicUserStore = usePublicUserStore()
const articles = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 8
const loading = ref(false)
const hasMore = ref(true)
const searchInput = ref('')
const search = ref('')
const loadSentinel = ref(null)
const hotArticles = ref([])
let searchTimer
let observer
let requestSerial = 0

const stats = computed(() => [
  { value: String(total.value), label: '档案' },
  { value: String(articles.value.length), label: '已载' },
  { value: '持续', label: '更新' },
])

watch(searchInput, (value) => {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    search.value = value.trim()
    loadArticles(true)
  }, 350)
})

onMounted(async () => {
  loadHotArticles()
  await loadArticles(true)
  await nextTick()
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) loadArticles()
    },
    { rootMargin: '240px 0px' },
  )
  if (loadSentinel.value) observer.observe(loadSentinel.value)
})

onBeforeUnmount(() => {
  window.clearTimeout(searchTimer)
  observer?.disconnect()
})

async function loadArticles(reset = false) {
  if (!reset && (loading.value || !hasMore.value)) return
  if (reset) {
    page.value = 1
    articles.value = []
    hasMore.value = true
  }
  const requestID = ++requestSerial
  loading.value = true
  try {
    const data = await getPublishedArticles({
      page: page.value,
      page_size: pageSize,
      search: search.value || undefined,
    })
    if (requestID !== requestSerial) return
    total.value = data.total
    const existingIds = new Set(articles.value.map((item) => item.id))
    const newArticles = data.list.filter((item) => !existingIds.has(item.id))
    articles.value.push(...newArticles)
    new Set(newArticles.map((item) => item.created_by)).forEach((userId) => {
      publicUserStore.fetchUser(userId).catch(() => null)
    })
    hasMore.value = articles.value.length < data.total
    if (hasMore.value) page.value += 1
  } catch (error) {
    if (requestID !== requestSerial) return
    message.error(getErrorMessage(error))
  } finally {
    if (requestID === requestSerial) loading.value = false
  }
}

async function loadHotArticles() {
  try {
    const data = await getHotArticles({ limit: 8 })
    hotArticles.value = data.list
  } catch {
    hotArticles.value = []
  }
}

function authorName(userId) {
  return publicUserStore.getCachedUser(userId)?.nickname || '匿名投稿人'
}
</script>

<template>
  <section class="wall">
    <div class="hero">
      <span class="eyebrow">HONORS* · 2026</span>
      <h1>请这些“优秀企业”<em>站到灯下</em></h1>
      <p>本馆陈列用户投稿的“先进事迹”。荣誉称号均为反讽。</p>
      <div class="medal" aria-hidden="true">
        <small>特别</small>
        <b>奖</b>
      </div>
    </div>

    <div class="stats">
      <div v-for="stat in stats" :key="stat.label">
        <strong>{{ stat.value }}</strong>
        <span>{{ stat.label }}</span>
      </div>
    </div>

    <section v-if="hotArticles.length" class="hot">
      <div class="hot-head">
        <h2>热度榜</h2>
        <small>按附议排序</small>
      </div>
      <div class="hot-scroller">
        <router-link
          v-for="(item, index) in hotArticles"
          :key="item.id"
          :to="{ name: 'article-detail', params: { id: item.id } }"
        >
          <b :class="{ top: index < 3 }">{{ String(index + 1).padStart(2, '0') }}</b>
          <strong>{{ item.company_name }}</strong>
          <small>{{ item.title }}</small>
          <em><StatIcon name="like" /> {{ item.like_count }}</em>
        </router-link>
      </div>
    </section>

    <label class="search">
      <span>⌕</span>
      <input v-model="searchInput" maxlength="100" placeholder="搜索公司或标签" type="search" />
    </label>

    <article
      v-for="article in articles"
      :key="article.id"
      class="card"
    >
      <router-link :to="{ name: 'article-detail', params: { id: article.id } }">
        <img :src="resolveApiUrl(article.cover_url)" :alt="article.title" loading="lazy" />
        <div class="copy">
          <small>#{{ article.id }} · {{ article.company_name }}</small>
          <h3>{{ article.title }}</h3>
          <div class="tags">
            <span v-for="tag in articleTags(article.company_tags).slice(0, 3)" :key="tag">{{ tag }}</span>
          </div>
          <div class="meta">
            <span class="author">
              <i>{{ initial(authorName(article.created_by)) }}</i>
              {{ authorName(article.created_by) }}
            </span>
            <ul>
              <li :class="{ on: article.liked }"><StatIcon name="like" />{{ article.like_count }}</li>
              <li><StatIcon name="view" />{{ article.browse_count }}</li>
              <li><StatIcon name="comment" />{{ article.comment_count }}</li>
            </ul>
            <time>{{ formatDate(article.created_at) }}</time>
          </div>
        </div>
      </router-link>
    </article>

    <div v-if="!loading && !articles.length" class="empty">
      {{ search ? '没有匹配档案' : '暂时没有已发布文章' }}
    </div>
    <div ref="loadSentinel" class="sentinel">
      <span v-if="loading">正在调取档案…</span>
      <span v-else-if="articles.length && !hasMore">已显示全部 {{ total }} 篇</span>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  padding: 22px 18px 20px;
  border: 2px solid #292724;
  background: #e8e2d4;
  box-shadow: 6px 6px 0 #292724;
}

.eyebrow {
  color: #a21d18;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
}

h1 {
  max-width: 78%;
  margin: 10px 0;
  font-family: 'Songti SC', STSong, serif;
  font-size: 30px;
  line-height: 1.2;
}

h1 em {
  color: #a21d18;
  font-style: normal;
}

.hero p {
  max-width: 78%;
  margin: 0;
  color: #6d635a;
  font-size: 12px;
  line-height: 1.7;
}

.medal {
  position: absolute;
  right: 14px;
  bottom: 16px;
  width: 68px;
  height: 68px;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  border: 2px solid #a21d18;
  border-radius: 50%;
  color: #a21d18;
  background: #f3efe4;
}

.medal b {
  font-family: 'Songti SC', STSong, serif;
  font-size: 22px;
  line-height: 1;
}

.medal small {
  font-size: 9px;
  letter-spacing: 0.2em;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: 14px 0 18px;
  background: #292724;
  color: #f2efe6;
}

.stats div {
  padding: 12px 8px;
  text-align: center;
}

.stats strong {
  display: block;
  color: #ef6c62;
  font-size: 18px;
}

.stats span {
  color: #c7b9aa;
  font-size: 11px;
}

.hot-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

h2 {
  margin: 0;
  font-family: 'Songti SC', STSong, serif;
  font-size: 20px;
}

.hot-head small {
  color: #8a7b6e;
  font-size: 11px;
}

.hot-scroller {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 6px;
  scroll-snap-type: x mandatory;
}

.hot-scroller a {
  width: 148px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border: 1px solid #292724;
  background: #f7f3ea;
  text-decoration: none;
  scroll-snap-align: start;
}

.hot-scroller b {
  color: #b3a294;
  font-family: Georgia, serif;
  font-size: 16px;
}

.hot-scroller b.top {
  color: #a21d18;
}

.hot-scroller strong,
.hot-scroller small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hot-scroller strong {
  font-size: 13px;
}

.hot-scroller small {
  color: #8a7b6e;
  font-size: 11px;
}

.hot-scroller em {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  color: #a21d18;
  font-family: Georgia, serif;
  font-style: normal;
}

.search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  margin: 18px 0 14px;
  padding: 0 12px;
  border: 1px solid #c8bdb2;
  background: #faf6ee;
}

.search span {
  color: #a21d18;
}

.search input {
  min-width: 0;
  flex: 1;
  height: 100%;
  border: 0;
  outline: 0;
  background: transparent;
}

.card {
  margin-bottom: 14px;
  border: 1px solid #c8bdb2;
  background: #f7f3ea;
  box-shadow: 4px 4px 0 rgba(41, 39, 36, 0.12);
}

.card a {
  display: block;
  text-decoration: none;
}

.card img {
  width: 100%;
  height: 168px;
  display: block;
  object-fit: cover;
}

.copy {
  padding: 12px 14px 13px;
}

.copy small {
  color: #a21d18;
  font-size: 11px;
  letter-spacing: 0.04em;
}

.copy h3 {
  margin: 6px 0 8px;
  font-family: 'Songti SC', STSong, serif;
  font-size: 19px;
  line-height: 1.35;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tags span {
  padding: 3px 7px;
  background: #eadbd6;
  color: #8a302b;
  font-size: 11px;
}

.meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #eadfd4;
}

.author {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #66574d;
  font-size: 12px;
}

.author i {
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #292724;
  color: white;
  font-size: 11px;
  font-style: normal;
}

.meta ul {
  display: flex;
  gap: 10px;
  margin: 0 0 0 auto;
  padding: 0;
  list-style: none;
  color: #8a7b6e;
  font-size: 12px;
}

.meta li {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.meta li.on {
  color: #a21d18;
}

.meta time {
  width: 100%;
  color: #9c8876;
  font-size: 11px;
}

.empty,
.sentinel {
  padding: 20px 0;
  color: #9c8876;
  font-size: 12px;
  text-align: center;
}
</style>
