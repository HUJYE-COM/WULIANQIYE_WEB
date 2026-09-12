<script setup>
import { computed, onMounted, ref } from 'vue'
import DOMPurify from 'dompurify'
import { MdPreview } from 'md-editor-v3'
import { useRoute } from 'vue-router'
import 'md-editor-v3/lib/preview.css'

import InteractionPanel from '@/pc/components/interaction/InteractionPanel.vue'
import StatIcon from '@/pc/components/interaction/StatIcon.vue'
import { getArticle } from '@/api/article'
import { recordBrowse } from '@/api/browse'
import { getFileDownloadUrl } from '@/api/file'
import { getErrorMessage } from '@/constants/errorCodes'
import { usePublicUserStore } from '@/stores/publicUser'

const route = useRoute()
const publicUserStore = usePublicUserStore()
const article = ref(null)
const loading = ref(true)
const errorMessage = ref('')

const author = computed(() =>
  article.value ? publicUserStore.getCachedUser(article.value.created_by) : null,
)
const tags = computed(() =>
  (article.value?.company_tags || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean),
)

const attachmentTypeNames = {
  image: '图片',
  video: '视频',
  audio: '录音',
  other: '其他材料',
}

onMounted(loadArticle)

async function loadArticle() {
  const id = Number(route.params.id)
  if (!Number.isSafeInteger(id) || id <= 0) {
    errorMessage.value = '文章地址无效'
    loading.value = false
    return
  }
  try {
    article.value = await getArticle(id)
    document.title = `${article.value.title} · 无良企业荣誉馆`
    await publicUserStore.fetchUser(article.value.created_by).catch(() => null)
    countBrowse(id)
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  } finally {
    loading.value = false
  }
}

// 浏览量按次累计，草稿预览不计入，失败不影响正文阅读。
async function countBrowse(id) {
  if (article.value?.status !== 'published') return
  try {
    const result = await recordBrowse({ target_type: 'article', target_id: id })
    article.value.browse_count = result.count
  } catch {
    // 浏览记录失败时保留详情接口返回的计数
  }
}

function applyStats(stats) {
  article.value.like_count = stats.like_count
  article.value.liked = stats.liked
  article.value.comment_count = stats.comment_count
}

function sanitizeHtml(html) {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
  })
}

function formatDate(value) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
</script>

<template>
  <article class="detail-page">
    <router-link class="back-link" to="/honor-wall">← 返回曝光档案</router-link>

    <div v-if="loading" class="page-state">正在调取档案…</div>
    <div v-else-if="errorMessage" class="page-state error">
      <strong>档案读取失败</strong>
      <span>{{ errorMessage }}</span>
    </div>

    <template v-else-if="article">
      <header class="article-header">
        <div class="cover">
          <img :src="article.cover_url" :alt="article.title" />
          <span>CASE #{{ article.id }}</span>
        </div>

        <div class="header-content">
          <span class="company">{{ article.company_name }}</span>
          <h1>{{ article.title }}</h1>
          <div class="tag-list">
            <span v-for="tag in tags" :key="tag">{{ tag }}</span>
          </div>
          <div class="meta">
            <span class="author-avatar">{{ (author?.nickname || '匿').slice(0, 1) }}</span>
            <span>
              <b>{{ author?.nickname || '匿名投稿人' }}</b>
              <small>投稿作者</small>
            </span>
            <time>{{ formatDate(article.created_at) }}</time>
          </div>

          <ul class="header-stats">
            <li :class="{ active: article.liked }">
              <StatIcon name="like" />
              <b>{{ article.like_count }}</b>
              <span>附议</span>
            </li>
            <li>
              <StatIcon name="view" />
              <b>{{ article.browse_count }}</b>
              <span>围观</span>
            </li>
            <li>
              <StatIcon name="comment" />
              <b>{{ article.comment_count }}</b>
              <span>评论</span>
            </li>
          </ul>
        </div>
      </header>

      <section class="article-content">
        <div class="content-heading">
          <span>PUBLIC RECORD</span>
          <strong>公开记录正文</strong>
        </div>
        <MdPreview
          :model-value="article.content"
          :sanitize="sanitizeHtml"
          language="zh-CN"
          no-mermaid
        />
      </section>

      <section v-if="article.attachments?.length" class="attachments">
        <div class="attachments-heading">
          <span>EVIDENCE FILES</span>
          <h2>相关证据材料</h2>
          <small>{{ article.attachments.length }} 份</small>
        </div>
        <div class="attachment-list">
          <a
            v-for="attachment in article.attachments"
            :key="attachment.id"
            :href="getFileDownloadUrl(attachment.file_id)"
            target="_blank"
          >
            <span :class="attachment.type">{{ attachmentTypeNames[attachment.type] }}</span>
            <strong>{{ attachment.attachment_name }}</strong>
            <small>下载查看 ↗</small>
          </a>
        </div>
      </section>

      <InteractionPanel
        v-if="article.status === 'published'"
        :target-id="article.id"
        :owner-id="article.created_by"
        :like-count="article.like_count"
        :liked="article.liked"
        :comment-count="article.comment_count"
        :browse-count="article.browse_count"
        @stats-change="applyStats"
      />

      <footer class="record-note">
        本页内容由用户投稿。涉及事实判断时，请以原始证据、监管记录及相关方回应为准。
      </footer>
    </template>
  </article>
</template>

<style scoped>
.detail-page {
  color: #292724;
}

.back-link {
  display: inline-block;
  margin-bottom: 20px;
  color: #a21d18;
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
}

