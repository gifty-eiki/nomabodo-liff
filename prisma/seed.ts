import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const existing = await prisma.pricePlan.count()
  if (existing > 0) {
    console.log('PricePlan seed already exists, skipping plans')
  } else {
    // 料金プラン（滞在時間で自動判定）
    await prisma.pricePlan.createMany({
      data: [
        { label: '2時間', maxMinutes: 120, amountYen: 2000, sortOrder: 1 },
        { label: '4時間', maxMinutes: 240, amountYen: 3000, sortOrder: 2 },
        { label: 'フリー', maxMinutes: null, amountYen: 3500, sortOrder: 3 },
      ],
    })
  }

  // 追加メニュー（フード・ドリンク）の初期データ（暫定価格 300〜500円）
  const menuCount = await prisma.menuItem.count()
  if (menuCount > 0) {
    console.log('MenuItem seed already exists, skipping menu')
  } else {
    await prisma.menuItem.createMany({
      data: [
        { label: 'ポテト', priceYen: 300, kind: 'count', sortOrder: 1 },
        { label: 'お菓子', priceYen: 300, kind: 'count', sortOrder: 2 },
        { label: 'たこ焼き', priceYen: 400, kind: 'count', sortOrder: 3 },
        { label: 'カレー', priceYen: 500, kind: 'count', sortOrder: 4 },
        { label: 'ドリンクバー', priceYen: 400, kind: 'toggle', sortOrder: 5 },
      ],
    })
  }

  // 開発用管理者ユーザーを作成
  await prisma.profile.upsert({
    where: { lineUserId: 'dev-user-001' },
    create: {
      lineUserId: 'dev-user-001',
      displayName: '開発ユーザー（管理者）',
      isAdmin: true,
    },
    update: { isAdmin: true },
  })

  console.log('Seed data created!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
