<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

import { ANNOUNCEMENT, ANNOUNCEMENT_STORAGE_KEY } from '@/constants/announcement'

const visible = ref(false)
const confirmButton = ref(null)

onMounted(async () => {
  if (readAck() === ANNOUNCEMENT.id) return
  visible.value = true
  window.addEventListener('keydown', handleKeydown)
  await nextTick()
  confirmButton.value?.focus()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// 隐私模式下 localStorage 可能不可用，读写失败时按“未确认”处理。
function readAck() {
  try {
    return localStorage.getItem(ANNOUNCEMENT_STORAGE_KEY)
  } catch {
    return null
  }
}

function confirm() {
  try {
    localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, ANNOUNCEMENT.id)
  } catch {
    // 写入失败时仅关闭本次弹窗，下次进入会再次提示
  }
  close()
}

function close() {
  visible.value = false
  window.removeEventListener('keydown', handleKeydown)
}

function handleKeydown(event) {
  if (event.key === 'Escape') close()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="notice">
      <div v-if="visible" class="notice-mask" @click.self="close">
        <div
          class="notice-board"
          role="dialog"
          aria-modal="true"
          aria-labelledby="announcement-title"
        >
          <span class="paper-clip" aria-hidden="true"></span>

          <header class="notice-head">
            <span class="eyebrow">{{ ANNOUNCEMENT.eyebrow }}</span>
            <h2 id="announcement-title">{{ ANNOUNCEMENT.title }}</h2>
            <p>{{ ANNOUNCEMENT.lead }}</p>
          </header>

          <ol class="notice-body">
            <li v-for="clause in ANNOUNCEMENT.clauses" :key="clause.order">
              <b class="clause-order">{{ clause.order }}</b>
              <div>
                <strong>{{ clause.title }}</strong>
                <p>{{ clause.body }}</p>
              </div>
            </li>
          </ol>

          <footer class="notice-foot">
            <small>{{ ANNOUNCEMENT.footNote }}</small>
            <div class="notice-actions">
              <button class="dismiss" type="button" @click="close">
                {{ ANNOUNCEMENT.dismissLabel }}
              </button>
              <button ref="confirmButton" class="confirm" type="button" @click="confirm">
                {{ ANNOUNCEMENT.confirmLabel }}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.notice-mask {
  position: fixed;
  z-index: 3000;
  inset: 0;
  display: grid;
  overflow-y: auto;
  padding: 32px 20px;
  place-items: center;
  background: rgba(24, 22, 20, 0.62);
  backdrop-filter: blur(3px);
}

.notice-board {
  position: relative;
  width: min(560px, 100%);
  padding: 34px 36px 26px;
  border: 2px solid #292724;
  background:
    repeating-linear-gradient(-45deg, transparent 0 9px, rgba(162, 29, 24, 0.03) 9px 10px),
    #ebe7dc;
  color: #292724;
  box-shadow: 12px 12px 0 rgba(18, 14, 10, 0.55);
}

.paper-clip {
  position: absolute;
  left: 50%;
  top: -13px;
  width: 84px;
  height: 26px;
  border: 1px solid rgba(41, 39, 36, 0.35);
  background: rgba(226, 216, 190, 0.85);
  transform: translateX(-50%) rotate(-1.4deg);
}

.notice-head {
  padding-bottom: 18px;
  border-bottom: 2px solid #292724;
}

.eyebrow {
  color: #a21d18;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.2em;
}

.notice-head h2 {
  margin: 10px 0 12px;
  font-family: 'Songti SC', STSong, serif;
  font-size: 34px;
  letter-spacing: -0.03em;
}

.notice-head p {
  margin: 0;
  color: #6d635a;
  font-size: 13px;
  line-height: 1.85;
}

.notice-body {
  margin: 0;
  padding: 0;
  list-style: none;
}

.notice-body li {
  display: flex;
  gap: 14px;
  padding: 20px 0;
  border-bottom: 1px dashed #cfc5b9;
}

.clause-order {
  width: 28px;
  height: 28px;
  display: grid;
  flex-shrink: 0;
  place-items: center;
  border: 1px solid #a21d18;
  color: #a21d18;
  font-family: 'Songti SC', STSong, serif;
  font-size: 15px;
}

.notice-body strong {
  display: block;
  font-size: 15px;
  letter-spacing: 0.04em;
}

.notice-body p {
  margin: 7px 0 0;
  color: #57504a;
  font-size: 13px;
  line-height: 1.9;
}

.notice-foot {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  padding-top: 18px;
}

.notice-foot small {
  max-width: 210px;
  color: #a0907f;
  font-size: 11px;
  line-height: 1.6;
}

.notice-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.notice-actions button {
  padding: 11px 18px;
  border: 1px solid #292724;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.notice-actions .dismiss {
  border-color: rgba(41, 39, 36, 0.42);
  background: transparent;
  color: #6d635a;
}

.notice-actions .dismiss:hover {
  border-color: #292724;
  color: #292724;
}

.notice-actions .confirm {
  background: #292724;
  color: #f7f3ea;
  box-shadow: 4px 4px 0 rgba(162, 29, 24, 0.72);
}

.notice-actions .confirm:hover {
  background: #a21d18;
  box-shadow: 4px 4px 0 #292724;
  transform: translate(-1px, -1px);
}

.notice-enter-active,
.notice-leave-active {
  transition: opacity 0.24s ease;
}

.notice-enter-active .notice-board,
.notice-leave-active .notice-board {
  transition:
    opacity 0.24s ease,
    transform 0.24s ease;
}

.notice-enter-from,
.notice-leave-to {
  opacity: 0;
}

.notice-enter-from .notice-board,
.notice-leave-to .notice-board {
  opacity: 0;
  transform: translateY(-14px) scale(0.985);
}

@media (max-width: 560px) {
  .notice-board {
    padding: 28px 22px 22px;
  }

  .notice-head h2 {
    font-size: 28px;
  }

  .notice-foot small {
    max-width: none;
  }

  .notice-actions {
    width: 100%;
    margin-left: 0;
  }

  .notice-actions button {
    flex: 1;
  }
}
</style>
