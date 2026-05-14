import { prisma } from '@/lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ page?: string; search?: string }>
}

export default async function CustomersPage({ searchParams }: Props) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.search || ''
  const limit = 20

  const where = search
    ? { displayName: { contains: search, mode: 'insensitive' as const } }
    : {}

  const [customers, total] = await Promise.all([
    prisma.profile.findMany({
      where,
      include: {
        subscription: true,
        visitSessions: { where: { checkedOutAt: null }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.profile.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">顧客一覧</h1>

      {/* 検索 */}
      <form className="mb-4">
        <div className="flex gap-2">
          <input
            name="search"
            defaultValue={search}
            placeholder="名前で検索..."
            className="flex-1 px-4 py-2 border rounded-lg text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm"
          >
            検索
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b">
              <th className="px-6 py-3">お客様</th>
              <th className="px-6 py-3">会員</th>
              <th className="px-6 py-3">状態</th>
              <th className="px-6 py-3">登録日</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/customers/${customer.id}`}
                    className="flex items-center gap-3 hover:underline"
                  >
                    {customer.pictureUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={customer.pictureUrl}
                        alt=""
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span className="font-medium">
                      {customer.displayName ?? '不明'}
                    </span>
                  </Link>
                </td>
                <td className="px-6 py-4">
                  {customer.subscription?.status === 'active' ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                      会員
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {customer.visitSessions.length > 0 ? (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                      在室中
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">
                  {new Date(customer.createdAt).toLocaleDateString('ja-JP')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/customers?page=${p}${search ? `&search=${search}` : ''}`}
              className={`px-3 py-1 rounded text-sm ${
                p === page
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
