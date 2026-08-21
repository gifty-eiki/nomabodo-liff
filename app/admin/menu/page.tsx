import { prisma } from '@/lib/db'
import { MenuEditor } from '@/components/admin/MenuEditor'

export const dynamic = 'force-dynamic'

export default async function MenuPage() {
  const items = await prisma.menuItem.findMany({
    orderBy: { sortOrder: 'asc' },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">メニュー設定</h1>
      <p className="text-gray-500 text-sm mb-2">
        ユーザーが入室後に注文できる追加メニュー（フード・ドリンク）です。価格を変更できます。
      </p>
      <p className="text-gray-500 text-sm mb-6">
        注文額は退室時の合計に加算されます（学割・土日祝の割引/加算は対象外＝実額）。
      </p>
      <MenuEditor items={items} />
    </div>
  )
}
