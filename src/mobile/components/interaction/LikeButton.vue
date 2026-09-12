<script setup>
import { ref } from 'vue'
import { useMessage } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'

import StatIcon from '@/mobile/components/icons/StatIcon.vue'
import { cancelLike, createLike } from '@/api/like'
import { getErrorMessage } from '@/constants/errorCodes'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  targetType: { type: String, required: true },
  targetId: { type: Number, required: true },
  liked: { type: Boolean, default: false },
  count: { type: Number, default: 0 },
  label: { type: String, default: '' },
  variant: { type: String, default: 'solid' },
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
    class="like-btn"
    :class="[variant, { active: liked, pending }]"
    type="button"
    :aria-pressed="liked"
    @click.prevent.stop="toggle"
  >
    <StatIcon name="like" />
    <span v-if="label">{{ liked ? '已附议' : label }}</span>
    <b>{{ count }}</b>
  </button>
</template>

<style scoped>
.like-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 36px;
  border: 0;
  background: transparent;
  color: #8a7b6e;
  font: inherit;
}

.like-btn.pending {
  opacity: 0.55;
}

.like-btn.solid {
  min-height: 46px;
  padding: 0 16px;
  border: 1px solid #292724;
  background: #f7f3ea;
  color: #292724;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 3px 3px 0 #292724;
}

.like-btn.solid.active {
  background: #a21d18;
  border-color: #a21d18;
  color: #f7f3ea;
}

.like-btn.chip {
  padding: 0 10px;
  border: 1px solid #d4cbbd;
  background: #f7f3ea;
  font-size: 13px;
}

.like-btn.chip.active,
.like-btn.ghost.active,
.like-btn.ghost:active {
  color: #a21d18;
}

.like-btn.ghost {
  min-height: 32px;
  padding: 0;
  font-size: 13px;
}

.like-btn b {
  font-family: Georgia, serif;
}
</style>
