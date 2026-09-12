<script setup>
import { reactive, ref } from 'vue'
import { useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'

import AuthLayout from '@/mobile/layout/AuthLayout.vue'
import { getErrorMessage } from '@/constants/errorCodes'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const message = useMessage()
const userStore = useUserStore()
const submitting = ref(false)
const errors = reactive({})
const form = reactive({ nickname: '', account: '', password: '', confirmPassword: '' })

function validate() {
  const nickname = form.nickname.trim()
  errors.nickname = nickname && nickname.length <= 64 ? '' : '请输入不超过 64 字的昵称'
  errors.account = /^[A-Za-z0-9]{6,20}$/.test(form.account) ? '' : '账号应为 6–20 位字母或数字'
  errors.password = form.password ? '' : '请输入密码'
  errors.confirmPassword =
    form.confirmPassword && form.confirmPassword === form.password ? '' : '两次输入的密码不一致'
  return !Object.values(errors).some(Boolean)
}

async function submit() {
  if (!validate() || submitting.value) return
  submitting.value = true
  try {
    await userStore.register({
      nickname: form.nickname.trim(),
      account: form.account,
      password: form.password,
    })
    message.success('注册成功，已自动登录')
    await router.replace('/honor-wall')
  } catch (error) {
    message.error(getErrorMessage(error))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <form class="form" novalidate @submit.prevent="submit">
      <span>NEW CARD</span>
      <h2>登记新身份</h2>
      <label>
        昵称
        <input
          v-model="form.nickname"
          autocomplete="nickname"
          maxlength="64"
          placeholder="公开展示的称呼"
        />
        <small v-if="errors.nickname">{{ errors.nickname }}</small>
      </label>
      <label>
        账号
        <input
          v-model.trim="form.account"
          autocomplete="username"
          maxlength="20"
          placeholder="6–20 位字母或数字"
        />
        <small v-if="errors.account">{{ errors.account }}</small>
      </label>
      <label>
        密码
        <input
          v-model="form.password"
          autocomplete="new-password"
          placeholder="设置登录密码"
          type="password"
        />
        <small v-if="errors.password">{{ errors.password }}</small>
      </label>
      <label>
        确认密码
        <input
          v-model="form.confirmPassword"
          autocomplete="new-password"
          placeholder="再次输入密码"
          type="password"
        />
        <small v-if="errors.confirmPassword">{{ errors.confirmPassword }}</small>
      </label>
      <button :disabled="submitting" type="submit">{{ submitting ? '正在登记…' : '登记并登录' }}</button>
      <p>已经有账号？<router-link to="/login">返回登录</router-link></p>
    </form>
  </AuthLayout>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

span {
  color: #a21d18;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.2em;
}

h2 {
  margin: 0;
  font-family: 'Songti SC', STSong, serif;
  font-size: 26px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #5f4e41;
  font-size: 12px;
  font-weight: 700;
}

input {
  height: 44px;
  outline: 0;
  padding: 0 12px;
  border: 1px solid #d5cabf;
  background: #fffdf8;
  font-weight: 400;
}

small {
  color: #a21d18;
}

button {
  min-height: 46px;
  border: 1px solid #292724;
  background: #292724;
  color: #f7f3ea;
  font-weight: 700;
}

p {
  margin: 0;
  color: #8a7b6e;
  font-size: 13px;
  text-align: center;
}

a {
  color: #a21d18;
}
</style>
