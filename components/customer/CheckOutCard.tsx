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

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <div className="bg-white rounded-2xl shadow-md p-6 w-full text-center">
        <p className="text-gray-500 text-sm mb-1">滞在時間</p>
        <p className="text-4xl font-bold text-gray-800 mb-4">
          {formatDuration(elapsed)}
        </p>
        <p className="text-gray-500 text-sm mb-1">現在の料金（目安）</p>
        <p className="text-3xl font-bold text-green-600">
          {formatYen(currentCost)}
        </p>
      </div>

      <button
        onClick={handleCheckOut}
        disabled={loading}
        className="w-64 h-24 rounded-2xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-xl font-bold shadow-lg disabled:opacity-50 transition-colors"
      >
        {loading ? '処理中...' : '退室する'}
      </button>

      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}
    </div>
  )
}
