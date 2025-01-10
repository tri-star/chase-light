import type { SideMenuItemId } from '~/components/common/side-menu/side-menu'

declare module '#app' {
  interface PageMeta {
    allowGuest?: boolean
    menuId?: SideMenuItemId
  }
}

export {}
