import { prisma } from '@/lib/db'
import { formatYen, formatDuration } from '@/lib/billing'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params

  const customer = await prisma.profile.findUnique({
    where: { id },
    include: {
      subscription: true,
      visitSessions: {
        orderBy: { checkedInAt: 'desc' },
        take: 50,
        include: { payment: true },
      },
    },
  })

  if (!customer) notFound()

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/customers" className="text-sm text-gray-400 hover:text-gray-600">
          ← 顧客一覧に戻る
        </Link>
      </div>

      {/* プロフィール */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex items-center gap-4">
        {customer.pictureUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={customer.pictureUrl}
            alt=""
            className="w-16 h-16 rounded-full"
          />
        )}
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            {customer.displayName ?? '不明'}
          </h1>
          <p className="text-gray-400 text-sm">
            登録日: {new Date(customer.createdAt).toLocaleDateString('ja-JP')}
          </p>
          {customer.subscription?.status === 'active' && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              会員（
              {customer.subscription.currentPeriodEnd
                ? new Date(
                    customer.subscription.currentPeriodEnd
                  ).toLocaleDateString('ja-JP') + ' まで'
                : ''}
              ）
            </span>
          )}
        </div>
      </div>

      {/* 来店履歴 */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="font-bold text-gray-800">来店履歴</h2>
        </div>
        {customer.visitSessions.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400">
            来店履歴がありません
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b">
                <th className="px-6 py-3">日付</th>
                <th className="px-6 py-3">入室</th>
                <th className="px-6 py-3">退室</th>
                <th className="px-6 py-3">滞在時間</th>
                <th className="px-6 py-3">料金</th>
                <th className="px-6 py-3">決済</th>
              </tr>
            </thead>
            <tbody>
              {customer.visitSessions.map((session) => (
                <tr key={session.id} className="border-b last:border-0">
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {new Date(session.checkedInAt).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(session.checkedInAt).toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {session.checkedOutAt
                      ? new Date(session.checkedOutAt).toLocaleTimeString(
                          'ja-JP',
                          { hour: '2-digit', minute: '2-digit' }
                        )
                      : '在室中'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {session.durationMinutes != null
                      ? formatDuration(session.durationMinutes)
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {session.amountYen != null ? formatYen(session.amountYen) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {session.payment ? (
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          session.payment.status === 'succeeded'
                            ? 'bg-green-100 text-green-700'
                            : session.payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {session.payment.status === 'succeeded'
                          ? '完了'
                          : session.payment.status === 'pending'
                          ? '保留'
                          : '失敗'}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
