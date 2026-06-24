'use client'

import { useEffect, useState } from 'react'
import { useLiff } from '@/components/liff/LiffProvider'
import { formatYen, formatDuration } from '@/lib/billing'
import Image from 'next/image'

type Props = {
  checkedInAt: string
  estimatedCost: number
  intervalMinutes: number
  amountPerInterval: number
  onCheckedOut: () => void
}

export function CheckOutCard({
  checkedInAt,
  estimatedCost: initialCost,
  intervalMinutes,
  amountPerInterval,
  onCheckedOut,
}: Props) {
  const { accessToken } = useLiff()
  const [elapsed, setElapsed] = useState(0)
  const [currentCost, setCurrentCost] = useState(initialCost)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const start = new Date(checkedInAt).getTime()
    function tick() {
      const now = Date.now()
      const minutes = Math.floor((now - start) / 60000)
      setElapsed(minutes)
      const units = Math.ceil(minutes / intervalMinutes)
      setCurrentCost(units * amountPerInterval)
    }
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [checkedInAt, intervalMinutes, amountPerInterval])

  async function handleCheckOut() {
    if (!accessToken) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'チェックアウトに失敗しました')
      if (data.stripeUrl) {
        window.location.href = data.stripeUrl
      } else {
        onCheckedOut()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const checkedInTime = new Date(checkedInAt).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-xs">
      {/* ロゴ（小さめ） */}
      <Image src="/logo.jpg" alt="のまぼど" width={96} height={96} className="rounded-full drop-shadow-2xl border-2 border-amber-200/40" />

      {/* 滞在情報カード */}
      <div
        className="w-full backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, rgba(255,248,235,0.95) 0%, rgba(254,243,210,0.95) 100%)',
          boxShadow: '0 8px 40px rgba(80,40,0,0.25), inset 0 1px 0 rgba(255,255,255,0.8)',
          border: '1px solid rgba(200,150,80,0.25)',
        }}
      >
        {/* 入室時刻バー */}
        <div
          className="px-6 py-2.5 text-center text-xs font-medium tracking-wider"
          style={{
            background: 'rgba(139,90,43,0.08)',
            borderBottom: '1px solid rgba(139,90,43,0.12)',
            color: '#8B5A2B',
          }}
        >
          🕐 {checkedInTime} に入室
        </div>

        <div className="px-6 py-6 text-center">
          {/* 滞在時間 */}
          <div className="mb-5">
            <p className="text-xs font-medium tracking-widest mb-2" style={{ color: '#a07040' }}>
              滞在時間
            </p>
            <p
              className="text-6xl font-thin tabular-nums"
              style={{ color: '#3d2008', letterSpacing: '-0.02em' }}
            >
              {formatDuration(elapsed)}
            </p>
          </div>

          {/* セパレーター */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(139,90,43,0.2))' }} />
            <span className="text-amber-400 text-sm">✦</span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(139,90,43,0.2))' }} />
          </div>

          {/* 料金 */}
          <div>
            <p className="text-xs font-medium tracking-widest mb-1.5" style={{ color: '#a07040' }}>
              料金（目安）
            </p>
            <p
              className="text-4xl font-bold"
              style={{ color: '#7a3e10', textShadow: '0 1px 2px rgba(0,0,0,0.08)' }}
            >
              {formatYen(currentCost)}
            </p>
            <p className="text-xs mt-2" style={{ color: 'rgba(100,65,30,0.5)' }}>
              {intervalMinutes}分ごとに {formatYen(amountPerInterval)}
            </p>
          </div>
        </div>
      </div>

      {/* 退室ボタン */}
      <button
        onClick={handleCheckOut}
        disabled={loading}
        className="w-full py-4 rounded-2xl font-bold text-lg tracking-widest shadow-xl disabled:opacity-50 active:scale-95 transition-all duration-200 touch-manipulation"
        style={{
          background: 'linear-gradient(160deg, #5c3317 0%, #3d1f0a 100%)',
          boxShadow: '0 4px 24px rgba(60,30,0,0.45), inset 0 1px 0 rgba(255,200,100,0.15)',
          color: '#f5deb3',
          border: '1px solid rgba(139,90,43,0.4)',
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-amber-200 border-t-transparent rounded-full animate-spin" />
            <span>処理中...</span>
          </div>
        ) : (
          '退室する・お会計'
        )}
      </button>

      {error && (
        <div className="w-full bg-red-900/70 backdrop-blur-sm rounded-xl px-5 py-2.5 border border-red-400/30">
          <p className="text-red-100 text-sm text-center">{error}</p>
        </div>
      )}
    </div>
  )
}
