<script setup>
import { reactive, ref } from 'vue'
import { useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'

import '@/assets/auth-form.css'
import AuthLayout from '@/pc/layout/AuthLayout.vue'
import { getErrorMessage } from '@/constants/errorCodes'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const message = useMessage()
const userStore = useUserStore()
const submitting = ref(false)
const errors = reactive({})
const form = reactive({
  nickname: '',
  account: '',
  password: '',
  confirmPassword: '',
})

function validate() {
  const nickname = form.nickname.trim()
  errors.nickname = nickname && nickname.length <= 64 ? '' : '请输入不超过 64 字的昵称'
  errors.account = /^[A-Za-z0-9]{6,20}$/.test(form.account)
    ? ''
    : '账号应为 6–20 位字母或数字'
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
    <form class="auth-form" novalidate @submit.prevent="submit">
      <span class="form-kicker">NEW CONTRIBUTOR</span>
      <h2>登记新身份</h2>
      <p class="form-description">创建一个用于署名、跟进线索与参与讨论的账号。</p>

      <label class="field">
        <span>昵称 <b>*</b></span>
        <div class="input-wrap">
          <input
            v-model="form.nickname"
            :aria-invalid="Boolean(errors.nickname)"
            autocomplete="nickname"
            maxlength="64"
            placeholder="公开展示的称呼"
            type="text"
          />
        </div>
        <small v-if="errors.nickname" class="field-error">{{ errors.nickname }}</small>
      </label>

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
            autocomplete="new-password"
            placeholder="设置登录密码"
            type="password"
          />
        </div>
        <small v-if="errors.password" class="field-error">{{ errors.password }}</small>
      </label>

      <label class="field">
        <span>确认密码 <b>*</b></span>
        <div class="input-wrap">
          <input
            v-model="form.confirmPassword"
            :aria-invalid="Boolean(errors.confirmPassword)"
            autocomplete="new-password"
            placeholder="再次输入密码"
            type="password"
          />
        </div>
        <small v-if="errors.confirmPassword" class="field-error">
          {{ errors.confirmPassword }}
        </small>
      </label>

      <button class="submit-button" :disabled="submitting" type="submit">
        {{ submitting ? '正在登记…' : '登记并登录' }}
        <span v-if="!submitting">→</span>
      </button>

      <p class="switch-entry">
        已经有账号？
        <router-link to="/login">返回登录</router-link>
      </p>
    </form>
  </AuthLayout>
</template>
