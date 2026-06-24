'use client'

import { useState } from 'react'
import { useLiff } from '@/components/liff/LiffProvider'

type Props = {
  currentName: string
  onUpdated: (newName: string) => void
  onClose: () => void
}

export function EditPlayerNameModal({ currentName, onUpdated, onClose }: Props) {
  const { accessToken } = useLiff()
  const [playerName, setPlayerName] = useState(currentName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!playerName.trim()) {
      setError('プレイヤーネームを入力してください')
      return
    }
    if (!accessToken) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/player-name', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ playerName: playerName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'エラーが発生しました')
      onUpdated(playerName.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(160deg, rgba(255,248,235,0.98) 0%, rgba(254,243,210,0.98) 100%)',
          border: '1px solid rgba(200,150,80,0.3)',
        }}
      >
        {/* ヘッダー */}
        <div
          className="px-6 py-4 text-center"
          style={{ borderBottom: '1px solid rgba(139,90,43,0.12)' }}
        >
          <h3 className="font-bold text-base" style={{ color: '#3d1f0a' }}>
            プレイヤーネームを変更
          </h3>
          <p className="text-xs mt-0.5" style={{ color: '#a07040' }}>
            アプリ内で表示される名前を変更できます
          </p>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="px-5 py-5 flex flex-col gap-4">
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            autoFocus
            placeholder="プレイヤーネームを入力"
            className="w-full px-4 py-3 rounded-xl text-base outline-none"
            style={{
              background: 'rgba(255,255,255,0.85)',
              border: '1px solid rgba(139,90,43,0.3)',
              color: '#3d1f0a',
            }}
          />

          {error && (
            <p className="text-xs text-center" style={{ color: '#c0392b' }}>{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl font-bold text-sm active:scale-95 transition-all"
              style={{
                background: 'rgba(139,90,43,0.1)',
                color: '#5c2e00',
                border: '1px solid rgba(139,90,43,0.2)',
              }}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-2xl font-bold text-sm disabled:opacity-50 active:scale-95 transition-all"
              style={{
                background: 'linear-gradient(160deg, #5c3317 0%, #3d1f0a 100%)',
                color: '#f5deb3',
                border: '1px solid rgba(139,90,43,0.4)',
              }}
            >
              {loading ? '保存中...' : '保存する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
