import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyLineToken, getLineUserId } from '@/lib/line'

export async function POST(request: Request) {
  const token = getLineUserId(request)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const lineUserId = await verifyLineToken(token)
  if (!lineUserId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const body = await request.json()
  const { realName, playerName, gender, ageGroup, region } = body

  if (!realName?.trim() || !playerName?.trim() || !gender || !ageGroup || !region) {
    return NextResponse.json({ error: '全ての項目を入力してください' }, { status: 400 })
  }

  await prisma.profile.update({
    where: { lineUserId },
    data: {
      realName: realName.trim(),
      playerName: playerName.trim(),
      gender,
      ageGroup,
      region,
      surveyCompleted: true,
    },
  })

  return NextResponse.json({ ok: true })
}
