const MOBILE_UA =
  /Android|iPhone|iPad|iPod|Mobile|HarmonyOS|Huawei|OpenHarmony|webOS|BlackBerry|IEMobile|Opera Mini/i

export function isMobileDevice() {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent || ''
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const narrow = window.matchMedia('(max-width: 860px)').matches
  return MOBILE_UA.test(ua) || (coarse && narrow) || narrow
}
