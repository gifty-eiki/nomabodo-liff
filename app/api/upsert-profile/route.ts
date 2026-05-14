import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyLineToken, getLineUserId } from '@/lib/line'

const DEV_TOKEN = 'dev-access-token'

export async function POST(request: Request) {
  const token = getLineUserId(request)
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const lineUserId = await verifyLineToken(token)
  if (!lineUserId) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  // 開発モードはLINE APIを呼ばない
  let displayName: string | undefined
  let pictureUrl: string | undefined

  if (token !== DEV_TOKEN) {
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (profileRes.ok) {
      const lineProfile = await profileRes.json()
      displayName = lineProfile.displayName
      pictureUrl = lineProfile.pictureUrl
    }
  }

  const profile = await prisma.profile.upsert({
    where: { lineUserId },
    create: {
      lineUserId,
      displayName: displayName ?? '開発ユーザー',
      pictureUrl,
    },
    update: {
      ...(displayName && { displayName }),
      ...(pictureUrl && { pictureUrl }),
    },
  })

  return NextResponse.json({ profile })
}
