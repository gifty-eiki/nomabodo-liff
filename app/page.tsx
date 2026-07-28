'use client'

import { useEffect, useState } from 'react'
import { useLiff } from '@/components/liff/LiffProvider'
import { CheckInButton } from '@/components/customer/CheckInButton'
import { CheckOutCard } from '@/components/customer/CheckOutCard'
import { SurveyModal } from '@/components/customer/SurveyModal'
import { EditPlayerNameModal } from '@/components/customer/EditPlayerNameModal'

type OpenSession = {
  id: string
  checkedInAt: string
  estimatedCost: number
  intervalMinutes: number
  amountPerInterval: number
  isStudent: boolean
  weekendSurcharge: number
}

type SubscriptionStatus = {
  isActive: boolean
  planName: string | null
  currentPeriodEnd: string | null
}

const MAX_CAPACITY = 20

export default function HomePage() {
  const { isReady, profile, accessToken, error } = useLiff()
  const [openSession, setOpenSession] = useState<OpenSession | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [currentOccupancy, setCurrentOccupancy] = useState(0)
  const [loading, setLoading] = useState(true)
  const [surveyCompleted, setSurveyCompleted] = useState(true) // 初期はtrueで画面ちらつき防止
  const [playerName, setPlayerName] = useState<string | null>(null)
  const [showEditName, setShowEditName] = useState(false)

  async function fetchStatus() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/status', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setOpenSession(data.openSession)
        setSubscription(data.subscription)
        setCurrentOccupancy(data.currentOccupancy ?? 0)
        setSurveyCompleted(data.surveyCompleted ?? true)
        setPlayerName(data.playerName ?? null)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isReady && accessToken) fetchStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, accessToken])

  const displayName = playerName || profile?.displayName || ''

  if (!isReady || loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{
          backgroundImage: "url('/background.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          className="flex flex-col items-center gap-3 px-8 py-6 rounded-2xl backdrop-blur-sm"
          style={{ background: 'rgba(255,248,230,0.85)' }}
        >
          <div className="w-8 h-8 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-amber-900 text-sm font-medium">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-amber-50 p-6">
        <p className="text-red-500 text-sm text-center">{error}</p>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* 背景画像 */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/background.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      />
      {/* 下部グラデーション */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />

      {/* 初回アンケートモーダル */}
      {!surveyCompleted && (
        <SurveyModal
          onCompleted={(name) => {
            setPlayerName(name)
            setSurveyCompleted(true)
          }}
        />
      )}

      {/* プレイヤーネーム編集モーダル */}
      {showEditName && (
        <EditPlayerNameModal
          currentName={playerName || profile?.displayName || ''}
          onUpdated={(name) => {
            setPlayerName(name)
            setShowEditName(false)
          }}
          onClose={() => setShowEditName(false)}
        />
      )}

      {/* コンテンツ */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* ヘッダー */}
        <header className="px-4 pt-6 pb-2">
          <div className="flex items-center gap-2.5">
            {profile?.pictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.pictureUrl}
                alt={profile.displayName}
                className="w-9 h-9 rounded-full shadow-md flex-shrink-0"
                style={{ border: '2px solid rgba(255,255,255,0.8)' }}
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-md flex-shrink-0"
                style={{ background: 'rgba(139,90,43,0.7)', color: '#f5deb3' }}
              >
                {displayName?.charAt(0) ?? '?'}
              </div>
            )}

            {/* 名前エリア（タップで編集） */}
            <button
              onClick={() => setShowEditName(true)}
              className="flex flex-col px-3 py-1 rounded-xl backdrop-blur-sm active:scale-95 transition-all text-left"
              style={{ background: 'rgba(255,255,255,0.55)' }}
            >
              <p className="text-xs leading-tight" style={{ color: '#8B5A2B' }}>のまぼど</p>
              <div className="flex items-center gap-1">
                <p className="text-sm font-bold leading-tight" style={{ color: '#3d1f0a' }}>
                  {displayName} さん
                </p>
                {/* 鉛筆アイコン */}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ color: '#a07040', flexShrink: 0 }}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>

            {subscription?.isActive && (
              <span
                className="text-xs px-2.5 py-0.5 rounded-full font-bold tracking-wider ml-auto"
                style={{
                  background: 'linear-gradient(135deg, #f0c040, #c9922a)',
                  color: '#3d2008',
                  boxShadow: '0 2px 8px rgba(200,140,0,0.3)',
                }}
              >
                会員
              </span>
            )}
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 gap-3">

          {!openSession && (
            <>
              {/* ロゴ */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.jpg"
                alt="のまぼど"
                className="w-72 h-72 object-contain"
                style={{ filter: 'drop-shadow(0 4px 16px rgba(80,40,0,0.25))' }}
              />

              {/* サブテキスト */}
              <div className="flex flex-col items-center gap-1 -mt-2">
                <p
                  className="text-sm font-bold tracking-widest"
                  style={{ color: '#8B4513', textShadow: '0 1px 3px rgba(255,255,255,0.6)' }}
                >
                  BOARD GAME CAFÉ ☕
                </p>
                <p
                  className="text-sm font-bold text-center px-4 py-1.5 rounded-full"
                  style={{
                    color: '#4a2000',
                    background: 'rgba(255,240,200,0.80)',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(180,120,40,0.35)',
                  }}
                >
                  ✦ ボードゲームでつながる、最高の時間を。✦
                </p>
              </div>

              {/* チェックインボタン */}
              <div className="mt-2">
                <CheckInButton onCheckedIn={() => fetchStatus()} />
              </div>
            </>
          )}

          {openSession && (
            <CheckOutCard
              checkedInAt={openSession.checkedInAt}
              estimatedCost={openSession.estimatedCost}
              intervalMinutes={openSession.intervalMinutes}
              amountPerInterval={openSession.amountPerInterval}
              isStudent={openSession.isStudent}
              weekendSurcharge={openSession.weekendSurcharge}
              onCheckedOut={() => {
                setOpenSession(null)
                fetchStatus()
              }}
            />
          )}
        </main>

        {/* フッター：在室人数 */}
        <footer className="px-4 pb-8">
          {!openSession && (
            <div
              className="rounded-2xl px-5 py-4 flex items-center justify-center gap-4 shadow-xl backdrop-blur-sm"
              style={{
                background: 'rgba(255,252,245,0.88)',
                border: '1px solid rgba(200,160,80,0.2)',
              }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(139,90,43,0.12)' }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="9" cy="7" r="3" fill="#8B5A2B" opacity="0.8"/>
                  <circle cx="15" cy="7" r="3" fill="#8B5A2B" opacity="0.5"/>
                  <path d="M3 19c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="#8B5A2B" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
                  <path d="M15 13c2.761 0 5 2.239 5 5" stroke="#8B5A2B" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium tracking-wider" style={{ color: '#a07040' }}>
                  現在のご利用人数
                </p>
                <p className="text-2xl font-bold leading-tight" style={{ color: '#3d1f0a' }}>
                  {currentOccupancy}
                  <span className="text-base font-normal ml-1" style={{ color: 'rgba(80,50,20,0.45)' }}>
                    / {MAX_CAPACITY}名
                  </span>
                </p>
              </div>
            </div>
          )}
        </footer>
      </div>
    </div>
  )
}
