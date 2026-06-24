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
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleCheckIn}
        disabled={loading}
        className="relative active:scale-95 transition-transform duration-150 touch-manipulation disabled:opacity-60"
        style={{ filter: 'drop-shadow(0 8px 28px rgba(80,40,0,0.45))' }}
      >
        {/* ボタン画像 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/button.png"
          alt="入室する"
          className="w-56 h-56 object-contain"
        />

        {/* ローディングオーバーレイ */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-[3px] border-amber-200 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </button>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-900/70 backdrop-blur-sm rounded-xl px-5 py-2.5 border border-red-400/30">
          <p className="text-red-100 text-sm text-center">{error}</p>
        </div>
      )}
    </div>
  )
}
