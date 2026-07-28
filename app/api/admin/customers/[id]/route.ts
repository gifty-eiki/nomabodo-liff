import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'

// 顧客の学割ステータスなどを更新する（管理者専用）
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await getAdminSession()
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { isStudent } = body

  if (typeof isStudent !== 'boolean') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const customer = await prisma.profile.update({
    where: { id },
    data: { isStudent },
  })

  return NextResponse.json({ isStudent: customer.isStudent })
}
