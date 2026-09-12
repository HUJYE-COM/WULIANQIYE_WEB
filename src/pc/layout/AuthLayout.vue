<script setup>
import logoUrl from '@/assets/logo.svg'
import StreetBackdrop from './StreetBackdrop.vue'
</script>

<template>
  <main class="auth-layout">
    <StreetBackdrop />

    <router-link class="auth-brand" to="/honor-wall" aria-label="返回首页">
      <img :src="logoUrl" alt="" />
      <span>
        <strong>无良企业荣誉馆</strong>
        <small>PUBLIC INTEREST ARCHIVE</small>
      </span>
    </router-link>

    <section class="auth-stage">
      <aside class="auth-manifesto">
        <span class="eyebrow">ARCHIVE ACCESS</span>
        <h1>每一份记录，<br />都应当有<em>署名</em></h1>
        <p>登录后，你可以持续跟进提交的线索与社区讨论。账号仅用于识别贡献者，不会替事实增加分量。</p>
        <blockquote>“身份可以匿名，证据必须经得起核验。”</blockquote>
      </aside>

      <div class="auth-card">
        <slot />
      </div>
    </section>
  </main>
</template>

<style scoped>
.auth-layout {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  padding: 32px 48px;
  color: #292724;
}

.auth-brand {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #f2f0e9;
  text-decoration: none;
}

.auth-brand img {
  width: 48px;
  height: 48px;
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
  color: rgba(236, 220, 176, 0.6);
  font-size: 8px;
  letter-spacing: 0.16em;
}

.auth-stage {
  position: relative;
  z-index: 2;
  width: min(980px, calc(100vw - 64px));
  min-height: calc(100vh - 112px);
  display: grid;
  align-items: center;
  grid-template-columns: minmax(320px, 1fr) minmax(390px, 0.8fr);
  gap: 90px;
  margin: 0 auto;
  padding: 52px 0 72px;
}

.auth-manifesto {
  color: #eee4d6;
}

.eyebrow {
  color: #ef6c62;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.24em;
}

.auth-manifesto h1 {
  margin: 18px 0 25px;
  font-family: 'Songti SC', STSong, serif;
  font-size: clamp(48px, 5vw, 68px);
  line-height: 1.15;
  letter-spacing: -0.05em;
}

.auth-manifesto h1 em {
  color: #ef6c62;
  font-style: normal;
}

.auth-manifesto p {
  max-width: 440px;
  margin: 0;
  color: rgba(236, 220, 176, 0.7);
  font-size: 13px;
  line-height: 1.9;
}

.auth-manifesto blockquote {
  max-width: 440px;
  margin: 32px 0 0;
  padding: 18px 20px;
  border-left: 3px solid #a21d18;
  background: rgba(18, 16, 14, 0.58);
  color: rgba(242, 240, 233, 0.82);
  font-family: 'Songti SC', STSong, serif;
  font-size: 14px;
}

.auth-card {
  padding: 38px 40px 42px;
  border: 2px solid #292724;
  border-radius: 2px;
  background: rgba(246, 244, 237, 0.96);
  box-shadow: 10px 10px 0 #a21d18;
}

@media (max-width: 820px) {
  .auth-layout {
    padding: 20px;
    overflow: auto;
  }

  .auth-stage {
    width: min(480px, 100%);
    min-height: auto;
    grid-template-columns: 1fr;
    gap: 28px;
    padding-top: 60px;
  }

  .auth-manifesto h1 {
    font-size: 42px;
  }

  .auth-manifesto p,
  .auth-manifesto blockquote {
    display: none;
  }

  .auth-card {
    padding: 32px 24px 36px;
  }
}
</style>
