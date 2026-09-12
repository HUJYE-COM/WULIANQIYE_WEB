export function articleTags(value) {
  return String(value || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export function formatDate(value, style = 'short') {
  if (style === 'long') {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  }
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

export function formatTimeAgo(value) {
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (minutes < 1440) return `${Math.floor(minutes / 60)} 小时前`
  if (minutes < 10080) return `${Math.floor(minutes / 1440)} 天前`
  return formatDate(value)
}

export function displayName(user, fallback = '匿名围观者') {
  return user?.nickname || fallback
}

export function initial(name) {
  return String(name || '匿').slice(0, 1)
}
