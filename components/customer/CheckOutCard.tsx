'use client'

import { useEffect, useState } from 'react'
import { useLiff } from '@/components/liff/LiffProvider'
import { formatYen, applyStudentDiscount } from '@/lib/billing'

type Props = {
  checkedInAt: string
  estimatedCost: number
  intervalMinutes: number
  amountPerInterval: number
  isStudent: boolean
  onCheckedOut: () => void
}

type CheckOutResult = {
  duration: number
  cost: number
}

/** 滞在時間を「数字大・単位小」でレンダリング */
function DurationDisplay({ minutes }: { minutes: number }) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60

  return (
    <span className="tabular-nums" style={{ color: '#3d2008' }}>
      {h > 0 && (
        <>
          <span className="text-6xl font-thin" style={{ letterSpacing: '-0.02em' }}>{h}</span>
          <span className="text-2xl font-thin">時間</span>
        </>
      )}
      {(m > 0 || h === 0) && (
        <>
          <span className="text-6xl font-thin" style={{ letterSpacing: '-0.02em' }}>{m}</span>
          <span className="text-2xl font-thin">分</span>
        </>
      )}
    </span>
  )
}

export function CheckOutCard({
  checkedInAt,
  estimatedCost: initialCost,
  intervalMinutes,
  amountPerInterval,
  isStudent,
  onCheckedOut,
}: Props) {
  const { accessToken } = useLiff()
  const [elapsed, setElapsed] = useState(0)
  const [currentCost, setCurrentCost] = useState(initialCost)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CheckOutResult | null>(null)

  useEffect(() => {
    const start = new Date(checkedInAt).getTime()
    function tick() {
      const now = Date.now()
      const minutes = Math.floor((now - start) / 60000)
      setElapsed(minutes)
      // 入室した時点（0分）から最低1ブロック分を課金・表示する
      const units = Math.max(1, Math.ceil(minutes / intervalMinutes))
      setCurrentCost(applyStudentDiscount(units * amountPerInterval, isStudent))
    }
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [checkedInAt, intervalMinutes, amountPerInterval, isStudent])

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
        // 退室完了 → 結果画面を表示
        setResult({ duration: elapsed, cost: currentCost })
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

  // ── 退室完了画面 ──
  if (result) {
    return (
      <div className="flex flex-col items-center gap-5 w-full max-w-xs">
        {/* ロゴ */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.jpg" alt="のまぼど" className="w-24 h-24 object-contain drop-shadow-2xl" />

        {/* 完了カード */}
        <div
          className="w-full backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, rgba(255,248,235,0.97) 0%, rgba(254,243,210,0.97) 100%)',
            boxShadow: '0 8px 40px rgba(80,40,0,0.25), inset 0 1px 0 rgba(255,255,255,0.8)',
            border: '1px solid rgba(200,150,80,0.25)',
          }}
        >
          {/* ヘッダー */}
          <div
            className="px-6 py-4 text-center"
            style={{
              background: 'rgba(139,90,43,0.08)',
              borderBottom: '1px solid rgba(139,90,43,0.12)',
            }}
          >
            <p className="text-lg font-bold" style={{ color: '#5c2e00' }}>
              🎉 ありがとうございました！
            </p>
            <p className="text-sm font-bold mt-1.5" style={{ color: '#b23b00' }}>
              お会計はレジ（スタッフ）までお願いします
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#a07040' }}>
              またのご来店をお待ちしています
            </p>
          </div>

          <div className="px-6 py-6 text-center">
            {/* 滞在時間 */}
            <div className="mb-5">
              <p className="text-xs font-medium tracking-widest mb-2" style={{ color: '#a07040' }}>
                滞在時間
              </p>
              <DurationDisplay minutes={result.duration} />
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
                ご利用料金
              </p>
              <p
                className="text-4xl font-bold"
                style={{ color: '#7a3e10', textShadow: '0 1px 2px rgba(0,0,0,0.08)' }}
              >
                {formatYen(result.cost)}
              </p>
              {isStudent && (
                <span
                  className="inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(76,175,80,0.15)', color: '#2e7d32', border: '1px solid rgba(76,175,80,0.35)' }}
                >
                  🎓 学割適用（半額）
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 閉じるボタン */}
        <button
          onClick={onCheckedOut}
          className="w-full py-4 rounded-2xl font-bold text-lg tracking-widest shadow-xl active:scale-95 transition-all duration-200 touch-manipulation"
          style={{
            background: 'linear-gradient(160deg, #5c3317 0%, #3d1f0a 100%)',
            boxShadow: '0 4px 24px rgba(60,30,0,0.45), inset 0 1px 0 rgba(255,200,100,0.15)',
            color: '#f5deb3',
            border: '1px solid rgba(139,90,43,0.4)',
          }}
        >
          閉じる
        </button>
      </div>
    )
  }

  // ── 通常の退室前画面 ──
  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-xs">
      {/* ロゴ（小さめ） */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.jpg" alt="のまぼど" className="w-24 h-24 object-contain drop-shadow-2xl" style={{ border: '2px solid rgba(245,222,179,0.3)' }} />

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
            <DurationDisplay minutes={elapsed} />
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
            {isStudent && (
              <span
                className="inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: 'rgba(76,175,80,0.15)', color: '#2e7d32', border: '1px solid rgba(76,175,80,0.35)' }}
              >
                🎓 学割適用（半額）
              </span>
            )}
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
