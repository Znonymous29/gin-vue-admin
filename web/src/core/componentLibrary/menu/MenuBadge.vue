<script setup>
import { computed } from 'vue'
import { cn } from '../utils'
import { menuBadgeVariants } from './variants'
import { MENU_BADGE_TYPES, hasMenuBadge } from './shared'

defineOptions({ name: 'GvaMenuBadge' })

const props = defineProps({
  // 菜单节点的 meta：读 badge（文本）/ badgeType（配色）/ badgeDot（圆点模式）
  meta: { type: Object, default: () => ({}) },
  // true 时绝对定位到父按钮右上角（折叠图标态用），false 为行内（展开态用）
  floating: { type: Boolean, default: false },
  class: { type: null, default: '' }
})

const visible = computed(() => hasMenuBadge(props.meta))
// 圆点优先于文本，与 el-badge 的 is-dot 语义一致
const shape = computed(() => (props.meta?.badgeDot ? 'dot' : 'text'))
// 存量菜单没有 badgeType（AutoMigrate 补列后为空串），统一回落到第一档
const type = computed(() =>
  MENU_BADGE_TYPES.includes(props.meta?.badgeType)
    ? props.meta.badgeType
    : MENU_BADGE_TYPES[0]
)

const badgeClass = computed(() =>
  cn(
    menuBadgeVariants({
      type: type.value,
      shape: shape.value,
      floating: props.floating
    }),
    props.class
  )
)
</script>

<template>
  <!-- 圆点无文本、纯装饰，对读屏隐藏；文本角标（New / 热门）是有效信息，保留可读 -->
  <span v-if="visible" :class="badgeClass" :aria-hidden="shape === 'dot' ? 'true' : null">
    <template v-if="shape === 'text'">{{ meta.badge }}</template>
  </span>
</template>
