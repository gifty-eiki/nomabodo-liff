import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyLineToken, getLineUserId } from '@/lib/line'

export async function PUT(request: Request) {
  const token = getLineUserId(request)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const lineUserId = await verifyLineToken(token)
  if (!lineUserId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const body = await request.json()
  const { playerName } = body

  if (!playerName?.trim()) {
    return NextResponse.json({ error: 'プレイヤーネームを入力してください' }, { status: 400 })
  }

  await prisma.profile.update({
    where: { lineUserId },
    data: { playerName: playerName.trim() },
  })

  return NextResponse.json({ ok: true })
}
