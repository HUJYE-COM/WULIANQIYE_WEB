<script setup>
import { computed, onMounted, ref } from 'vue'
import DOMPurify from 'dompurify'
import { MdPreview } from 'md-editor-v3'
import { useRoute } from 'vue-router'
import 'md-editor-v3/lib/preview.css'

import InteractionPanel from '@/mobile/components/interaction/InteractionPanel.vue'
import ImageLightbox from '@/components/ImageLightbox.vue'
import StatIcon from '@/mobile/components/icons/StatIcon.vue'
import { articleTags, displayName, formatDate, initial } from '@/mobile/utils/format'
import { getArticle } from '@/api/article'
import { recordBrowse } from '@/api/browse'
import { getFileDownloadUrl, getFilePreviewUrl, resolveApiUrl, resolveContentUrls } from '@/api/file'
import { getErrorMessage } from '@/constants/errorCodes'
import { usePublicUserStore } from '@/stores/publicUser'

const route = useRoute()
const publicUserStore = usePublicUserStore()
const article = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const previewSrc = ref('')
const author = computed(() =>
  article.value ? publicUserStore.getCachedUser(article.value.created_by) : null,
)
const tags = computed(() => articleTags(article.value?.company_tags))
const previewContent = computed(() => resolveContentUrls(article.value?.content || ''))
const typeNames = { image: '图片', video: '视频', audio: '录音', other: '材料' }

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

async function countBrowse(id) {
  if (article.value?.status !== 'published') return
  try {
    const result = await recordBrowse({ target_type: 'article', target_id: id })
    article.value.browse_count = result.count
  } catch {
    // 保留详情计数
  }
}

function applyStats(stats) {
  article.value.like_count = stats.like_count
  article.value.liked = stats.liked
  article.value.comment_count = stats.comment_count
}

function sanitizeHtml(html) {
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
}

function openPreview(src) {
  if (src) previewSrc.value = resolveApiUrl(src)
}

function onBodyClick(event) {
  const img = event.target.closest('img')
  if (img?.src) openPreview(img.src)
}

function onAttachmentClick(event, item) {
  if (item.type !== 'image') return
  event.preventDefault()
  openPreview(getFilePreviewUrl(item.file_id))
}
</script>

<template>
  <article class="detail">
    <div v-if="loading" class="state">正在调取档案…</div>
    <div v-else-if="errorMessage" class="state">{{ errorMessage }}</div>
    <template v-else-if="article">
      <div class="cover">
        <button type="button" @click="openPreview(article.cover_url)">
          <img :src="resolveApiUrl(article.cover_url)" :alt="article.title" />
        </button>
        <span>CASE #{{ article.id }}</span>
      </div>
      <div class="head">
        <em>{{ article.company_name }}</em>
        <h1>{{ article.title }}</h1>
        <div class="tags">
          <span v-for="tag in tags" :key="tag">{{ tag }}</span>
        </div>
        <div class="who">
          <i>{{ initial(displayName(author, '匿')) }}</i>
          <span>
            <b>{{ displayName(author, '匿名投稿人') }}</b>
            <small>{{ formatDate(article.created_at, 'long') }}</small>
          </span>
        </div>
        <ul class="nums">
          <li :class="{ on: article.liked }"><StatIcon name="like" /> {{ article.like_count }}</li>
          <li><StatIcon name="view" /> {{ article.browse_count }}</li>
          <li><StatIcon name="comment" /> {{ article.comment_count }}</li>
        </ul>
      </div>
      <section class="body" @click="onBodyClick">
        <strong>公开记录</strong>
        <MdPreview :model-value="previewContent" :sanitize="sanitizeHtml" language="zh-CN" no-mermaid />
      </section>
      <section v-if="article.attachments?.length" class="files">
        <strong>证据材料 {{ article.attachments.length }}</strong>
        <a
          v-for="item in article.attachments"
          :key="item.id"
          :href="getFileDownloadUrl(item.file_id)"
          target="_blank"
          @click="onAttachmentClick($event, item)"
        >
          <i>{{ typeNames[item.type] }}</i>
          <span>{{ item.attachment_name }}</span>
        </a>
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
      <p class="note">内容纯属虚构，如有雷同，纯属巧合。</p>
    </template>
    <ImageLightbox :src="previewSrc" @close="previewSrc = ''" />
  </article>
</template>

<style scoped>
.cover {
  position: relative;
  margin: -16px -16px 0;
}

.cover button {
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: zoom-in;
}

.cover img {
  width: 100%;
  height: 220px;
  object-fit: cover;
}

.cover span {
  position: absolute;
  left: 14px;
  bottom: 14px;
  padding: 5px 8px;
  background: rgba(41, 39, 36, 0.86);
  color: white;
  font-family: Georgia, serif;
  font-size: 12px;
}

.head {
  padding: 16px 0 8px;
}

.head em {
  color: #a21d18;
  font-size: 12px;
  font-style: normal;
  font-weight: 800;
  letter-spacing: 0.08em;
}

h1 {
  margin: 8px 0 10px;
  font-family: 'Songti SC', STSong, serif;
  font-size: 26px;
  line-height: 1.25;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tags span {
  padding: 4px 8px;
  background: #eadbd6;
  color: #8f2924;
  font-size: 12px;
}

.who {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
}

.who i {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #292724;
  color: white;
  font-style: normal;
}

.who span {
  display: flex;
  flex-direction: column;
}

.who small {
  color: #9f8e81;
  font-size: 11px;
}

.nums {
  display: flex;
  gap: 16px;
  margin: 14px 0 0;
  padding: 12px 0 0;
  border-top: 1px dashed #d5cabf;
  list-style: none;
  color: #8e7d70;
}

.nums li {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.nums .on {
  color: #a21d18;
}

.body,
.files {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #d5cabf;
}

.body strong,
.files strong {
  display: block;
  margin-bottom: 10px;
  font-family: 'Songti SC', STSong, serif;
  font-size: 18px;
}

:deep(.md-editor-preview-wrapper),
:deep(.md-editor-preview),
:deep(.md-editor) {
  padding: 0;
  background: transparent !important;
}

:deep(.md-editor-preview img) {
  cursor: zoom-in;
}

.files a {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  padding: 10px;
  border: 1px solid #d4c8bc;
  background: #f6f2e9;
  text-decoration: none;
}

.files i {
  padding: 4px 6px;
  background: #e5d8d3;
  color: #902a25;
  font-style: normal;
  font-size: 11px;
}

.state,
.note {
  padding: 24px 0;
  color: #8a7b6e;
  font-size: 13px;
  text-align: center;
}

.note {
  text-align: left;
  border-left: 3px solid #a21d18;
  padding: 10px 12px;
  background: rgba(229, 225, 215, 0.7);
  font-size: 11px;
}
</style>
