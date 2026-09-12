<script setup>
import { computed, onMounted, ref } from 'vue'
import { useDialog, useMessage } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'

import InteractionPanel from '@/pc/components/interaction/InteractionPanel.vue'
import { recordBrowse } from '@/api/browse'
import { getFileDownloadUrl } from '@/api/file'
import { deleteTopic, getTopic } from '@/api/topic'
import { getErrorMessage } from '@/constants/errorCodes'
import { usePublicUserStore } from '@/stores/publicUser'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const dialog = useDialog()
const message = useMessage()
const publicUserStore = usePublicUserStore()
const userStore = useUserStore()

const topic = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const activeImage = ref(null)

const author = computed(() =>
  topic.value ? publicUserStore.getCachedUser(topic.value.created_by) : null,
)
const isOwner = computed(
  () => Boolean(topic.value) && userStore.user?.user_id === topic.value.created_by,
)

onMounted(loadTopic)

async function loadTopic() {
  const id = Number(route.params.id)
  if (!Number.isSafeInteger(id) || id <= 0) {
    errorMessage.value = '话题地址无效'
    loading.value = false
    return
  }
  try {
    topic.value = await getTopic(id)
    document.title = `${topic.value.title} · 无良企业荣誉馆`
    await publicUserStore.fetchUser(topic.value.created_by).catch(() => null)
    countBrowse(id)
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  } finally {
    loading.value = false
  }
}

async function countBrowse(id) {
  try {
    const result = await recordBrowse({ target_type: 'topic', target_id: id })
    topic.value.browse_count = result.count
  } catch {
    // 浏览记录失败时保留详情接口返回的计数
  }
}

function applyStats(stats) {
  topic.value.like_count = stats.like_count
  topic.value.liked = stats.liked
  topic.value.comment_count = stats.comment_count
}

function confirmRemove() {
  dialog.warning({
    title: '删除话题',
    content: '话题及其全部评论、附议记录会一并删除，操作不可恢复。',
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: removeTopic,
  })
}

