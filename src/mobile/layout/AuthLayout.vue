<script setup>
import logoUrl from '@/assets/logo.svg'
import '@/mobile/assets/mobile.css'
</script>

<template>
  <main class="mobile-app auth-shell">
    <router-link class="auth-brand" to="/honor-wall">
      <img :src="logoUrl" alt="" />
      <span>
        <strong>无良企业荣誉馆</strong>
        <small>PUBLIC ARCHIVE</small>
      </span>
    </router-link>

    <section class="auth-card">
      <slot />
    </section>

    <p class="auth-note">内容纯属虚构，如有雷同，纯属巧合</p>
  </main>
</template>

<style scoped>
.auth-shell {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: calc(18px + env(safe-area-inset-top)) 18px calc(20px + env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at 80% 0%, rgba(162, 29, 24, 0.16), transparent 36%),
    linear-gradient(165deg, #1c1916 0%, #2d2620 48%, #3a2c24 100%);
}

.auth-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
  color: #f4efe4;
  text-decoration: none;
}

.auth-brand img {
  width: 40px;
  height: 40px;
}

.auth-brand span {
  display: flex;
  flex-direction: column;
}

.auth-brand strong {
  font-size: 15px;
  letter-spacing: 0.08em;
}

.auth-brand small {
  margin-top: 4px;
  color: rgba(236, 220, 176, 0.62);
  font-size: 9px;
  letter-spacing: 0.16em;
}

.auth-card {
  padding: 24px 20px 22px;
  border: 2px solid #292724;
  background: #f4f0e6;
  box-shadow: 8px 8px 0 #a21d18;
}

.auth-note {
  margin: auto 0 0;
  padding-top: 28px;
  color: rgba(236, 220, 176, 0.5);
  font-size: 11px;
  text-align: center;
}
</style>
