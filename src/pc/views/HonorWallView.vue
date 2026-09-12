<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useMessage } from 'naive-ui'

import StatIcon from '@/pc/components/interaction/StatIcon.vue'
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
const heroRef = ref(null)
const heroDocked = ref(false)
const hotArticles = ref([])
const hotLoading = ref(false)
let searchTimer
let observer
let heroObserver
let requestSerial = 0

const stats = computed(() => [
  { value: String(total.value), label: '已发布档案' },
  { value: String(articles.value.length), label: '当前已加载' },
  { value: '持续', label: '公开更新' },
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

  heroObserver = new IntersectionObserver(
    ([entry]) => {
      heroDocked.value = !entry.isIntersecting
    },
    { threshold: 0 },
  )
  if (heroRef.value) heroObserver.observe(heroRef.value)
})

onBeforeUnmount(() => {
  window.clearTimeout(searchTimer)
  observer?.disconnect()
  heroObserver?.disconnect()
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
  hotLoading.value = true
  try {
    const data = await getHotArticles({ limit: 8 })
    hotArticles.value = data.list
  } catch {
    hotArticles.value = []
  } finally {
    hotLoading.value = false
  }
}

function articleTags(value) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function formatDate(value) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

function authorName(userId) {
  return publicUserStore.getCachedUser(userId)?.nickname || '匿名投稿人'
}

function backToHero() {
  heroRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <section class="honor-page">
    <transition name="dock">
      <button v-if="heroDocked" class="hero-dock" type="button" @click="backToHero">
        <span class="eyebrow">CORPORATE<br />HONORS* · 2026</span>

        <span class="dock-medal" aria-hidden="true">
          <i>特别</i>
          <b>奖</b>
        </span>

        <span class="dock-title">请这些“优秀企业”<em>站到灯下</em></span>

        <span class="dock-meta">
          <strong>{{ total }}</strong>
          份已发布档案
        </span>

        <span class="dock-action">回到顶部 ↑</span>
      </button>
    </transition>

    <div ref="heroRef" class="hero">
      <div class="hero-copy">
        <span class="eyebrow">CORPORATE HONORS* · 2026</span>
        <h1>请这些“优秀企业”<br /><em>站到灯下</em></h1>
        <p>这里永久陈列那些不愿写进宣传稿的“先进事迹”。星号提示：本页所有荣誉称号均为反讽，收录内容以可核验事实为准。</p>
      </div>

      <div class="hero-emblem" aria-hidden="true">
        <span class="emblem-rays"></span>
        <div class="emblem-medal">
          <span>特别</span>
          <strong>奖</strong>
          <small>SHAME ON YOU</small>
        </div>
      </div>
    </div>

    <div class="stat-strip">
      <div v-for="stat in stats" :key="stat.label" class="stat-item">
        <strong>{{ stat.value }}</strong>
        <span>{{ stat.label }}</span>
      </div>
      <p>按发布时间倒序陈列</p>
    </div>

    <div class="section-heading">
      <div>
        <span class="eyebrow">ON THE RECORD</span>
        <h2>最新曝光档案</h2>
      </div>
      <label class="search-box">
        <span>⌕</span>
        <input
          v-model="searchInput"
          maxlength="100"
          placeholder="搜索公司或标签"
          type="search"
        />
        <button v-if="searchInput" type="button" aria-label="清空搜索" @click="searchInput = ''">
          ×
        </button>
      </label>
    </div>

    <div class="wall-body">
      <div class="wall-main">
        <div v-if="articles.length" class="article-list">
          <router-link
            v-for="article in articles"
            :key="article.id"
            class="article-card"
            :to="{ name: 'article-detail', params: { id: article.id } }"
          >
            <div class="article-cover">
              <img :src="resolveApiUrl(article.cover_url)" :alt="article.title" loading="lazy" />
            </div>
            <div class="article-body">
              <div class="article-heading">
                <h3>{{ article.title }}</h3>
                <small>档案编号 #{{ article.id }}</small>
              </div>
              <div class="article-company">
                <strong>{{ article.company_name }}</strong>
                <div class="tag-list">
                  <span v-for="tag in articleTags(article.company_tags)" :key="tag">
                    {{ tag }}
                  </span>
                </div>
              </div>
              <div class="article-footer">
                <span class="author">
                  <b>{{ authorName(article.created_by).slice(0, 1) }}</b>
                  {{ authorName(article.created_by) }}
                </span>
                <ul class="card-stats">
                  <li :class="{ active: article.liked }" title="附议数">
                    <StatIcon name="like" />
                    <b>{{ article.like_count }}</b>
                  </li>
                  <li title="浏览数">
                    <StatIcon name="view" />
                    <b>{{ article.browse_count }}</b>
                  </li>
                  <li title="评论数">
                    <StatIcon name="comment" />
                    <b>{{ article.comment_count }}</b>
                  </li>
                </ul>
                <time>{{ formatDate(article.created_at) }}</time>
              </div>
            </div>
          </router-link>
        </div>

        <div v-else-if="!loading" class="empty-state">
          <strong>{{ search ? '没有找到匹配档案' : '暂时没有已发布文章' }}</strong>
          <span>{{ search ? '尝试更换公司名或标签' : '已发布的投稿会出现在这里' }}</span>
        </div>

        <div ref="loadSentinel" class="load-sentinel">
          <span v-if="loading">正在调取更多档案…</span>
          <span v-else-if="articles.length && !hasMore">已显示全部 {{ total }} 篇档案</span>
        </div>
      </div>

      <aside class="hot-board">
        <div class="board-heading">
          <span class="eyebrow">HOT INDEX</span>
          <h3>热度榜</h3>
          <small>按附议数排序</small>
        </div>

        <ol v-if="hotArticles.length" class="board-list">
          <li
            v-for="(item, index) in hotArticles"
            :key="item.id"
            :class="{ podium: index < 3 }"
          >
            <router-link :to="{ name: 'article-detail', params: { id: item.id } }">
              <b class="rank">{{ String(index + 1).padStart(2, '0') }}</b>
              <span class="board-copy">
                <strong>{{ item.company_name }}</strong>
                <small>{{ item.title }}</small>
              </span>
              <span class="board-like" :class="{ active: item.liked }">
                <StatIcon name="like" />
                {{ item.like_count }}
              </span>
            </router-link>
          </li>
        </ol>

        <p v-else class="board-empty">
          {{ hotLoading ? '正在统计附议…' : '还没有档案被附议' }}
        </p>

        <p class="board-note">榜单在每次进入本页时重新统计。</p>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.honor-page {
  color: #292724;
}

.hero-dock {
  position: fixed;
  z-index: 12;
  top: 50%;
  left: max(14px, calc((100vw - min(1020px, 100vw - 320px)) / 2 - 170px));
  width: 156px;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 12px;
  padding: 16px 14px 14px;
  border: 2px solid #292724;
  background: #e8e4d9;
  color: #292724;
  font: inherit;
  text-align: left;
  cursor: pointer;
  box-shadow: 6px 6px 0 #292724;
  transform: translateY(-50%);
  transition:
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.hero-dock:hover {
  border-color: #a21d18;
  box-shadow: 8px 8px 0 #a21d18;
}

.hero-dock .eyebrow {
  font-size: 9px;
  line-height: 1.6;
}

.dock-medal {
  width: 62px;
  height: 62px;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  border: 2px solid #a21d18;
  border-radius: 50%;
  outline: 4px double rgba(162, 29, 24, 0.4);
  background: #eee9dd;
  color: #a21d18;
}

.dock-medal i {
  font-size: 8px;
  font-style: normal;
  letter-spacing: 0.24em;
  text-indent: 0.24em;
}

.dock-medal b {
  font-family: 'Songti SC', STSong, serif;
  font-size: 24px;
  line-height: 1.05;
}

.dock-title {
  font-family: 'Songti SC', STSong, serif;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: -0.02em;
}

.dock-title em {
  display: block;
  color: #a21d18;
  font-style: normal;
}

.dock-meta {
  width: 100%;
  padding-top: 10px;
  border-top: 1px solid rgba(41, 39, 36, 0.2);
  color: #625e58;
  font-size: 10px;
}

.dock-meta strong {
  margin-right: 4px;
  color: #a21d18;
  font-size: 15px;
}

.dock-action {
  color: #a21d18;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.dock-enter-active,
.dock-leave-active {
  transition:
    opacity 0.24s ease,
    transform 0.24s ease;
}

.dock-enter-from,
.dock-leave-to {
  opacity: 0;
  transform: translate(-22px, -50%);
}

.hero {
  position: relative;
  min-height: 390px;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 58px 68px;
  border: 2px solid #292724;
  border-radius: 2px;
  background:
    linear-gradient(90deg, transparent 49.7%, rgba(41, 39, 36, 0.04) 50%, transparent 50.3%),
    #e8e4d9;
  box-shadow: 10px 10px 0 #292724;
}

.hero::before {
  position: absolute;
  width: 300px;
  height: 300px;
  border: 1px solid rgba(150, 94, 42, 0.12);
  border-radius: 50%;
  content: '';
  right: -90px;
  top: -120px;
}

.hero-copy {
  position: relative;
  z-index: 2;
  max-width: 590px;
}

.eyebrow {
  color: #a21d18;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.22em;
}

h1 {
  margin: 20px 0;
  font-family: 'Songti SC', STSong, serif;
  font-size: clamp(44px, 5vw, 68px);
  font-weight: 700;
  line-height: 1.13;
  letter-spacing: -0.04em;
}

h1 em {
  color: #a21d18;
  font-style: normal;
}

.hero-copy p {
  max-width: 500px;
  margin: 0;
  color: #625e58;
  font-size: 15px;
  line-height: 1.9;
}

.hero-emblem {
  position: absolute;
  right: 78px;
  display: grid;
  width: 232px;
  height: 232px;
  place-items: center;
}

.emblem-rays {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: repeating-conic-gradient(
    from 0deg,
    rgba(162, 29, 24, 0.22) 0deg 5deg,
    transparent 5deg 15deg
  );
  mask: radial-gradient(circle, transparent 0 48%, #000 49%);
}

.emblem-medal {
  width: 148px;
  height: 148px;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  border: 3px solid #a21d18;
  border-radius: 50%;
  outline: 7px double rgba(162, 29, 24, 0.4);
  background: #eee9dd;
  color: #a21d18;
  box-shadow: 0 16px 30px rgba(41, 39, 36, 0.16);
}

.emblem-medal span {
  font-size: 12px;
  letter-spacing: 0.38em;
  text-indent: 0.38em;
}

.emblem-medal strong {
  margin: 2px 0;
  font-family: 'Songti SC', STSong, serif;
  font-size: 52px;
  line-height: 1;
}

.emblem-medal small {
  font-size: 8px;
  letter-spacing: 0.18em;
}

.stat-strip {
  display: flex;
  align-items: center;
  gap: 62px;
  margin: 24px 0 68px;
  padding: 22px 34px;
  border-radius: 0;
  background: #292724;
  color: #f2f0e9;
}

.stat-item {
  display: flex;
  align-items: baseline;
  gap: 9px;
}

.stat-item strong {
  color: #e85b50;
  font-size: 22px;
}

.stat-item span,
.stat-strip p {
  color: #c7b9aa;
  font-size: 12px;
}

.stat-strip p {
  margin: 0 0 0 auto;
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  margin-bottom: 26px;
}

.section-heading h2 {
  margin: 8px 0 0;
  font-family: 'Songti SC', STSong, serif;
  font-size: 31px;
}

.search-box {
  width: min(360px, 46%);
  height: 44px;
  display: flex;
  align-items: center;
  border: 1px solid #bdb8ae;
  background: #f7f4ec;
}

.search-box > span {
  margin-left: 14px;
  color: #a21d18;
  font-size: 20px;
}

.search-box input {
  min-width: 0;
  height: 100%;
  flex: 1;
  outline: 0;
  padding: 0 10px;
  border: 0;
  background: transparent;
  color: #403a35;
  font-size: 12px;
}

.search-box button {
  width: 38px;
  height: 100%;
  border: 0;
  background: transparent;
  color: #9c8876;
  font-size: 18px;
  cursor: pointer;
}

.search-box:focus-within {
  border-color: #a21d18;
  box-shadow: 3px 3px 0 rgba(162, 29, 24, 0.16);
}

.wall-body {
  display: grid;
  align-items: start;
  grid-template-columns: minmax(0, 1fr) 268px;
  gap: 26px;
}

.wall-main {
  min-width: 0;
}

.hot-board {
  position: sticky;
  top: 4px;
  border: 2px solid #292724;
  background: #e8e4d9;
  box-shadow: 6px 6px 0 #292724;
}

.board-heading {
  padding: 16px 16px 13px;
  border-bottom: 2px solid #292724;
}

.board-heading h3 {
  margin: 6px 0 0;
  font-family: 'Songti SC', STSong, serif;
  font-size: 21px;
}

.board-heading small {
  display: block;
  margin-top: 4px;
  color: #8d7d70;
  font-size: 11px;
}

.board-list {
  margin: 0;
  padding: 6px 0;
  list-style: none;
}

.board-list li + li {
  border-top: 1px dashed #d3c9bd;
}

.board-list a {
  display: grid;
  align-items: center;
  grid-template-columns: 30px minmax(0, 1fr) auto;
  gap: 10px;
  padding: 11px 14px;
  color: inherit;
  text-decoration: none;
  transition: background 0.2s ease;
}

.board-list a:hover {
  background: rgba(162, 29, 24, 0.07);
}

.rank {
  color: #b3a294;
  font-family: Georgia, serif;
  font-size: 17px;
}

.board-list .podium .rank {
  color: #a21d18;
}

.board-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.board-copy strong {
  overflow: hidden;
  color: #3a332d;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.board-list a:hover .board-copy strong {
  color: #a21d18;
}

.board-copy small {
  overflow: hidden;
  margin-top: 3px;
  color: #8d7d70;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.board-like {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #6d635a;
  font-family: Georgia, serif;
  font-size: 14px;
}

.board-like svg {
  color: #b3a294;
  font-size: 13px;
}

.board-like.active svg {
  color: #a21d18;
}

.board-empty {
  margin: 0;
  padding: 26px 16px;
  color: #9c8876;
  font-size: 12px;
  text-align: center;
}

.board-note {
  margin: 0;
  padding: 11px 14px;
  border-top: 1px solid #d3c9bd;
  color: #a0907f;
  font-size: 11px;
  line-height: 1.6;
}

.article-list {
  display: grid;
  gap: 14px;
}

.article-card {
  min-height: 154px;
  display: grid;
  overflow: hidden;
  grid-template-columns: 230px minmax(0, 1fr);
  border: 1px solid #bdb8ae;
  background: rgba(246, 244, 237, 0.88);
  color: inherit;
  text-decoration: none;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.article-card:hover {
  border-color: #a21d18;
  box-shadow: 6px 6px 0 #292724;
  transform: translateY(-3px);
}

.article-cover {
  position: relative;
  min-height: 152px;
  overflow: hidden;
  background: #d8d2c8;
}

.article-cover img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.article-card:hover .article-cover img {
  transform: scale(1.025);
}

.article-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 17px 22px 13px;
}

.article-heading {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 20px;
}

.article-heading h3 {
  margin: 0;
  color: #332c27;
  font-family: 'Songti SC', STSong, serif;
  font-size: 20px;
  line-height: 1.3;
}

.article-heading small {
  flex-shrink: 0;
  color: #aa998c;
  font-family: Georgia, serif;
  font-size: 16px;
}

.article-company {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 14px;
}

.article-company strong {
  color: #a21d18;
  font-size: 16px;
  letter-spacing: 0.06em;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-list span {
  padding: 5px 9px;
  border: 1px solid #d9c7bc;
  background: #eee4df;
  color: #8a302b;
  font-size: 16px;
}

.article-footer {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin-top: auto;
  padding-top: 9px;
  border-top: 1px solid #e0d6cc;
}

.card-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 0 0 0 auto;
  padding: 0;
  list-style: none;
}

.card-stats li {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #8f7f72;
  font-size: 14px;
}

.card-stats svg {
  color: #b3a294;
}

.card-stats li.active svg {
  color: #a21d18;
}

.card-stats b {
  color: #5b5148;
  font-family: Georgia, serif;
  font-size: 15px;
}

.author {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #66574d;
  font-size: 16px;
}

.author b {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #292724;
  color: white;
  font-size: 16px;
}

.article-footer time {
  color: #9c8876;
  font-family: Georgia, serif;
  font-size: 16px;
}

.empty-state {
  min-height: 260px;
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

@media (max-width: 1200px) {
  .hero-dock {
    display: none;
  }
}

/* 正文区放不下侧栏时改为上下排列，榜单置顶避免被无限列表埋掉 */
@media (max-width: 1040px) {
  .wall-body {
    grid-template-columns: minmax(0, 1fr);
  }

  .hot-board {
    position: static;
    order: -1;
  }
}

@media (max-width: 900px) {
  .hero-emblem {
    right: -30px;
    opacity: 0.32;
  }

  .stat-strip {
    gap: 24px;
  }

  .article-card {
    grid-template-columns: 190px minmax(0, 1fr);
  }
}

@media (max-width: 620px) {
  .section-heading {
    align-items: stretch;
    flex-direction: column;
    gap: 16px;
  }

  .search-box {
    width: 100%;
  }

  .stat-strip {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .stat-strip p {
    width: 100%;
    margin-left: 0;
  }

  .article-card {
    grid-template-columns: 1fr;
  }

  .article-cover {
    height: 200px;
    min-height: 0;
  }

  .article-body {
    min-height: 190px;
    padding: 19px 18px 15px;
  }

  .article-heading h3 {
    font-size: 20px;
  }
}
</style>
