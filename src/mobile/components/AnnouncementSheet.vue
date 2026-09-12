<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

import { ANNOUNCEMENT, ANNOUNCEMENT_STORAGE_KEY } from '@/constants/announcement'

const visible = ref(false)

onMounted(async () => {
  if (readAck() === ANNOUNCEMENT.id) return
  visible.value = true
  window.addEventListener('keydown', handleKeydown)
  await nextTick()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})

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
    // 隐私模式写入失败时只关本次
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
    <Transition name="sheet">
      <div v-if="visible" class="sheet-mask" @click.self="close">
        <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="mobile-notice-title">
          <span class="handle" aria-hidden="true"></span>
          <span class="eyebrow">{{ ANNOUNCEMENT.eyebrow }}</span>
          <h2 id="mobile-notice-title">{{ ANNOUNCEMENT.title }}</h2>
          <p class="lead">{{ ANNOUNCEMENT.lead }}</p>

          <ol>
            <li v-for="clause in ANNOUNCEMENT.clauses" :key="clause.order">
              <b>{{ clause.order }}</b>
              <div>
                <strong>{{ clause.title }}</strong>
                <p>{{ clause.body }}</p>
              </div>
            </li>
          </ol>

          <small>{{ ANNOUNCEMENT.footNote }}</small>
          <div class="actions">
            <button type="button" @click="close">{{ ANNOUNCEMENT.dismissLabel }}</button>
            <button class="confirm" type="button" @click="confirm">
              {{ ANNOUNCEMENT.confirmLabel }}
            </button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-mask {
  position: fixed;
  z-index: 4000;
  inset: 0;
  display: flex;
  align-items: flex-end;
  background: rgba(20, 17, 14, 0.58);
}

.sheet {
  width: 100%;
  max-height: min(88vh, 720px);
  overflow-y: auto;
  padding: 14px 20px calc(18px + env(safe-area-inset-bottom));
  border-top: 2px solid #292724;
  background: #f3efe4;
  box-shadow: 0 -10px 0 rgba(18, 14, 10, 0.18);
}

.handle {
  display: block;
  width: 46px;
  height: 4px;
  margin: 0 auto 16px;
  background: #c8bdb2;
}

.eyebrow {
  color: #a21d18;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

h2 {
  margin: 8px 0 10px;
  font-family: 'Songti SC', STSong, serif;
  font-size: 28px;
}

.lead,
ol p,
small {
  color: #6d635a;
  line-height: 1.75;
}

.lead {
  margin: 0 0 8px;
  font-size: 13px;
}

ol {
  margin: 0;
  padding: 0;
  list-style: none;
}

ol li {
  display: flex;
  gap: 12px;
  padding: 16px 0;
  border-top: 1px dashed #d4cbbd;
}

ol b {
  width: 26px;
  height: 26px;
  display: grid;
  flex-shrink: 0;
  place-items: center;
  border: 1px solid #a21d18;
  color: #a21d18;
  font-family: 'Songti SC', STSong, serif;
}

ol strong {
  display: block;
  font-size: 15px;
}

ol p {
  margin: 6px 0 0;
  font-size: 13px;
}

small {
  display: block;
  margin: 4px 0 14px;
  font-size: 11px;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 10px;
}

.actions button {
  min-height: 46px;
  border: 1px solid #292724;
  background: transparent;
  color: #6d635a;
  font-weight: 700;
}

.actions .confirm {
  background: #292724;
  color: #f7f3ea;
  box-shadow: 3px 3px 0 #a21d18;
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.22s ease;
}

.sheet-enter-active .sheet,
.sheet-leave-active .sheet {
  transition: transform 0.24s ease;
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .sheet,
.sheet-leave-to .sheet {
  transform: translateY(24px);
}
</style>
