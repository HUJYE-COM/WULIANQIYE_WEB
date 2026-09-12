<script setup>
import { ref } from 'vue'
import { useMessage } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'

import StatIcon from './StatIcon.vue'
import { cancelLike, createLike } from '@/api/like'
import { getErrorMessage } from '@/constants/errorCodes'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  targetType: {
    type: String,
    required: true,
  },
  targetId: {
    type: Number,
    required: true,
  },
  liked: {
    type: Boolean,
    default: false,
  },
  count: {
    type: Number,
    default: 0,
  },
  label: {
    type: String,
    default: '',
  },
  variant: {
    type: String,
    default: 'solid',
  },
})

const emit = defineEmits(['change'])
const message = useMessage()
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const pending = ref(false)

async function toggle() {
  if (!userStore.isLoggedIn) {
    message.warning('登录后才能盖章附议')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  if (pending.value) return
  pending.value = true
  const payload = { target_type: props.targetType, target_id: props.targetId }
  try {
    const summary = props.liked ? await cancelLike(payload) : await createLike(payload)
    emit('change', { liked: summary.liked, count: summary.count })
  } catch (error) {
    message.error(getErrorMessage(error))
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <button
    class="like-button"
    :class="[variant, { active: liked, pending }]"
    type="button"
    :aria-pressed="liked"
    @click.prevent.stop="toggle"
  >
    <StatIcon name="like" />
    <span v-if="label" class="like-label">{{ liked ? '已附议' : label }}</span>
    <b>{{ count }}</b>
  </button>
</template>

<style scoped>
.like-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid transparent;
  font: inherit;
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.like-button.pending {
  cursor: progress;
  opacity: 0.6;
}

.like-button.solid {
  padding: 11px 18px;
  border-color: #292724;
  background: #f2efe6;
  color: #292724;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 4px 4px 0 #292724;
}

.like-button.solid:hover {
  border-color: #a21d18;
  color: #a21d18;
}

.like-button.solid.active {
  background: #a21d18;
  border-color: #a21d18;
  color: #f7f3ea;
  box-shadow: 4px 4px 0 #292724;
}

.like-button.ghost {
  padding: 3px 2px;
  background: transparent;
  color: #8d7d70;
  font-size: 12px;
}

.like-button.ghost:hover,
.like-button.ghost.active {
  color: #a21d18;
}

.like-label {
  letter-spacing: 0.06em;
}

.like-button b {
  font-family: Georgia, serif;
}

.like-button.solid b {
  padding-left: 9px;
  border-left: 1px solid currentColor;
  font-size: 15px;
}
</style>
