import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const usePlatformStore = defineStore('platform', () => {
  const platformName = ref('无良企业荣誉馆')
  const slogan = ref('记录每一位“行业楷模”')

  const navigation = ref([
    {
      key: 'honor-wall',
      label: '荣誉墙',
      path: '/honor-wall',
      description: '陈列企业不愿被忘记的“光荣事迹”',
    },
    {
      key: 'community',
      label: '社区',
      path: '/community',
      description: '核验线索，交换避坑情报',
    },
    {
      key: 'submission',
      label: '投稿',
      path: '/submission',
      description: '提交事实、证据与可靠来源',
    },
    {
      key: 'contact',
      label: '联系站长',
      path: '/contact',
      description: '向站长提交建议与问题',
      requiresAuth: true,
    },
  ])

  const menuOptions = computed(() =>
    navigation.value.map(({ key, label, path }) => ({
      key,
      label,
      path,
    })),
  )

  function menuOptionsFor(isLoggedIn) {
    return navigation.value
      .filter((item) => !item.requiresAuth || isLoggedIn)
      .map(({ key, label, path }) => ({
        key,
        label,
        path,
      }))
  }

  return {
    platformName,
    slogan,
    navigation,
    menuOptions,
    menuOptionsFor,
  }
})
