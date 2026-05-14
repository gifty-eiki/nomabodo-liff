import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const existing = await prisma.pricingConfig.count()
  if (existing > 0) {
    console.log('Seed data already exists, skipping')
    return
  }

  await prisma.pricingConfig.create({
    data: {
      label: '通常料金 30分',
      intervalMinutes: 30,
      amountYen: 500,
      appliesTo: 'pay_per_use',
    },
  })
  await prisma.pricingConfig.create({
    data: {
      label: '会員料金 30分',
      intervalMinutes: 30,
      amountYen: 0,
      appliesTo: 'subscriber',
    },
  })

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
