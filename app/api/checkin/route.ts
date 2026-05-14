import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyLineToken, getLineUserId } from '@/lib/line'

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

  const existing = await prisma.visitSession.findFirst({
    where: { profileId: profile.id, checkedOutAt: null },
  })
  if (existing) {
    return NextResponse.json(
      { error: '既にチェックイン済みです' },
      { status: 409 }
    )
  }

  const session = await prisma.visitSession.create({
    data: { profileId: profile.id },
  })

  return NextResponse.json({ session })
}
