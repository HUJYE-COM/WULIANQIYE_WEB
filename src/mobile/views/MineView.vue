<script setup>
import { useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'

import { initial } from '@/mobile/utils/format'
import { usePlatformStore } from '@/stores/platform'
import { useUserStore } from '@/stores/user'

const message = useMessage()
const router = useRouter()
const platformStore = usePlatformStore()
const userStore = useUserStore()

function logout() {
  userStore.logout()
  message.info('已退出登录')
  router.push('/honor-wall')
}
</script>

<template>
  <section class="mine">
    <div class="card profile">
      <template v-if="userStore.isLoggedIn">
        <i>{{ initial(userStore.user.nickname) }}</i>
        <div>
          <strong>{{ userStore.user.nickname }}</strong>
          <small>{{ userStore.user.account }}</small>
        </div>
      </template>
      <template v-else>
        <i>馆</i>
        <div>
          <strong>尚未入馆登记</strong>
          <small>登录后才能投稿、附议与联系站长</small>
        </div>
      </template>
    </div>

    <div class="card links">
      <router-link v-if="userStore.isLoggedIn" to="/contact">联系站长</router-link>
      <router-link to="/submission">去投稿台</router-link>
      <router-link to="/community">去社区广场</router-link>
    </div>

    <div v-if="userStore.isLoggedIn" class="card">
      <button type="button" @click="logout">退出登录</button>
    </div>
    <div v-else class="auth">
      <router-link class="login" to="/login">登录</router-link>
      <router-link class="reg" to="/register">创建账号</router-link>
    </div>

    <p class="foot">
      {{ platformStore.platformName }} · 内容纯属虚构，如有雷同，纯属巧合
    </p>
  </section>
</template>

<style scoped>
.card {
  margin-bottom: 12px;
  padding: 16px;
  border: 1px solid #c8bdb2;
  background: #f7f3ea;
}

.profile {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 2px solid #292724;
  box-shadow: 5px 5px 0 #292724;
}

.profile i {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #292724;
  color: #f4efe4;
  font-size: 20px;
  font-style: normal;
}

.profile div {
  display: flex;
  flex-direction: column;
}

.profile small {
  margin-top: 4px;
  color: #8a7b6e;
  font-size: 12px;
}

.links {
  display: flex;
  flex-direction: column;
}

.links a,
.card button,
.auth a {
  min-height: 46px;
  display: flex;
  align-items: center;
  border: 0;
  border-bottom: 1px solid #eadfd4;
  background: transparent;
  color: #292724;
  font-weight: 700;
  text-decoration: none;
}

.links a:last-child {
  border-bottom: 0;
}

.card button {
  width: 100%;
  justify-content: center;
  border-bottom: 0;
  color: #a21d18;
}

.auth {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.auth a {
  justify-content: center;
  border: 1px solid #292724;
}

.auth .reg {
  background: #292724;
  color: #f7f3ea;
}

.foot {
  margin-top: 28px;
  color: #9c8876;
  font-size: 11px;
  line-height: 1.6;
  text-align: center;
}
</style>
