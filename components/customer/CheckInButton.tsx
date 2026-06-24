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
    <div className="flex flex-col items-center gap-6">
      {/* 外側のグロー */}
      <div className="relative">
        {/* 光彩リング（アニメーション） */}
        {!loading && (
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-20 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, #d4a257, transparent 70%)',
              transform: 'scale(1.15)',
            }}
          />
        )}

        {/* ゴールドアウターリング */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            margin: '-10px',
            background: 'conic-gradient(from 0deg, #c9922a, #f0d080, #c9922a, #a06820, #f0d080, #c9922a)',
            opacity: 0.85,
          }}
        />

        {/* 木製円形ボタン本体 */}
        <button
          onClick={handleCheckIn}
          disabled={loading}
          className="relative w-56 h-56 rounded-full disabled:opacity-60 active:scale-95 transition-all duration-200 touch-manipulation z-10"
          style={{
            background: 'radial-gradient(circle at 38% 32%, #7a4a22, #4a2410 55%, #2e1508)',
            boxShadow: [
              '0 0 0 6px #5c3317',
              '0 0 0 10px #3d2008',
              'inset 0 2px 8px rgba(255,200,100,0.12)',
              'inset 0 -4px 12px rgba(0,0,0,0.4)',
              '0 16px 48px rgba(0,0,0,0.6)',
            ].join(', '),
          }}
        >
          {/* 木目の光沢ハイライト */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 38% 28%, rgba(255,220,140,0.18) 0%, transparent 55%)',
            }}
          />

          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-amber-200 border-t-transparent rounded-full animate-spin" />
              <span className="text-amber-100 text-sm">処理中...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <span className="text-5xl mb-1 drop-shadow-lg">🚪</span>
              <span
                className="text-2xl font-bold tracking-widest drop-shadow-lg"
                style={{ color: '#f5deb3', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
              >
                入室する
              </span>
              <span
                className="text-xs tracking-wider mt-0.5"
                style={{ color: 'rgba(245,222,179,0.6)' }}
              >
                タップしてチェックイン
              </span>
            </div>
          )}
        </button>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-900/70 backdrop-blur-sm rounded-xl px-5 py-2.5 border border-red-400/30">
          <p className="text-red-100 text-sm text-center">{error}</p>
        </div>
      )}
    </div>
  )
}
