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
    if (!accessToken) return
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
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleCheckIn}
        disabled={loading}
        className="w-64 h-64 rounded-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-2xl font-bold shadow-lg disabled:opacity-50 transition-colors"
      >
        {loading ? '処理中...' : '入室する'}
      </button>
      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}
    </div>
  )
}
