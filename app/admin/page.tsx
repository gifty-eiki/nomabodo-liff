import { prisma } from '@/lib/db'
import { formatYen, formatDuration } from '@/lib/billing'
import { ForceCheckoutButton } from '@/components/admin/ForceCheckoutButton'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  // JSTで今日の0時を計算（サーバーはUTCのため+9時間調整）
  const nowJST = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const todayStart = new Date(
    Date.UTC(nowJST.getUTCFullYear(), nowJST.getUTCMonth(), nowJST.getUTCDate()) - 9 * 60 * 60 * 1000
  )

  const [currentGuests, todayVisitors, todayRevenueResult, subscriberCount] = await Promise.all([
    // 現在の在室者
    prisma.visitSession.findMany({
      where: { checkedOutAt: null },
      include: { profile: true },
      orderBy: { checkedInAt: 'asc' },
    }),
    // 本日来訪した全員（退室済み含む）
    prisma.visitSession.findMany({
      where: {
        checkedInAt: { gte: todayStart },
        checkedOutAt: { not: null },
      },
      include: { profile: true },
      orderBy: { checkedInAt: 'asc' },
    }),
    // 本日の売上（セッションのamountYenで集計）
    prisma.visitSession.aggregate({
      where: {
        checkedInAt: { gte: todayStart },
        checkedOutAt: { not: null },
        amountYen: { not: null },
      },
      _sum: { amountYen: true },
    }),
    prisma.subscription.count({ where: { status: 'active' } }),
  ])

  const todayRevenue = todayRevenueResult._sum.amountYen ?? 0

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">ダッシュボード</h1>

      {/* サマリーカード */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-gray-500 text-sm mb-1">現在の在室者</p>
          <p className="text-3xl font-bold text-green-600">
            {currentGuests.length}
            <span className="text-base font-normal text-gray-500"> 人</span>
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-gray-500 text-sm mb-1">本日の売上</p>
          <p className="text-3xl font-bold text-blue-600">
            {formatYen(todayRevenue)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-gray-500 text-sm mb-1">会員数</p>
          <p className="text-3xl font-bold text-purple-600">
            {subscriberCount}
            <span className="text-base font-normal text-gray-500"> 人</span>
          </p>
        </div>
      </div>

      {/* 現在の在室者 */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="px-6 py-4 border-b">
          <h2 className="font-bold text-gray-800">現在の在室者</h2>
        </div>
        {currentGuests.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400">
            現在在室中の方はいません
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b">
                <th className="px-6 py-3">お客様</th>
                <th className="px-6 py-3">入室時刻</th>
                <th className="px-6 py-3">滞在時間</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {currentGuests.map((session) => {
                const elapsed = Math.floor(
                  (Date.now() - new Date(session.checkedInAt).getTime()) / 60000
                )
                return (
                  <tr key={session.id} className="border-b last:border-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {session.profile.pictureUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={session.profile.pictureUrl} alt="" className="w-8 h-8 rounded-full" />
                        )}
                        <span className="font-medium">{session.profile.displayName ?? '不明'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(session.checkedInAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatDuration(elapsed)}</td>
                    <td className="px-6 py-4">
                      <ForceCheckoutButton sessionId={session.id} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 本日の来訪者（退室済み） */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="font-bold text-gray-800">本日の来訪者（退室済み）</h2>
        </div>
        {todayVisitors.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400">
            本日の退室済み来訪者はいません
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b">
                <th className="px-6 py-3">お客様</th>
                <th className="px-6 py-3">入室</th>
                <th className="px-6 py-3">退室</th>
                <th className="px-6 py-3">滞在時間</th>
                <th className="px-6 py-3">料金</th>
              </tr>
            </thead>
            <tbody>
              {todayVisitors.map((session) => (
                <tr key={session.id} className="border-b last:border-0">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {session.profile.pictureUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={session.profile.pictureUrl} alt="" className="w-8 h-8 rounded-full" />
                      )}
                      <span className="font-medium">{session.profile.displayName ?? '不明'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {new Date(session.checkedInAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {session.checkedOutAt
                      ? new Date(session.checkedOutAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {session.durationMinutes != null ? formatDuration(session.durationMinutes) : '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-800 text-sm font-medium">
                    {session.amountYen != null ? formatYen(session.amountYen) : '-'}
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
