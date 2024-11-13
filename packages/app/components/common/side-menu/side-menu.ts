export const sideMenuItems = [
  {
    id: "dashboard",
    icon: "mdi:view-dashboard",
    title: "ダッシュボード",
    path: "/",
  },
  {
    id: "feeds",
    icon: "mdi:rss-box",
    title: "フィード",
    path: "/feeds",
  },
] as const
type SideMenuItem = (typeof sideMenuItems)[number]

export const SIDE_MENU_IDS = sideMenuItems.map((item) => item.id)
export type SideMenuItemId = (typeof SIDE_MENU_IDS)[number]

export const SIDE_MENU_ITEM_MAP: {
  [k in SideMenuItem["id"]]: Extract<SideMenuItem, { id: k }>
} = sideMenuItems.reduce((result, item) => {
  result[item.id] = item
  return result
}, {} as any)