async function removeTopic() {
  try {
    await deleteTopic(topic.value.id)
    message.success('话题已删除')
    router.push({ name: 'community' })
  } catch (error) {
    message.error(getErrorMessage(error))
  }
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
  <article class="topic-page">
    <router-link class="back-link" :to="{ name: 'community' }">← 返回社区广场</router-link>

    <div v-if="loading" class="page-state">正在读取话题…</div>
    <div v-else-if="errorMessage" class="page-state error">
      <strong>话题读取失败</strong>
      <span>{{ errorMessage }}</span>
    </div>

    <template v-else-if="topic">
      <header class="topic-header">
        <div class="author">
          <span class="author-avatar">{{ (author?.nickname || '匿').slice(0, 1) }}</span>
          <span class="author-copy">
            <b>{{ author?.nickname || '匿名用户' }}</b>
            <small>话题发起人</small>
          </span>
          <time>{{ formatDate(topic.created_at) }}</time>
          <button v-if="isOwner" class="remove" type="button" @click="confirmRemove">
            删除话题
          </button>
        </div>

        <h1>{{ topic.title }}</h1>

        <div class="tag-list">
          <router-link
            v-for="tag in topic.tags"
            :key="tag"
            :to="{ name: 'community', query: { tag } }"
          >
            #{{ tag }}
          </router-link>
        </div>
      </header>

      <section class="topic-content">
        <p>{{ topic.content }}</p>
      </section>

      <section v-if="topic.images.length" class="topic-images">
        <button
          v-for="image in topic.images"
          :key="image.file_id"
          type="button"
          @click="activeImage = image"
        >
          <img :src="image.url" alt="话题配图" loading="lazy" />
        </button>
      </section>

      <section v-if="topic.attachment_file_ids.length" class="topic-attachments">
        <span class="eyebrow">EVIDENCE FILES</span>
        <h2>相关材料</h2>
        <div class="attachment-list">
          <a
            v-for="fileId in topic.attachment_file_ids"
            :key="fileId"
            :href="getFileDownloadUrl(fileId)"
            target="_blank"
          >
            材料 #{{ fileId }}
            <small>下载查看 ↗</small>
          </a>
        </div>
      </section>

      <InteractionPanel
        target-type="topic"
        :target-id="topic.id"
        :owner-id="topic.created_by"
        :like-count="topic.like_count"
        :liked="topic.liked"
        :comment-count="topic.comment_count"
        :browse-count="topic.browse_count"
        @stats-change="applyStats"
      />

      <footer class="record-note">
        本页内容由用户发布。涉及事实判断时，请以原始证据、监管记录及相关方回应为准。
      </footer>
    </template>

    <div v-if="activeImage" class="lightbox" role="dialog" @click="activeImage = null">
      <img :src="activeImage.url" alt="话题配图原图" />
      <button type="button" aria-label="关闭">×</button>
    </div>
  </article>
</template>

<style scoped>
.topic-page {
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

.topic-header {
  padding: 28px 32px 24px;
  border: 2px solid #292724;
  background: #ebe7dc;
  box-shadow: 9px 9px 0 #292724;
}

.author {
  display: flex;
  align-items: center;
  padding-bottom: 18px;
  border-bottom: 1px solid #d5cabf;
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

.author-copy {
  display: flex;
  flex-direction: column;
}

.author-copy b {
  font-size: 14px;
}

.author-copy small {
  margin-top: 3px;
  color: #9f8e81;
  font-size: 11px;
}

.author time {
  margin-left: auto;
  color: #8e7d70;
  font-family: Georgia, serif;
  font-size: 12px;
}

.remove {
  margin-left: 16px;
  padding: 7px 12px;
  border: 1px solid rgba(162, 29, 24, 0.5);
  background: transparent;
  color: #a21d18;
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}

.remove:hover {
  background: #a21d18;
  color: #f7f3ea;
}

.topic-header h1 {
  margin: 20px 0 16px;
  font-family: 'Songti SC', STSong, serif;
  font-size: clamp(26px, 3vw, 36px);
  line-height: 1.25;
  letter-spacing: -0.03em;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.tag-list a {
  padding: 6px 10px;
  border: 1px solid #d4bdb6;
  background: #eadbd6;
  color: #8f2924;
  font-size: 13px;
  text-decoration: none;
  transition: 0.2s ease;
}

.tag-list a:hover {
  border-color: #a21d18;
  background: #a21d18;
  color: #f7f3ea;
}

.topic-content {
  margin-top: 28px;
  padding: 24px 20px;
  border-top: 1px solid #c9c0b6;
  border-bottom: 1px solid #c9c0b6;
}

.topic-content p {
  margin: 0;
  color: #3d3732;
  font-size: 15px;
  line-height: 1.95;
  white-space: pre-wrap;
}

.topic-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
  margin-top: 22px;
}

.topic-images button {
  height: 170px;
  overflow: hidden;
  padding: 0;
  border: 1px solid #c9c0b6;
  background: #e5e0d5;
  cursor: zoom-in;
}

.topic-images img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.topic-images button:hover img {
  transform: scale(1.04);
}

.topic-attachments {
  margin-top: 24px;
  padding: 22px 26px;
  border: 1px solid #c9c0b6;
  background: #e7e2d8;
}

.eyebrow {
  color: #a21d18;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.22em;
}

.topic-attachments h2 {
  margin: 5px 0 16px;
  font-family: 'Songti SC', STSong, serif;
  font-size: 21px;
}

.attachment-list {
  display: grid;
  gap: 8px;
}

.attachment-list a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border: 1px solid #d4c8bc;
  background: #f6f2e9;
  color: #4c4139;
  font-size: 13px;
  text-decoration: none;
}

.attachment-list a:hover {
  border-color: #a21d18;
}

.attachment-list small {
  color: #a21d18;
  font-size: 11px;
}

.record-note {
  margin-top: 22px;
  padding: 17px 20px;
  border-left: 4px solid #a21d18;
  background: rgba(229, 225, 215, 0.9);
  color: #7d6d61;
  font-size: 11px;
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

.lightbox {
  position: fixed;
  z-index: 30;
  inset: 0;
  display: grid;
  padding: 40px;
  place-items: center;
  background: rgba(24, 22, 20, 0.88);
  cursor: zoom-out;
}

.lightbox img {
  max-width: 100%;
  max-height: 100%;
  border: 3px solid #f2f0e9;
}

.lightbox button {
  position: absolute;
  top: 24px;
  right: 30px;
  border: 0;
  background: transparent;
  color: #f2f0e9;
  font-size: 32px;
  line-height: 1;
  cursor: pointer;
}

@media (max-width: 620px) {
  .topic-header {
    padding: 22px 20px 20px;
  }

  .author {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .author time {
    width: 100%;
    margin: 10px 0 0 52px;
  }

  .remove {
    margin: 12px 0 0 52px;
  }
}
</style>
