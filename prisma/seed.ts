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
