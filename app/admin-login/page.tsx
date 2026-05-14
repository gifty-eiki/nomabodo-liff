'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!token.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token.trim()}` },
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'ログインに失敗しました')
      }
      router.push('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-center mb-6">のまぼど 管理者ログイン</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              アクセストークン
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="開発モード: dev-access-token"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !token.trim()}
            className="py-2 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
          {process.env.NODE_ENV === 'development' && (
            <button
              type="button"
              onClick={() => setToken('dev-access-token')}
              className="py-2 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200"
            >
              開発用トークンをセット
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
