<script setup>
import { computed, onMounted, ref } from 'vue'
import { useDialog, useMessage } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'

import InteractionPanel from '@/mobile/components/interaction/InteractionPanel.vue'
import ImageLightbox from '@/components/ImageLightbox.vue'
import { displayName, formatDate, initial } from '@/mobile/utils/format'
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
const previewSrc = ref('')
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
    // 保留详情计数
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
    content: '话题及其全部评论会一并删除，操作不可恢复。',
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
</script>

<template>
  <article class="topic">
    <div v-if="loading" class="state">正在读取话题…</div>
    <div v-else-if="errorMessage" class="state">{{ errorMessage }}</div>
    <template v-else-if="topic">
      <header>
        <i>{{ initial(displayName(author, '匿')) }}</i>
        <div>
          <b>{{ displayName(author, '匿名用户') }}</b>
          <small>{{ formatDate(topic.created_at, 'long') }}</small>
        </div>
        <button v-if="isOwner" type="button" @click="confirmRemove">删除</button>
      </header>
      <h1>{{ topic.title }}</h1>
      <div class="tags">
        <router-link v-for="tag in topic.tags" :key="tag" :to="{ name: 'community', query: { tag } }">
          #{{ tag }}
        </router-link>
      </div>
      <p class="content">{{ topic.content }}</p>
      <div v-if="topic.images.length" class="gallery">
        <button
          v-for="image in topic.images"
          :key="image.file_id"
          type="button"
          @click="previewSrc = image.url"
        >
          <img :src="image.url" alt="" />
        </button>
      </div>
      <div v-if="topic.attachment_file_ids.length" class="files">
        <a
          v-for="fileId in topic.attachment_file_ids"
          :key="fileId"
          :href="getFileDownloadUrl(fileId)"
          target="_blank"
        >
          材料 #{{ fileId }}
        </a>
      </div>
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
    </template>
    <ImageLightbox :src="previewSrc" @close="previewSrc = ''" />
  </article>
</template>

<style scoped>
header {
  display: flex;
  align-items: center;
  gap: 10px;
}

header i {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #292724;
  color: white;
  font-style: normal;
}

header div {
  display: flex;
  flex: 1;
  flex-direction: column;
}

header small {
  color: #9f8e81;
  font-size: 11px;
}

header button {
  border: 0;
  background: transparent;
  color: #a21d18;
  font-size: 13px;
}

h1 {
  margin: 14px 0 10px;
  font-family: 'Songti SC', STSong, serif;
  font-size: 24px;
  line-height: 1.3;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tags a {
  padding: 4px 8px;
  background: #eadbd6;
  color: #8f2924;
  font-size: 12px;
  text-decoration: none;
}

.content {
  margin: 14px 0 0;
  font-size: 15px;
  line-height: 1.85;
  white-space: pre-wrap;
}

.gallery {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  margin-top: 14px;
}

.gallery button {
  padding: 0;
  border: 0;
  cursor: zoom-in;
}

.gallery img {
  width: 100%;
  height: 140px;
  display: block;
  object-fit: cover;
}

.files a {
  display: block;
  margin-top: 8px;
  padding: 10px;
  border: 1px solid #d4c8bc;
  background: #f6f2e9;
  text-decoration: none;
}

.state {
  padding: 40px 0;
  color: #8a7b6e;
  text-align: center;
}
</style>
