'use client'

import { useEffect, useState } from 'react'
import { useLiff } from '@/components/liff/LiffProvider'
import { CheckInButton } from '@/components/customer/CheckInButton'
import { CheckOutCard } from '@/components/customer/CheckOutCard'
import { SurveyModal } from '@/components/customer/SurveyModal'
import { EditPlayerNameModal } from '@/components/customer/EditPlayerNameModal'
import { RulesModal } from '@/components/customer/RulesModal'
import type { MenuItemLite, OrderLine } from '@/lib/menu'

type PlanTier = {
  label: string
  maxMinutes: number | null
  amountYen: number
}

type OpenSession = {
  id: string
  checkedInAt: string
  estimatedCost: number
  plans: PlanTier[]
  currentPlanLabel: string | null
  isSubscriber: boolean
  isStudent: boolean
  weekendSurcharge: number
  order: OrderLine[]
  orderTotal: number
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
  const [menu, setMenu] = useState<MenuItemLite[]>([])
  const [currentOccupancy, setCurrentOccupancy] = useState(0)
  const [loading, setLoading] = useState(true)
  const [surveyCompleted, setSurveyCompleted] = useState(true) // 初期はtrueで画面ちらつき防止
  const [playerName, setPlayerName] = useState<string | null>(null)
  const [showEditName, setShowEditName] = useState(false)
  const [showRules, setShowRules] = useState(false)

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
        setMenu(data.menu ?? [])
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

      {/* カフェルールモーダル */}
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

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
              plans={openSession.plans}
              isSubscriber={openSession.isSubscriber}
              isStudent={openSession.isStudent}
              weekendSurcharge={openSession.weekendSurcharge}
              menu={menu}
              order={openSession.order}
              orderTotal={openSession.orderTotal}
              onOrdered={() => fetchStatus()}
              onCheckedOut={() => {
                setOpenSession(null)
                fetchStatus()
              }}
            />
          )}
        </main>

        {/* フッター：カフェルールボタン */}
        <footer className="px-4 pb-8">
          <button
            onClick={() => setShowRules(true)}
            className="w-full rounded-2xl px-5 py-4 flex items-center justify-center gap-3 shadow-xl backdrop-blur-sm active:scale-95 transition-all"
            style={{
              background: 'rgba(255,252,245,0.88)',
              border: '1px solid rgba(200,160,80,0.2)',
            }}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-xl"
              style={{ background: 'rgba(139,90,43,0.12)' }}
            >
              📖
            </div>
            <div className="text-left">
              <p className="text-sm font-bold leading-tight" style={{ color: '#3d1f0a' }}>
                のまぼどカフェ ルール
              </p>
              <p className="text-xs" style={{ color: '#a07040' }}>
                タップして確認する
              </p>
            </div>
            {/* 右向き矢印 */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="ml-auto flex-shrink-0" style={{ color: '#a07040' }}>
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </footer>
      </div>
    </div>
  )
}
