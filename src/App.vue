<template>
  <n-config-provider
    :theme-overrides="{
      common: {
        primaryColor: '#a21d18',
        primaryColorHover: '#c12a23',
        primaryColorPressed: '#7d1512',
      },
      Menu: {
        itemTextColorHorizontal: '#5e5952',
        itemTextColorHoverHorizontal: '#a21d18',
        itemTextColorActiveHorizontal: '#941a16',
        itemTextColorActiveHoverHorizontal: '#941a16',
        itemColorActiveHorizontal: 'rgba(162, 29, 24, 0.08)',
        itemBorderRadius: '2px',
      },
    }"
  >
    <n-message-provider>
      <n-dialog-provider>
        <router-view />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>
