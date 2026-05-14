import { prisma } from '@/lib/db'
import { PricingEditor } from '@/components/admin/PricingEditor'

export const dynamic = 'force-dynamic'

export default async function PricingPage() {
  const configs = await prisma.pricingConfig.findMany({
    orderBy: { appliesTo: 'asc' },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">料金設定</h1>
      <p className="text-gray-500 text-sm mb-6">
        変更はすぐに反映されます。次回のチェックアウトから新しい料金が適用されます。
      </p>
      <PricingEditor configs={configs} />
    </div>
  )
}
