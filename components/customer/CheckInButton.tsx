'use client'

import { useState } from 'react'
import { useLiff } from '@/components/liff/LiffProvider'

type Props = {
  onCheckedIn: () => void
}

export function CheckInButton({ onCheckedIn }: Props) {
  const { accessToken } = useLiff()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckIn() {
    if (!accessToken) {
      setError('認証情報が取得できませんでした。再読み込みしてください。')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'チェックインに失敗しました')
      onCheckedIn()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* ストア名 */}
      <div className="text-center">
        <h1 className="text-3xl font-light tracking-widest text-stone-800 mb-1">のまぼど</h1>
        <p className="text-xs text-stone-400 tracking-widest">BOARD GAME CAFÉ</p>
      </div>

      {/* チェックインボタン */}
      <button
        onClick={handleCheckIn}
        disabled={loading}
        className="relative w-52 h-52 rounded-full bg-stone-800 hover:bg-stone-700 active:scale-95 text-white shadow-xl disabled:opacity-40 transition-all duration-200 touch-manipulation"
      >
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-sm tracking-wide">処理中...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="text-4xl mb-1">🚪</span>
            <span className="text-lg font-medium tracking-wider">入室する</span>
            <span className="text-xs opacity-60 tracking-wide">タップしてチェックイン</span>
          </div>
        )}
      </button>

      {/* エラー表示 */}
      {error && (
        <div className="w-full max-w-xs bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-red-500 text-sm text-center">{error}</p>
        </div>
      )}
    </div>
  )
}
