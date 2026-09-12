<script setup>
import { computed, ref } from 'vue'

import CommentComposer from './CommentComposer.vue'
import LikeButton from './LikeButton.vue'
import { formatTimeAgo, initial } from '@/mobile/utils/format'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  comment: { type: Object, required: true },
  ownerId: { type: String, default: '' },
  submitReply: { type: Function, required: true },
  removeComment: { type: Function, required: true },
})

const emit = defineEmits(['like-change'])
const userStore = useUserStore()
const replyTo = ref(null)
const expanded = ref(false)
const replies = computed(() => props.comment.replies || [])
const visibleReplies = computed(() => (expanded.value ? replies.value : replies.value.slice(0, 2)))
const hiddenReplyCount = computed(() => Math.max(replies.value.length - 2, 0))

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
  const uid = userStore.user?.user_id
  return Boolean(uid) && (comment.created_by === uid || props.ownerId === uid)
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
</script>

<template>
  <li class="floor">
    <div class="main">
      <span class="avatar">{{ initial(displayName(comment)) }}</span>
      <div class="body">
        <div class="meta">
          <strong>{{ displayName(comment) }}</strong>
          <em v-if="comment.created_by === ownerId">馆主稿</em>
          <time>{{ formatTimeAgo(comment.created_at) }}</time>
        </div>
        <p>{{ comment.content }}</p>
        <div class="acts">
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
          <button v-if="canDelete(comment)" type="button" @click="removeComment(comment)">删除</button>
        </div>
      </div>
    </div>

    <ul v-if="replies.length" class="replies">
      <li v-for="reply in visibleReplies" :key="reply.id">
        <div class="meta">
          <strong>{{ displayName(reply) }}</strong>
          <span v-if="replyTargetName(reply)">回复 @{{ replyTargetName(reply) }}</span>
          <time>{{ formatTimeAgo(reply.created_at) }}</time>
        </div>
        <p>{{ reply.content }}</p>
        <div class="acts">
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
          <button v-if="canDelete(reply)" type="button" @click="removeComment(reply)">删除</button>
        </div>
      </li>
      <li v-if="hiddenReplyCount" class="more">
        <button type="button" @click="expanded = !expanded">
          {{ expanded ? '收起回复' : `展开其余 ${hiddenReplyCount} 条` }}
        </button>
      </li>
    </ul>

    <CommentComposer
      v-if="replyTo"
      :key="replyTo.id"
      compact
      cancelable
      :placeholder="`回复 @${displayName(replyTo)}`"
      submit-label="回复"
      :submit="sendReply"
      @cancel="replyTo = null"
    />
  </li>
</template>

<style scoped>
.floor {
  padding: 16px 0;
  border-bottom: 1px solid #e4dcd0;
  list-style: none;
}

.main {
  display: flex;
  gap: 10px;
}

.avatar {
  width: 34px;
  height: 34px;
  display: grid;
  flex-shrink: 0;
  place-items: center;
  border-radius: 50%;
  background: #292724;
  color: #f4efe4;
  font-size: 13px;
}

.body,
.replies li {
  min-width: 0;
  flex: 1;
}

.meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.meta strong {
  font-size: 13px;
}

.meta em,
.meta span {
  color: #a21d18;
  font-size: 11px;
  font-style: normal;
}

.meta time {
  margin-left: auto;
  color: #a0907f;
  font-size: 11px;
}

p {
  margin: 6px 0 0;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.acts {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 6px;
}

.acts button {
  border: 0;
  background: transparent;
  color: #8a7b6e;
  font-size: 12px;
}

.replies {
  margin: 10px 0 0 44px;
  padding: 0 0 0 12px;
  border-left: 2px solid #e0d6c8;
  list-style: none;
}

.replies li {
  padding: 10px 0;
}

.more button {
  border: 0;
  background: transparent;
  color: #a21d18;
  font-size: 12px;
  font-weight: 700;
}

.composer,
:deep(.composer) {
  margin: 10px 0 0 44px;
}
</style>
