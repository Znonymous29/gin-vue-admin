import { cva } from 'class-variance-authority'

// 菜单项配色变体：三种菜单风格 × 选中态 × 角色（普通项 / 分组标题）。
// 深浅由侧栏容器的语义 token 决定（见 useSidebarTheme 的 .gva-sider-dark 作用域）。
// 配色只用语义 token + 主色弱底 rgb(var(--primary-color)/α)。
export const menuItemVariants = cva(
  'group/mi relative flex w-full items-center gap-2 appearance-none bg-transparent cursor-pointer select-none whitespace-nowrap text-[14px] leading-none transition-colors outline-none',
  {
    variants: {
      theme: {
        design: 'rounded-none',
        light: 'rounded-[var(--gva-radius)]',
        group: 'rounded-lg'
      },
      active: { true: '', false: '' },
      role: { item: '', header: '' }
    },
    compoundVariants: [
      // design：全宽直角 + 左侧主色竖条 + 主色弱底（保留原风格观感）
      {
        theme: 'design',
        active: true,
        class:
          "text-active font-medium bg-[rgb(var(--primary-color)/0.12)] before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:rounded-r before:bg-primary before:content-['']"
      },
      {
        theme: 'design',
        active: false,
        class: 'text-base-text hover:bg-[rgb(var(--primary-color)/0.08)]'
      },
      // light：白底 + 主色实底选中
      { theme: 'light', active: true, class: 'bg-primary text-white' },
      { theme: 'light', active: false, class: 'text-base-text hover:bg-muted' },
      // group：分组标题 = 加粗基础色；子项 = 弱色；选中 = 浅灰药丸
      { theme: 'group', role: 'header', class: 'text-base-text font-semibold' },
      {
        theme: 'group',
        role: 'item',
        active: true,
        class: 'bg-[rgb(var(--primary-color)/0.12)] text-active font-medium'
      },
      {
        theme: 'group',
        role: 'item',
        active: false,
        class: 'text-muted-foreground hover:bg-muted hover:text-base-text'
      }
    ],
    defaultVariants: { theme: 'design', active: false, role: 'item' }
  }
)

// 侧栏容器底色：统一跟随 container（随全局明暗 / .gva-sider-dark 作用域自适应）。
export const SIDEBAR_SURFACE = 'bg-container text-base-text'

// 菜单角标：文本胶囊 / 纯圆点两种形态 × 五档语义色 × 行内 / 浮于右上角两种定位。
// 颜色只用语义 token 实底 + 白字（禁止对 CSS 变量取透明度），明暗与换肤自适应。
export const menuBadgeVariants = cva(
  'pointer-events-none block shrink-0 select-none font-medium text-white',
  {
    variants: {
      type: {
        error: 'bg-error',
        warning: 'bg-warning',
        success: 'bg-success',
        primary: 'bg-primary',
        info: 'bg-info'
      },
      shape: {
        dot: 'rounded-full',
        text: 'truncate rounded-full text-center'
      },
      floating: { true: 'absolute z-[1]', false: '' }
    },
    compoundVariants: [
      // 行内：与菜单行文字同一视觉尺寸，超长文案最多占 120px
      { shape: 'dot', floating: false, class: 'h-2 w-2' },
      {
        shape: 'text',
        floating: false,
        class: 'max-w-[120px] px-1.5 text-[11px] leading-[18px]'
      },
      // 浮标：贴按钮右上角，收窄字号并限宽，避免盖住图标
      { shape: 'dot', floating: true, class: 'right-2 top-2 h-2 w-2' },
      {
        shape: 'text',
        floating: true,
        class: 'right-1 top-1 max-w-[calc(100%_-_8px)] px-1 text-[10px] leading-[14px]'
      }
    ],
    defaultVariants: { type: 'error', shape: 'text', floating: false }
  }
)

// 侧栏 nav 的左右内边距：唯一由菜单风格决定，与收缩与否无关。
// design 贴边（配合左侧竖条美学，px-0）；light / group 留白圆角（px-2）。
export const menuNavPad = (theme) => (theme === 'design' ? 'px-0' : 'px-2')

// 收缩图标项（含侧栏常驻一级栏、g-menu 折叠叶子、折叠飞出触发）的统一类名来源：
// 配色 / 圆角 / 选中态全部走 menuItemVariants，跟随菜单风格；此处只叠加“图标居中”与
// “收起显示标题时竖排”两个布局细节。宽度贴边由外层 nav 的 menuNavPad 统一控制，故此处 px-0。
export const menuRailButton = (theme, active, stacked = false) =>
  cn(
    menuItemVariants({ theme, active, role: 'item' }),
    stacked ? 'flex-col justify-center gap-0.5 px-0' : 'justify-center px-0',
    FOCUS_RING
  )
