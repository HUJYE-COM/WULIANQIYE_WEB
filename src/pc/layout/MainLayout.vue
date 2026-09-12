<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'

import logoUrl from '@/assets/logo.svg'
import StreetBackdrop from './StreetBackdrop.vue'
import AnnouncementDialog from '@/pc/components/AnnouncementDialog.vue'
import { usePlatformStore } from '@/stores/platform'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const platformStore = usePlatformStore()
const userStore = useUserStore()
const scrollArea = ref(null)

const activeMenu = computed(() => route.name)

watch(
  () => route.fullPath,
  async () => {
    await nextTick()
    scrollArea.value?.scrollTo({ top: 0 })
  },
)

function handleMenuSelect(key, item) {
  if (item.path !== route.path) {
    router.push(item.path)
  }
}

function logout() {
  userStore.logout()
  message.info('已退出登录')
  if (route.meta.requiresAuth) {
    router.push('/honor-wall')
  }
}
</script>

<template>
  <div class="main-layout">
    <AnnouncementDialog />

    <div class="street-layer">
      <StreetBackdrop />
    </div>

    <div class="ui-layer">
      <header class="site-header">
        <div class="header-inner">
          <router-link class="brand" to="/honor-wall" aria-label="返回首页">
            <img class="brand-logo" :src="logoUrl" alt="" />
            <span class="brand-copy">
              <strong>{{ platformStore.platformName }}</strong>
              <small>{{ platformStore.slogan }}</small>
            </span>
          </router-link>

          <n-menu
            class="main-navigation"
            mode="horizontal"
            :value="activeMenu"
            :options="platformStore.menuOptionsFor(userStore.isLoggedIn)"
            responsive
            @update:value="handleMenuSelect"
          />

          <div class="account-area">
            <template v-if="userStore.isLoggedIn">
              <span class="user-name">{{ userStore.user.nickname }}</span>
              <button class="text-action" type="button" @click="logout">退出</button>
            </template>
            <template v-else>
              <router-link class="login-action" to="/login">登录</router-link>
              <router-link class="register-action" to="/register">
                创建账号
                <span>↗</span>
              </router-link>
            </template>
          </div>
        </div>
      </header>

      <div ref="scrollArea" class="scroll-area">
        <main
          class="page-content"
          :class="{ 'submission-content': route.name === 'submission' }"
        >
          <router-view v-slot="{ Component }">
            <transition name="page" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </main>

        <footer class="site-footer">
          <span>© {{ new Date().getFullYear() }} {{ platformStore.platformName }}</span>
          <span class="footer-dot">·</span>
          <span>内容纯属虚构，如有雷同，纯属巧合</span>
          <template v-if="userStore.isLoggedIn">
            <span class="footer-dot">·</span>
            <router-link class="footer-link" to="/contact">联系站长</router-link>
          </template>
        </footer>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-layout {
  position: relative;
  display: grid;
  grid-template: 1fr / 1fr;
  height: 100vh;
  overflow: hidden;
  background: transparent;
}

.street-layer,
.ui-layer {
  grid-area: 1 / 1;
  min-width: 0;
  min-height: 0;
}

.street-layer {
  position: relative;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.ui-layer {
  z-index: 1;
  display: flex;
  overflow: hidden;
  flex-direction: column;
}

.site-header {
  flex-shrink: 0;
  border-bottom: 3px solid #292724;
  background: rgba(242, 240, 233, 0.88);
  backdrop-filter: blur(12px);
}

.header-inner {
  width: min(1180px, calc(100% - 48px));
  height: 76px;
  margin: 0 auto;
  display: flex;
  align-items: center;
}

.brand {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 12px;
  color: #201f1d;
  text-decoration: none;
}

.brand-logo {
  width: 48px;
  height: 48px;
  filter: grayscale(0.2) contrast(1.08);
}

.brand-copy {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand-copy strong {
  font-size: 17px;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.brand-copy small {
  margin-top: 5px;
  color: #a21d18;
  font-size: 10px;
  letter-spacing: 0.08em;
}

.main-navigation {
  min-width: 420px;
  margin-left: 52px;
  background: transparent;
}

.account-area {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  font-size: 11px;
  white-space: nowrap;
}

.user-name {
  max-width: 110px;
  overflow: hidden;
  color: #5e5952;
  font-weight: 700;
  text-overflow: ellipsis;
}

.text-action,
.login-action,
.register-action {
  border: 0;
  background: transparent;
  font: inherit;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-decoration: none;
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.text-action {
  color: #a21d18;
}

.login-action {
  padding: 9px 15px;
  border: 1px solid rgba(41, 39, 36, 0.48);
  color: #292724;
}

.register-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid #292724;
  background: #292724;
  color: #fff;
  box-shadow: 3px 3px 0 rgba(162, 29, 24, 0.72);
}

.register-action span {
  color: #ef6c62;
  font-size: 13px;
}

.text-action:hover {
  text-decoration: underline;
}

.login-action:hover {
  border-color: #a21d18;
  color: #a21d18;
  box-shadow: inset 0 -2px 0 rgba(162, 29, 24, 0.12);
}

.register-action:hover {
  background: #a21d18;
  border-color: #a21d18;
  box-shadow: 4px 4px 0 #292724;
  transform: translate(-1px, -1px);
}

.scroll-area {
  min-height: 0;
  min-height: 0;
  display: flex;
  flex: 1;
  overflow-y: auto;
  flex-direction: column;
  scrollbar-gutter: stable;
}

.page-content {
  position: relative;
  width: min(1020px, calc(100% - 320px));
  flex: 1;
  margin: 40px auto 24px;
  padding: 48px 44px 72px;
  border: 1px solid rgba(41, 39, 36, 0.18);
  background: #f2f0e9;
  box-shadow:
    0 18px 50px rgba(0, 0, 0, 0.28),
    10px 10px 0 rgba(18, 14, 10, 0.35);
}

.page-content.submission-content {
  width: min(1500px, calc(100% - 64px));
  margin-top: 20px;
  padding: 26px 30px 44px;
}

.site-footer {
  display: flex;
  justify-content: center;
  gap: 10px;
  padding: 28px 24px 36px;
  color: rgba(236, 220, 176, 0.62);
  font-size: 12px;
}

.footer-dot {
  color: #a21d18;
}

.footer-link {
  color: inherit;
  text-decoration: none;
}

.footer-link:hover {
  color: #ef6c62;
  text-decoration: underline;
}

.page-enter-active,
.page-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 760px) {
  .header-inner {
    width: calc(100% - 24px);
  }

  .brand-copy {
    display: none;
  }

  .main-navigation {
    min-width: 0;
    flex: 1;
    margin-left: 12px;
  }

  .account-area {
    margin-left: 8px;
  }

  .account-area .user-name {
    display: none;
  }

  .page-content {
    width: calc(100% - 32px);
    margin-top: 16px;
    padding: 32px 18px 48px;
  }

  .page-content.submission-content {
    width: calc(100% - 24px);
    padding: 22px 14px 36px;
  }
}
</style>
