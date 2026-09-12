<script setup>
import { computed, ref } from 'vue'

import CommentComposer from './CommentComposer.vue'
import LikeButton from './LikeButton.vue'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  comment: {
    type: Object,
    required: true,
  },
  ownerId: {
    type: String,
    default: '',
  },
  submitReply: {
    type: Function,
    required: true,
  },
  removeComment: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(['like-change'])
const collapsedReplies = 3
const userStore = useUserStore()
const replyTo = ref(null)
const expanded = ref(false)

const replies = computed(() => props.comment.replies || [])
const visibleReplies = computed(() =>
  expanded.value ? replies.value : replies.value.slice(0, collapsedReplies),
)
const hiddenReplyCount = computed(() => Math.max(replies.value.length - collapsedReplies, 0))

// 回复的回复需要显示“回复 @某人”，父评论昵称从同一楼层内查找。
const nicknamesById = computed(() => {
  const map = { [props.comment.id]: displayName(props.comment) }
  replies.value.forEach((reply) => {
    map[reply.id] = displayName(reply)
  })
  return map
})

function displayName(comment) {
  return comment.nickname || '匿名围观者'
}

function replyTargetName(reply) {
  if (!reply.parent_id || reply.parent_id === props.comment.id) return ''
  return nicknamesById.value[reply.parent_id] || ''
}

function canDelete(comment) {
  const currentUserId = userStore.user?.user_id
  if (!currentUserId) return false
  return comment.created_by === currentUserId || props.ownerId === currentUserId
}

function openReply(comment) {
  replyTo.value = replyTo.value?.id === comment.id ? null : comment
}

async function sendReply(content) {
  const parent = replyTo.value
  if (!parent) return
  await props.submitReply(parent, content)
  replyTo.value = null
  expanded.value = true
}

function formatTime(value) {
  const target = new Date(value)
  const minutes = Math.floor((Date.now() - target.getTime()) / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)} 小时前`
  if (minutes < 60 * 24 * 7) return `${Math.floor(minutes / (60 * 24))} 天前`
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(target)
}
</script>

<template>
  <li class="comment-item">
    <div class="comment-main">
      <span class="avatar">{{ displayName(comment).slice(0, 1) }}</span>
      <div class="comment-body">
        <div class="comment-meta">
          <strong>{{ displayName(comment) }}</strong>
          <span v-if="comment.created_by === ownerId" class="badge">投稿人</span>
          <time>{{ formatTime(comment.created_at) }}</time>
        </div>
        <p class="comment-content">{{ comment.content }}</p>
        <div class="comment-actions">
          <LikeButton
            target-type="comment"
            :target-id="comment.id"
            :liked="Boolean(comment.liked)"
            :count="comment.like_count || 0"
            variant="ghost"
            @change="emit('like-change', { comment, summary: $event })"
          />
          <button type="button" @click="openReply(comment)">
            {{ replyTo?.id === comment.id ? '收起' : '回复' }}
          </button>
          <button v-if="canDelete(comment)" class="danger" type="button" @click="removeComment(comment)">
            删除
          </button>
        </div>
      </div>
    </div>

    <ul v-if="replies.length" class="reply-list">
      <li v-for="reply in visibleReplies" :key="reply.id" class="reply-item">
        <div class="comment-meta">
          <strong>{{ displayName(reply) }}</strong>
          <span v-if="reply.created_by === ownerId" class="badge">投稿人</span>
          <span v-if="replyTargetName(reply)" class="reply-to">
            回复 @{{ replyTargetName(reply) }}
          </span>
          <time>{{ formatTime(reply.created_at) }}</time>
        </div>
        <p class="comment-content">{{ reply.content }}</p>
        <div class="comment-actions">
          <LikeButton
            target-type="comment"
            :target-id="reply.id"
            :liked="Boolean(reply.liked)"
            :count="reply.like_count || 0"
            variant="ghost"
            @change="emit('like-change', { comment: reply, summary: $event })"
          />
          <button type="button" @click="openReply(reply)">
            {{ replyTo?.id === reply.id ? '收起' : '回复' }}
          </button>
          <button v-if="canDelete(reply)" class="danger" type="button" @click="removeComment(reply)">
            删除
          </button>
        </div>
      </li>

      <li v-if="hiddenReplyCount" class="reply-toggle">
        <button type="button" @click="expanded = !expanded">
          {{ expanded ? '收起回复' : `展开其余 ${hiddenReplyCount} 条回复` }}
        </button>
      </li>
    </ul>

    <div v-if="replyTo" class="reply-composer">
      <CommentComposer
        :key="replyTo.id"
        compact
        cancelable
        :placeholder="`回复 @${displayName(replyTo)}`"
        submit-label="发表回复"
        :submit="sendReply"
        @cancel="replyTo = null"
      />
    </div>
  </li>
</template>

<style scoped>
.comment-item {
  padding: 18px 0;
  border-bottom: 1px solid #ddd4c9;
  list-style: none;
}

.comment-main {
  display: flex;
  gap: 12px;
}

.avatar {
  width: 36px;
  height: 36px;
  display: grid;
  flex-shrink: 0;
  place-items: center;
  border-radius: 50%;
  background: #292724;
  color: #f2efe6;
  font-size: 14px;
}

.comment-body {
  min-width: 0;
  flex: 1;
}

.comment-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.comment-meta strong {
  color: #3a332d;
  font-size: 14px;
}

.badge {
  padding: 2px 6px;
  border: 1px solid #d4bdb6;
  background: #eadbd6;
  color: #8f2924;
  font-size: 10px;
}

.reply-to {
  color: #a21d18;
  font-size: 12px;
}

.comment-meta time {
  margin-left: auto;
  color: #a0907f;
  font-family: Georgia, serif;
  font-size: 12px;
}

.comment-content {
  margin: 8px 0 0;
  color: #453e38;
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
}

.comment-actions button {
  border: 0;
  background: transparent;
  color: #8d7d70;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.comment-actions button:hover {
  color: #a21d18;
  text-decoration: underline;
}

.comment-actions .danger:hover {
  color: #8f2924;
}

.reply-list {
  margin: 12px 0 0 48px;
  padding: 0 0 0 14px;
  border-left: 2px solid #ddd4c9;
  list-style: none;
}

.reply-item {
  padding: 10px 0;
}

.reply-item + .reply-item {
  border-top: 1px dashed #e2d9ce;
}

.reply-item .comment-meta strong {
  font-size: 13px;
}

.reply-item .comment-content {
  font-size: 13px;
}

.reply-toggle button {
  margin-top: 4px;
  border: 0;
  background: transparent;
  color: #a21d18;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.reply-composer {
  margin: 12px 0 0 48px;
}

@media (max-width: 560px) {
  .reply-list,
  .reply-composer {
    margin-left: 14px;
  }

  .comment-meta time {
    margin-left: 0;
  }
}
</style>
