<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useDialog, useMessage } from 'naive-ui'
import { useRoute } from 'vue-router'

import CommentComposer from './CommentComposer.vue'
import CommentItem from './CommentItem.vue'
import LikeButton from './LikeButton.vue'
import StatIcon from './StatIcon.vue'
import { createComment, deleteComment, getCommentList } from '@/api/comment'
import { getErrorMessage } from '@/constants/errorCodes'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  targetType: {
    type: String,
    default: 'article',
  },
  targetId: {
    type: Number,
    required: true,
  },
  ownerId: {
    type: String,
    default: '',
  },
  likeCount: {
    type: Number,
    default: 0,
  },
  liked: {
    type: Boolean,
    default: false,
  },
  commentCount: {
    type: Number,
    default: 0,
  },
  browseCount: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['stats-change'])
const pageSize = 10
const message = useMessage()
const dialog = useDialog()
const route = useRoute()
const userStore = useUserStore()

const likeState = ref({ liked: props.liked, count: props.likeCount })
const commentTotal = ref(props.commentCount)
const comments = ref([])
const rootTotal = ref(0)
const page = ref(1)
const loading = ref(false)
const loadError = ref('')

let requestSerial = 0

const hasMore = computed(() => comments.value.length < rootTotal.value)
const loginRedirect = computed(() => ({
  path: '/login',
  query: { redirect: route.fullPath },
}))

watch(
  () => props.targetId,
  () => {
    likeState.value = { liked: props.liked, count: props.likeCount }
    commentTotal.value = props.commentCount
    loadComments(true)
  },
)

onMounted(() => loadComments(true))

async function loadComments(reset = false) {
  if (!reset && loading.value) return
  if (reset) {
    page.value = 1
    comments.value = []
    rootTotal.value = 0
  }
  const requestID = ++requestSerial
  loading.value = true
  loadError.value = ''
  try {
    const data = await getCommentList({
      target_type: props.targetType,
      target_id: props.targetId,
      page: page.value,
      page_size: pageSize,
    })
    if (requestID !== requestSerial) return
    rootTotal.value = data.total
    const existingIds = new Set(comments.value.map((item) => item.id))
    comments.value.push(...data.list.filter((item) => !existingIds.has(item.id)))
    page.value += 1
  } catch (error) {
    if (requestID !== requestSerial) return
    loadError.value = getErrorMessage(error)
  } finally {
    if (requestID === requestSerial) loading.value = false
  }
}

function syncStats() {
  emit('stats-change', {
    like_count: likeState.value.count,
    liked: likeState.value.liked,
    comment_count: commentTotal.value,
  })
}

function applyLike(summary) {
  likeState.value = summary
  syncStats()
}

async function postComment(content) {
  try {
    const created = await createComment({
      target_type: props.targetType,
      target_id: props.targetId,
      content,
    })
    comments.value.unshift({ ...created, replies: [] })
    rootTotal.value += 1
    commentTotal.value += 1
    syncStats()
    message.success('已记入公开评论')
  } catch (error) {
    message.error(getErrorMessage(error))
    throw error
  }
}

async function postReply(parent, content) {
  try {
    const created = await createComment({
      target_type: props.targetType,
      target_id: props.targetId,
      parent_id: parent.id,
      content,
    })
    const root = comments.value.find((item) => item.id === created.root_id)
    if (root) {
      root.replies = [...(root.replies || []), created]
      root.reply_count = root.replies.length
    }
    commentTotal.value += 1
    syncStats()
    message.success('回复已发布')
  } catch (error) {
    message.error(getErrorMessage(error))
    throw error
  }
}

function confirmRemove(comment) {
  dialog.warning({
    title: comment.parent_id ? '删除回复' : '删除评论',
    content: comment.parent_id
      ? '该回复及其下层回复会一并删除。'
      : '该评论及其全部回复会一并删除，操作不可恢复。',
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: () => removeComment(comment),
  })
}

async function removeComment(comment) {
  try {
    await deleteComment(comment.id)
    commentTotal.value = Math.max(commentTotal.value - countRemoved(comment), 0)
    dropComment(comment)
    syncStats()
    message.success('已删除')
  } catch (error) {
    message.error(getErrorMessage(error))
  }
}

// 删除会级联清理子回复，本地同步时按同样规则扣减计数。
function countRemoved(comment) {
  if (!comment.parent_id) {
    return 1 + (comment.replies?.length || 0)
  }
  const root = comments.value.find((item) => item.id === comment.root_id)
  return 1 + descendantIds(root?.replies || [], comment.id).length
}

function descendantIds(replies, id) {
  const collected = []
  let frontier = [id]
  while (frontier.length) {
    const children = replies.filter((reply) => frontier.includes(reply.parent_id))
    frontier = children.map((reply) => reply.id)
    collected.push(...frontier)
  }
  return collected
}

