import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyLineToken, getLineUserId } from '@/lib/line'

/**
 * 注文の保存（上書き）。
 * body: { order: { menuItemId: string; quantity: number }[] }
 * - 送られてきた数量でセッションの注文を「上書き」する（quantity=0 は削除）。
 * - 何度でも開いて数量を修正できる（決定を押すたびに最新の内容へ更新）。
 */
export async function POST(request: Request) {
  const token = getLineUserId(request)
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const lineUserId = await verifyLineToken(token)
  if (!lineUserId) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const profile = await prisma.profile.findUnique({ where: { lineUserId } })
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const session = await prisma.visitSession.findFirst({
    where: { profileId: profile.id, checkedOutAt: null },
  })
  if (!session) {
    return NextResponse.json(
      { error: 'チェックイン中のセッションがありません' },
      { status: 404 }
    )
  }

  const body = await request.json().catch(() => null)
  const order = Array.isArray(body?.order) ? body.order : null
  if (!order) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // 有効なメニューのみ受け付ける
  const menuItems = await prisma.menuItem.findMany({ where: { isActive: true } })
  const validIds = new Set(menuItems.map((m) => m.id))

  for (const line of order) {
    if (!validIds.has(line.menuItemId)) continue
    const qty = Math.max(0, Math.floor(Number(line.quantity) || 0))
    if (qty === 0) {
      await prisma.orderItem.deleteMany({
        where: { visitSessionId: session.id, menuItemId: line.menuItemId },
      })
    } else {
      await prisma.orderItem.upsert({
        where: {
          visitSessionId_menuItemId: {
            visitSessionId: session.id,
            menuItemId: line.menuItemId,
          },
        },
        create: {
          visitSessionId: session.id,
          menuItemId: line.menuItemId,
          quantity: qty,
        },
        update: { quantity: qty },
      })
    }
  }

  const saved = await prisma.orderItem.findMany({
    where: { visitSessionId: session.id },
    include: { menuItem: true },
  })
  const orderTotal = saved.reduce(
    (sum, oi) => sum + oi.menuItem.priceYen * oi.quantity,
    0
  )

  return NextResponse.json({
    order: saved.map((oi) => ({ menuItemId: oi.menuItemId, quantity: oi.quantity })),
    orderTotal,
  })
}
