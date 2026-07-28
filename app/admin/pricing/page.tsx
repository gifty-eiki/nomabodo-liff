import { prisma } from '@/lib/db'
import { PricingEditor } from '@/components/admin/PricingEditor'

export const dynamic = 'force-dynamic'

export default async function PricingPage() {
  const plans = await prisma.pricePlan.findMany({
    orderBy: { sortOrder: 'asc' },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">料金設定（プラン）</h1>
      <p className="text-gray-500 text-sm mb-2">
        滞在時間に応じて自動でプランが適用されます（上限時間が短いプランから順に判定）。
      </p>
      <p className="text-gray-500 text-sm mb-6">
        「上限時間」が空欄のプランは<strong>フリー（上限なし）</strong>です。会員は常に無料。
        学割ONの人はプラン料金が半額、土日祝は一律+¥500されます。
      </p>
      <PricingEditor plans={plans} />
    </div>
  )
}
