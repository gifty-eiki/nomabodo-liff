'use client'

import { useState } from 'react'
import { useLiff } from '@/components/liff/LiffProvider'

type Props = {
  onCompleted: (playerName: string) => void
}

const GENDER_OPTIONS = ['男性', '女性', 'その他']
const AGE_OPTIONS = ['10代', '20代', '30代', '40代', '50代', '60代以上']
const REGION_OPTIONS = [
  '延岡市',
  '宮崎市',
  '日向市',
  '門川町',
  '上記以外の宮崎県内',
  '宮崎県外',
]

const cardStyle = {
  background: 'linear-gradient(160deg, rgba(255,248,235,0.98) 0%, rgba(254,243,210,0.98) 100%)',
  border: '1px solid rgba(200,150,80,0.3)',
}

const inputStyle = {
  background: 'rgba(255,255,255,0.85)',
  border: '1px solid rgba(139,90,43,0.25)',
  color: '#3d1f0a',
}

function SelectButton({
  label,
  selected,
  onClick,
  className = '',
}: {
  label: string
  selected: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 ${className}`}
      style={{
        background: selected
          ? 'linear-gradient(135deg, #7a4a22, #4a2410)'
          : 'rgba(255,255,255,0.8)',
        color: selected ? '#f5deb3' : '#5c2e00',
        border: selected
          ? '1px solid rgba(90,40,10,0.5)'
          : '1px solid rgba(139,90,43,0.25)',
      }}
    >
      {label}
    </button>
  )
}

export function SurveyModal({ onCompleted }: Props) {
  const { accessToken } = useLiff()
  const [realName, setRealName] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [gender, setGender] = useState('')
  const [ageGroup, setAgeGroup] = useState('')
  const [region, setRegion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!realName.trim() || !playerName.trim() || !gender || !ageGroup || !region) {
      setError('全ての項目を選択・入力してください')
      return
    }
    if (!accessToken) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          realName: realName.trim(),
          playerName: playerName.trim(),
          gender,
          ageGroup,
          region,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'エラーが発生しました')
      onCompleted(playerName.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 py-6 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
    >
      <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl my-auto" style={cardStyle}>
        {/* ヘッダー */}
        <div
          className="px-6 py-5 text-center"
          style={{
            background: 'rgba(139,90,43,0.1)',
            borderBottom: '1px solid rgba(139,90,43,0.15)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.jpg"
            alt="のまぼど"
            className="w-16 h-16 object-contain mx-auto mb-3"
          />
          <h2 className="text-base font-bold" style={{ color: '#3d1f0a' }}>
            はじめてのご来店ありがとうございます！
          </h2>
          <p className="text-xs mt-1" style={{ color: '#a07040' }}>
            簡単なアンケートにご協力ください ✦
          </p>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="px-5 py-5 flex flex-col gap-5">

          {/* 本名 */}
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: '#5c2e00' }}>
              お名前（本名）<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
              placeholder="例：山田 太郎"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={inputStyle}
            />
          </div>

          {/* プレイヤーネーム */}
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: '#5c2e00' }}>
              プレイヤーネーム<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="例：たろう"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={inputStyle}
            />
            <p className="text-xs mt-1.5" style={{ color: '#a07040' }}>
              アプリ内で表示される名前です。後から変更できます。
            </p>
          </div>

          {/* 性別 */}
          <div>
            <label className="block text-xs font-bold mb-2" style={{ color: '#5c2e00' }}>
              性別<span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {GENDER_OPTIONS.map((opt) => (
                <SelectButton
                  key={opt}
                  label={opt}
                  selected={gender === opt}
                  onClick={() => setGender(opt)}
                />
              ))}
            </div>
          </div>

          {/* 年代 */}
          <div>
            <label className="block text-xs font-bold mb-2" style={{ color: '#5c2e00' }}>
              年代<span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {AGE_OPTIONS.map((opt) => (
                <SelectButton
                  key={opt}
                  label={opt}
                  selected={ageGroup === opt}
                  onClick={() => setAgeGroup(opt)}
                />
              ))}
            </div>
          </div>

          {/* 住所 */}
          <div>
            <label className="block text-xs font-bold mb-2" style={{ color: '#5c2e00' }}>
              お住まいの地域<span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {REGION_OPTIONS.map((opt) => (
                <SelectButton
                  key={opt}
                  label={opt}
                  selected={region === opt}
                  onClick={() => setRegion(opt)}
                  className="text-center"
                />
              ))}
            </div>
          </div>

          {/* エラー */}
          {error && (
            <div
              className="rounded-xl px-4 py-2"
              style={{ background: 'rgba(220,50,50,0.1)', border: '1px solid rgba(220,50,50,0.3)' }}
            >
              <p className="text-xs text-center" style={{ color: '#c0392b' }}>{error}</p>
            </div>
          )}

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-base tracking-wider shadow-lg disabled:opacity-50 active:scale-95 transition-all touch-manipulation"
            style={{
              background: 'linear-gradient(160deg, #5c3317 0%, #3d1f0a 100%)',
              color: '#f5deb3',
              border: '1px solid rgba(139,90,43,0.4)',
              boxShadow: '0 4px 20px rgba(60,30,0,0.35)',
            }}
          >
            {loading ? '送信中...' : '送信してはじめる ✦'}
          </button>
        </form>
      </div>
    </div>
  )
}