.article-header {
  display: grid;
  overflow: hidden;
  grid-template-columns: minmax(260px, 0.82fr) minmax(380px, 1.18fr);
  border: 2px solid #292724;
  background: #ebe7dc;
  box-shadow: 9px 9px 0 #292724;
}

.cover {
  position: relative;
  min-height: 310px;
  overflow: hidden;
  background: #d8d2c8;
}

.cover img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.cover > span {
  position: absolute;
  left: 17px;
  bottom: 17px;
  padding: 7px 10px;
  background: rgba(41, 39, 36, 0.86);
  color: white;
  font-family: Georgia, serif;
  font-size: 16px;
  letter-spacing: 0.12em;
}

.header-content {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  padding: 34px 38px 26px;
}

.company {
  color: #a21d18;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.header-content h1 {
  margin: 12px 0 18px;
  font-family: 'Songti SC', STSong, serif;
  font-size: clamp(30px, 3.5vw, 42px);
  line-height: 1.18;
  letter-spacing: -0.04em;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.tag-list span {
  padding: 6px 10px;
  border: 1px solid #d4bdb6;
  background: #eadbd6;
  color: #8f2924;
  font-size: 16px;
}

.meta {
  width: 100%;
  display: flex;
  align-items: center;
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid #d5cabf;
}

.author-avatar {
  width: 42px;
  height: 42px;
  display: grid;
  flex-shrink: 0;
  margin-right: 10px;
  place-items: center;
  border-radius: 50%;
  background: #292724;
  color: white;
  font-size: 16px;
}

.meta > span:nth-child(2) {
  display: flex;
  flex-direction: column;
}

.meta b {
  font-size: 16px;
}

.meta small {
  margin-top: 3px;
  color: #9f8e81;
  font-size: 16px;
}

.meta time {
  margin-left: auto;
  color: #8e7d70;
  font-family: Georgia, serif;
  font-size: 16px;
}

.header-stats {
  width: 100%;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
  margin: 14px 0 0;
  padding: 13px 0 0;
  border-top: 1px dashed #d5cabf;
  list-style: none;
}

.header-stats li {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #8e7d70;
  font-size: 13px;
}

.header-stats svg {
  color: #b5a496;
  font-size: 15px;
}

.header-stats li.active svg {
  color: #a21d18;
}

.header-stats b {
  color: #453e38;
  font-family: Georgia, serif;
  font-size: 17px;
}

.article-content {
  margin-top: 30px;
  padding: 26px 18px 36px;
  border-top: 1px solid #c9c0b6;
  border-bottom: 1px solid #c9c0b6;
  background: transparent;
}

.content-heading {
  display: flex;
  flex-direction: column;
  margin-bottom: 30px;
  padding-bottom: 17px;
  border-bottom: 2px solid #292724;
}

.content-heading span,
.attachments-heading > span {
  color: #a21d18;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.22em;
}

.content-heading strong {
  margin-top: 5px;
  font-family: 'Songti SC', STSong, serif;
  font-size: 22px;
}

:deep(.md-editor-preview-wrapper) {
  padding: 0;
  background: transparent !important;
}

:deep(.md-editor-preview) {
  background: transparent !important;
  color: #3d3732;
  font-size: 15px;
  line-height: 1.9;
}

:deep(.md-editor),
:deep(.md-editor-previewOnly),
:deep(.md-editor-content) {
  background: transparent !important;
}

.attachments {
  margin-top: 25px;
  padding: 22px 26px;
  border: 1px solid #c9c0b6;
  background: #e7e2d8;
}

.attachments-heading {
  position: relative;
}

.attachments-heading h2 {
  margin: 5px 0 18px;
  font-family: 'Songti SC', STSong, serif;
  font-size: 21px;
}

.attachments-heading small {
  position: absolute;
  right: 0;
  bottom: 3px;
  color: #9d8d80;
  font-size: 9px;
}

.attachment-list {
  display: grid;
  gap: 8px;
}

.attachment-list a {
  display: grid;
  align-items: center;
  grid-template-columns: 90px minmax(0, 1fr) auto;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #d4c8bc;
  background: #f6f2e9;
  color: #4c4139;
  text-decoration: none;
}

.attachment-list a:hover {
  border-color: #a21d18;
}

.attachment-list a > span {
  padding: 5px;
  background: #e5d8d3;
  color: #902a25;
  font-size: 16px;
  text-align: center;
}

.attachment-list strong {
  overflow: hidden;
  font-size: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-list small {
  color: #a21d18;
  font-size: 16px;
}

.record-note {
  margin-top: 22px;
  padding: 17px 20px;
  border-left: 4px solid #a21d18;
  background: rgba(229, 225, 215, 0.9);
  color: #7d6d61;
  font-size: 10px;
  line-height: 1.7;
}

.page-state {
  min-height: 420px;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  border: 1px dashed #c9c0b6;
  color: #89796d;
}

.page-state strong {
  color: #a21d18;
  font-family: 'Songti SC', STSong, serif;
  font-size: 22px;
}

.page-state span {
  margin-top: 9px;
  font-size: 11px;
}

@media (max-width: 820px) {
  .article-header {
    grid-template-columns: 1fr;
  }

  .cover {
    min-height: 240px;
  }

  .header-content {
    min-height: 290px;
    padding: 28px 24px 22px;
  }

  .article-content {
    padding: 24px 4px 32px;
  }
}

@media (max-width: 560px) {
  .meta {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .meta time {
    width: 100%;
    margin: 10px 0 0 46px;
  }

  .attachment-list a {
    grid-template-columns: 62px minmax(0, 1fr);
  }

  .attachment-list small {
    display: none;
  }
}
</style>
