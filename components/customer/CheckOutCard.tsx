'use client'

import { useEffect, useState } from 'react'
import { useLiff } from '@/components/liff/LiffProvider'
import { formatYen, formatDuration } from '@/lib/billing'

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
    <div className="flex flex-col items-center gap-8 w-full max-w-xs">
      {/* ストア名 */}
      <div className="text-center">
        <h1 className="text-3xl font-light tracking-widest text-stone-800 mb-1">のまぼど</h1>
        <p className="text-xs text-stone-400 tracking-widest">BOARD GAME CAFÉ</p>
      </div>

      {/* 滞在情報カード */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-stone-100 p-8">
        <p className="text-xs text-stone-400 tracking-wide text-center mb-6">
          {checkedInTime} に入室
        </p>

        <div className="text-center mb-6">
          <p className="text-xs text-stone-400 tracking-wide mb-1">滞在時間</p>
          <p className="text-5xl font-light text-stone-800 tracking-tight">
            {formatDuration(elapsed)}
          </p>
        </div>

        <div className="h-px bg-stone-100 my-4" />

        <div className="text-center">
          <p className="text-xs text-stone-400 tracking-wide mb-1">料金（目安）</p>
          <p className="text-3xl font-medium text-stone-800">
            {formatYen(currentCost)}
          </p>
          <p className="text-xs text-stone-300 mt-1">
            {intervalMinutes}分ごとに {formatYen(amountPerInterval)}
          </p>
        </div>
      </div>

      {/* 退室ボタン */}
      <button
        onClick={handleCheckOut}
        disabled={loading}
        className="w-full py-4 rounded-2xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-white font-medium tracking-wide shadow-md disabled:opacity-40 transition-all duration-200 touch-manipulation"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>処理中...</span>
          </div>
        ) : (
          '退室する・お会計'
        )}
      </button>

      {/* エラー表示 */}
      {error && (
        <div className="w-full bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-red-500 text-sm text-center">{error}</p>
        </div>
      )}
    </div>
  )
}
