<script setup>
import { reactive, ref } from 'vue'
import { useMessage } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'

import '@/assets/auth-form.css'
import AuthLayout from '@/pc/layout/AuthLayout.vue'
import { getErrorMessage } from '@/constants/errorCodes'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const userStore = useUserStore()
const submitting = ref(false)
const errors = reactive({})
const form = reactive({
  account: '',
  password: '',
})

function validate() {
  errors.account = /^[A-Za-z0-9]{6,20}$/.test(form.account)
    ? ''
    : '账号应为 6–20 位字母或数字'
  errors.password = form.password ? '' : '请输入密码'
  return !errors.account && !errors.password
}

async function submit() {
  if (!validate() || submitting.value) return
  submitting.value = true
  try {
    await userStore.login(form)
    message.success('登录成功')
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/honor-wall'
    await router.replace(redirect)
  } catch (error) {
    message.error(getErrorMessage(error))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <form class="auth-form" novalidate @submit.prevent="submit">
      <span class="form-kicker">IDENTITY CHECK</span>
      <h2>进入档案馆</h2>
      <p class="form-description">使用账号与密码确认你的贡献者身份。</p>

      <label class="field">
        <span>账号 <b>*</b></span>
        <div class="input-wrap">
          <input
            v-model.trim="form.account"
            :aria-invalid="Boolean(errors.account)"
            autocomplete="username"
            maxlength="20"
            placeholder="6–20 位字母或数字"
            type="text"
          />
        </div>
        <small v-if="errors.account" class="field-error">{{ errors.account }}</small>
      </label>

      <label class="field">
        <span>密码 <b>*</b></span>
        <div class="input-wrap">
          <input
            v-model="form.password"
            :aria-invalid="Boolean(errors.password)"
            autocomplete="current-password"
            placeholder="输入密码"
            type="password"
          />
        </div>
        <small v-if="errors.password" class="field-error">{{ errors.password }}</small>
      </label>

      <button class="submit-button" :disabled="submitting" type="submit">
        {{ submitting ? '正在核验…' : '确认身份并登录' }}
        <span v-if="!submitting">→</span>
      </button>

      <p class="switch-entry">
        还没有账号？
        <router-link to="/register">登记新身份</router-link>
      </p>
    </form>
  </AuthLayout>
</template>
