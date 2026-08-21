'use client'

import { useState } from 'react'
import { useLiff } from '@/components/liff/LiffProvider'
import { formatYen } from '@/lib/billing'
import { calcOrderTotal } from '@/lib/menu'
import type { MenuItemLite, OrderLine } from '@/lib/menu'

type Props = {
  menu: MenuItemLite[]
  initialOrder: OrderLine[]
  onSaved: () => void
  onClose: () => void
}

export function MenuOrderModal({ menu, initialOrder, onSaved, onClose }: Props) {
  const { accessToken } = useLiff()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // menuItemId -> 数量 の状態（初期値は現在の注文から復元）
  const [qty, setQty] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    for (const item of menu) map[item.id] = 0
    for (const line of initialOrder) map[line.menuItemId] = line.quantity
    return map
  })

  const countItems = menu.filter((m) => m.kind !== 'toggle')
  const toggleItems = menu.filter((m) => m.kind === 'toggle')

  const order: OrderLine[] = menu.map((m) => ({ menuItemId: m.id, quantity: qty[m.id] ?? 0 }))
  const total = calcOrderTotal(order, menu)

  function setCount(id: string, next: number) {
    setQty((prev) => ({ ...prev, [id]: Math.max(0, next) }))
  }

  async function handleSubmit() {
    if (!accessToken) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ order }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'エラーが発生しました')
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        style={{
          background: 'linear-gradient(160deg, rgba(255,248,235,0.98) 0%, rgba(254,243,210,0.98) 100%)',
          border: '1px solid rgba(200,150,80,0.3)',
          maxHeight: '85vh',
        }}
      >
        {/* ヘッダー */}
        <div
          className="px-6 py-4 text-center flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(139,90,43,0.12)' }}
        >
          <h3 className="font-bold text-base" style={{ color: '#3d1f0a' }}>
            🍽️ メニューを注文
          </h3>
          <p className="text-xs mt-0.5" style={{ color: '#a07040' }}>
            ご注文はレジまでお越しください
          </p>
        </div>

        {/* メニュー一覧（スクロール） */}
        <div className="px-5 py-4 flex flex-col gap-2.5 overflow-y-auto">
          {/* 個数指定メニュー */}
          {countItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between px-3 py-2.5 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(139,90,43,0.15)' }}
            >
              <div className="flex flex-col">
                <span className="text-sm font-bold" style={{ color: '#3d1f0a' }}>{item.label}</span>
                <span className="text-xs" style={{ color: '#a07040' }}>{formatYen(item.priceYen)}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCount(item.id, (qty[item.id] ?? 0) - 1)}
                  disabled={(qty[item.id] ?? 0) === 0}
                  className="w-8 h-8 rounded-full font-bold text-lg flex items-center justify-center active:scale-90 transition-all disabled:opacity-30"
                  style={{ background: 'rgba(139,90,43,0.12)', color: '#5c2e00' }}
                  aria-label={`${item.label}を1つ減らす`}
                >
                  −
                </button>
                <span className="w-6 text-center text-base font-bold tabular-nums" style={{ color: '#3d1f0a' }}>
                  {qty[item.id] ?? 0}
                </span>
                <button
                  onClick={() => setCount(item.id, (qty[item.id] ?? 0) + 1)}
                  className="w-8 h-8 rounded-full font-bold text-lg flex items-center justify-center active:scale-90 transition-all"
                  style={{ background: 'linear-gradient(160deg, #8B5A2B, #5c3317)', color: '#f5deb3' }}
                  aria-label={`${item.label}を1つ増やす`}
                >
                  ＋
                </button>
              </div>
            </div>
          ))}

          {/* ON/OFFメニュー（ドリンクバー等） */}
          {toggleItems.map((item) => {
            const on = (qty[item.id] ?? 0) > 0
            return (
              <div
                key={item.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(139,90,43,0.15)' }}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-bold" style={{ color: '#3d1f0a' }}>{item.label}</span>
                  <span className="text-xs" style={{ color: '#a07040' }}>{formatYen(item.priceYen)}</span>
                </div>
                <button
                  onClick={() => setCount(item.id, on ? 0 : 1)}
                  className="relative w-14 h-8 rounded-full transition-all flex-shrink-0"
                  style={{
                    background: on ? 'linear-gradient(160deg, #8B5A2B, #5c3317)' : 'rgba(139,90,43,0.2)',
                  }}
                  aria-label={`${item.label}を${on ? 'オフ' : 'オン'}にする`}
                >
                  <span
                    className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all"
                    style={{ left: on ? '1.75rem' : '0.25rem' }}
                  />
                </button>
              </div>
            )
          })}

          {menu.length === 0 && (
            <p className="text-sm text-center py-6" style={{ color: '#a07040' }}>
              現在ご用意しているメニューはありません
            </p>
          )}
        </div>

        {/* 合計＋ボタン */}
        <div
          className="px-5 py-4 flex flex-col gap-3 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(139,90,43,0.12)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: '#a07040' }}>注文合計</span>
            <span className="text-xl font-bold" style={{ color: '#7a3e10' }}>{formatYen(total)}</span>
          </div>
          <p className="text-xs text-center" style={{ color: '#b23b00' }}>
            ※ ご注文はレジまでお越しください
          </p>

          {error && (
            <p className="text-xs text-center" style={{ color: '#c0392b' }}>{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl font-bold text-sm active:scale-95 transition-all"
              style={{ background: 'rgba(139,90,43,0.1)', color: '#5c2e00', border: '1px solid rgba(139,90,43,0.2)' }}
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || menu.length === 0}
              className="flex-1 py-3 rounded-2xl font-bold text-sm disabled:opacity-50 active:scale-95 transition-all"
              style={{ background: 'linear-gradient(160deg, #5c3317 0%, #3d1f0a 100%)', color: '#f5deb3', border: '1px solid rgba(139,90,43,0.4)' }}
            >
              {loading ? '保存中...' : '決定'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
