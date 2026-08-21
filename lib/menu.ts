/** メニュー1件分（クライアント/サーバー共通で扱える最小形。MenuItemと構造互換） */
export type MenuItemLite = {
  id: string
  label: string
  priceYen: number
  kind: string // "count"（個数） / "toggle"（ON/OFF）
}

/** 注文1行（セッション内の1メニューの数量） */
export type OrderLine = {
  menuItemId: string
  quantity: number
}

/** 注文合計（数量 × 単価）。学割・土日祝の対象外＝実額で加算される。 */
export function calcOrderTotal(order: OrderLine[], menu: MenuItemLite[]): number {
  const priceMap = new Map(menu.map((m) => [m.id, m.priceYen]))
  return order.reduce(
    (sum, line) => sum + (priceMap.get(line.menuItemId) ?? 0) * Math.max(0, line.quantity),
    0
  )
}
