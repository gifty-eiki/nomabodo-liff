import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const lineUserId = await getAdminSession()
  if (!lineUserId) redirect('/admin-login')

  // 静的管理者トークンの場合はDB確認不要
  if (lineUserId !== 'admin') {
    const profile = await prisma.profile.findUnique({ where: { lineUserId } })
    if (!profile?.isAdmin) redirect('/admin-login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-bold text-gray-800">のまぼど 管理画面</span>
          <div className="flex gap-4 text-sm">
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              ダッシュボード
            </Link>
            <Link
              href="/admin/customers"
              className="text-gray-600 hover:text-gray-900"
            >
              顧客一覧
            </Link>
            <Link
              href="/admin/pricing"
              className="text-gray-600 hover:text-gray-900"
            >
              料金設定
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