function dropComment(comment) {
  if (!comment.parent_id) {
    comments.value = comments.value.filter((item) => item.id !== comment.id)
    rootTotal.value = Math.max(rootTotal.value - 1, 0)
    return
  }
  const root = comments.value.find((item) => item.id === comment.root_id)
  if (!root) return
  const removedIds = new Set([comment.id, ...descendantIds(root.replies || [], comment.id)])
  root.replies = (root.replies || []).filter((reply) => !removedIds.has(reply.id))
  root.reply_count = root.replies.length
}

function applyCommentLike({ comment, summary }) {
  comment.liked = summary.liked
  comment.like_count = summary.count
}
</script>

<template>
  <section class="interaction-panel">
    <div class="action-bar">
      <LikeButton
        :target-type="targetType"
        :target-id="targetId"
        :liked="likeState.liked"
        :count="likeState.count"
        label="盖章附议"
        @change="applyLike"
      />

      <ul class="stat-group">
        <li>
          <StatIcon name="view" />
          <b>{{ browseCount }}</b>
          <span>次围观</span>
        </li>
        <li>
          <StatIcon name="comment" />
          <b>{{ commentTotal }}</b>
          <span>条评论</span>
        </li>
      </ul>
    </div>

    <div class="comment-heading">
      <span class="eyebrow">PUBLIC COMMENTS</span>
      <h2>围观席发言</h2>
    </div>

    <CommentComposer v-if="userStore.isLoggedIn" :submit="postComment" />
    <div v-else class="login-hint">
      <span>登录后可以盖章附议、补充线索或提出质疑。</span>
      <router-link :to="loginRedirect">去登录 ↗</router-link>
    </div>

    <ul v-if="comments.length" class="comment-list">
      <CommentItem
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        :owner-id="ownerId"
        :submit-reply="postReply"
        :remove-comment="confirmRemove"
        @like-change="applyCommentLike"
      />
    </ul>

    <p v-else-if="!loading && !loadError" class="comment-empty">
      还没有人发言，第一条记录交给你。
    </p>

    <div class="comment-footer">
      <span v-if="loading">正在读取评论…</span>
      <span v-else-if="loadError" class="error">{{ loadError }}</span>
      <button v-else-if="hasMore" type="button" @click="loadComments()">
        加载更多评论（剩余 {{ rootTotal - comments.length }} 条）
      </button>
      <span v-else-if="comments.length">已显示全部 {{ rootTotal }} 条主评论</span>
    </div>
  </section>
</template>

<style scoped>
.interaction-panel {
  margin-top: 26px;
}

.action-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  padding: 18px 22px;
  border: 2px solid #292724;
  background: #e8e4d9;
  box-shadow: 7px 7px 0 #292724;
}

.stat-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 26px;
  margin: 0 0 0 auto;
  padding: 0;
  list-style: none;
}

.stat-group li {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #6d635a;
  font-size: 13px;
}

.stat-group svg {
  color: #a21d18;
  font-size: 15px;
}

.stat-group b {
  color: #292724;
  font-family: Georgia, serif;
  font-size: 17px;
}

.comment-heading {
  display: flex;
  flex-direction: column;
  margin: 34px 0 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #292724;
}

.eyebrow {
  color: #a21d18;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.22em;
}

.comment-heading h2 {
  margin: 6px 0 0;
  font-family: 'Songti SC', STSong, serif;
  font-size: 22px;
}

.login-hint {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 18px;
  border: 1px dashed #c8bdb2;
  background: rgba(246, 243, 234, 0.7);
  color: #7d6d61;
  font-size: 13px;
}

.login-hint a {
  margin-left: auto;
  color: #a21d18;
  font-weight: 700;
  text-decoration: none;
}

.login-hint a:hover {
  text-decoration: underline;
}

.comment-list {
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}

.comment-empty {
  margin: 20px 0 0;
  padding: 26px;
  border: 1px dashed #c8bdb2;
  color: #9c8876;
  font-size: 13px;
  text-align: center;
}

.comment-footer {
  min-height: 54px;
  display: grid;
  place-items: center;
  color: #9c8876;
  font-size: 12px;
}

.comment-footer .error {
  color: #a21d18;
}

.comment-footer button {
  padding: 10px 20px;
  border: 1px solid #bdb8ae;
  background: #f2efe6;
  color: #6d635a;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.comment-footer button:hover {
  border-color: #a21d18;
  color: #a21d18;
}

@media (max-width: 620px) {
  .action-bar {
    align-items: flex-start;
    flex-direction: column;
  }

  .stat-group {
    gap: 18px;
    margin-left: 0;
  }
}
</style>
