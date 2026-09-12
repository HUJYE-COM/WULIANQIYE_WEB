import { createRouter, createWebHistory } from 'vue-router'

import { isMobileDevice } from '@/utils/device'
import { useUserStore } from '@/stores/user'

function pick(pcLoader, mobileLoader) {
  return () => (isMobileDevice() ? mobileLoader() : pcLoader())
}

const routes = [
  {
    path: '/',
    component: pick(
      () => import('@/pc/layout/MainLayout.vue'),
      () => import('@/mobile/layout/MainLayout.vue'),
    ),
    children: [
      {
        path: '',
        redirect: '/honor-wall',
      },
      {
        path: 'honor-wall',
        name: 'honor-wall',
        component: pick(
          () => import('@/pc/views/HonorWallView.vue'),
          () => import('@/mobile/views/HonorWallView.vue'),
        ),
        meta: { title: '荣誉墙' },
      },
      {
        path: 'article/:id',
        name: 'article-detail',
        component: pick(
          () => import('@/pc/views/ArticleDetailView.vue'),
          () => import('@/mobile/views/ArticleDetailView.vue'),
        ),
        meta: { title: '曝光档案' },
      },
      {
        path: 'community',
        name: 'community',
        component: pick(
          () => import('@/pc/views/CommunityView.vue'),
          () => import('@/mobile/views/CommunityView.vue'),
        ),
        meta: { title: '社区' },
      },
      {
        path: 'topic/:id',
        name: 'topic-detail',
        component: pick(
          () => import('@/pc/views/TopicDetailView.vue'),
          () => import('@/mobile/views/TopicDetailView.vue'),
        ),
        meta: { title: '社区话题' },
      },
      {
        path: 'submission',
        name: 'submission',
        component: pick(
          () => import('@/pc/views/SubmissionView.vue'),
          () => import('@/mobile/views/SubmissionView.vue'),
        ),
        meta: { title: '投稿', requiresAuth: true },
      },
      {
        path: 'contact',
        name: 'contact',
        component: pick(
          () => import('@/pc/views/ContactView.vue'),
          () => import('@/mobile/views/ContactView.vue'),
        ),
        meta: { title: '联系站长', requiresAuth: true },
      },
      {
        path: 'mine',
        name: 'mine',
        component: () => import('@/mobile/views/MineView.vue'),
        meta: { title: '我的' },
        beforeEnter: () => (isMobileDevice() ? true : '/honor-wall'),
      },
    ],
  },
  {
    path: '/login',
    name: 'login',
    component: pick(
      () => import('@/pc/views/LoginView.vue'),
      () => import('@/mobile/views/LoginView.vue'),
    ),
    meta: { title: '登录', guestOnly: true },
  },
  {
    path: '/register',
    name: 'register',
    component: pick(
      () => import('@/pc/views/RegisterView.vue'),
      () => import('@/mobile/views/RegisterView.vue'),
    ),
    meta: { title: '注册', guestOnly: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/honor-wall',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const userStore = useUserStore()
  await userStore.initialize()

  if (to.meta.guestOnly && userStore.isLoggedIn) {
    return '/honor-wall'
  }
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · 无良企业荣誉馆` : '无良企业荣誉馆'
})

export default router
