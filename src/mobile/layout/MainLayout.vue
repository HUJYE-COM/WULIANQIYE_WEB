<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import logoUrl from '@/assets/logo.svg'
import '@/mobile/assets/mobile.css'
import AnnouncementSheet from '@/mobile/components/AnnouncementSheet.vue'
import { usePlatformStore } from '@/stores/platform'

const route = useRoute()
const platformStore = usePlatformStore()
const scrollArea = ref(null)

const hideTabs = computed(() =>
  ['article-detail', 'topic-detail', 'contact'].includes(route.name),
)

const tabs = [
  { name: 'honor-wall', path: '/honor-wall', label: '荣誉墙', icon: 'wall' },
  { name: 'community', path: '/community', label: '社区', icon: 'talk' },
  { name: 'submission', path: '/submission', label: '投稿', icon: 'pen' },
  { name: 'mine', path: '/mine', label: '我的', icon: 'me' },
]

watch(
  () => route.fullPath,
  async () => {
    await nextTick()
    scrollArea.value?.scrollTo({ top: 0 })
  },
)
</script>

<template>
  <div class="mobile-app" :class="{ 'tabs-hidden': hideTabs }">
    <AnnouncementSheet />

    <header class="topbar">
      <router-link v-if="hideTabs" class="back" :to="route.name === 'topic-detail' ? '/community' : route.name === 'contact' ? '/mine' : '/honor-wall'">
        ←
      </router-link>
      <router-link v-else class="brand" to="/honor-wall">
        <img :src="logoUrl" alt="" />
      </router-link>
      <div class="title-block">
        <strong>{{ route.meta.title || platformStore.platformName }}</strong>
        <small>{{ platformStore.slogan }}</small>
      </div>
    </header>

    <div ref="scrollArea" class="scroll-area">
      <main class="page">
        <router-view v-slot="{ Component }">
          <transition name="slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>

    <nav v-if="!hideTabs" class="tabbar" aria-label="主导航">
      <router-link
        v-for="tab in tabs"
        :key="tab.name"
        :to="tab.path"
        :class="{ active: route.name === tab.name }"
      >
        <i :class="tab.icon" aria-hidden="true"></i>
        <span>{{ tab.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<style scoped>
.mobile-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background:
    radial-gradient(circle at 12% -10%, rgba(162, 29, 24, 0.08), transparent 42%),
    linear-gradient(180deg, #efe9db 0%, #f4f0e6 40%, #ece6d8 100%);
}

.topbar {
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 10px;
  height: calc(var(--top-h) + var(--safe-top));
  padding: var(--safe-top) 16px 0;
  border-bottom: 2px solid #292724;
  background: rgba(243, 239, 228, 0.92);
  backdrop-filter: blur(14px);
}

.brand img {
  width: 34px;
  height: 34px;
}

.back {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px solid #292724;
  background: #f7f3ea;
  color: #292724;
  font-size: 16px;
  text-decoration: none;
}

.title-block {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.title-block strong {
  overflow: hidden;
  font-size: 16px;
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title-block small {
  margin-top: 2px;
  color: #a21d18;
  font-size: 10px;
  letter-spacing: 0.08em;
}

.scroll-area {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.page {
  padding: 16px 16px 28px;
}

.tabbar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  height: calc(var(--tab-h) + var(--safe-bottom));
  padding-bottom: var(--safe-bottom);
  border-top: 2px solid #292724;
  background: #f3efe4;
}

.tabbar a {
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  color: #7d7166;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-decoration: none;
}

.tabbar a.active {
  color: #a21d18;
}

.tabbar i {
  width: 22px;
  height: 22px;
  background: currentColor;
  mask-position: center;
  mask-repeat: no-repeat;
  mask-size: contain;
}

.tabbar i.wall {
  mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M3 21V5h6v16H3zm6 0V9h6v12H9zm6 0V3h6v18h-6z'/></svg>");
}

.tabbar i.talk {
  mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M3 4h18v12H8l-5 5z'/></svg>");
}

.tabbar i.pen {
  mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M3 21l3.8-1 11-11-2.8-2.8-11 11L3 21zm14.7-14.3l2.1-2.1-2.8-2.8-2.1 2.1 2.8 2.8z'/></svg>");
}

.tabbar i.me {
  mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M12 12a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12zm0 2.2c-3.6 0-8 1.8-8 5.2V21h16v-1.6c0-3.4-4.4-5.2-8-5.2z'/></svg>");
}

.slide-enter-active,
.slide-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
