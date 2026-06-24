'use client'

import { useEffect, useState } from 'react'
import { useLiff } from '@/components/liff/LiffProvider'
import { CheckInButton } from '@/components/customer/CheckInButton'
import { CheckOutCard } from '@/components/customer/CheckOutCard'
import Image from 'next/image'

type OpenSession = {
  id: string
  checkedInAt: string
  estimatedCost: number
  intervalMinutes: number
  amountPerInterval: number
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
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isReady && accessToken) fetchStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, accessToken])

  if (!isReady || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-amber-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-amber-800 text-sm">読み込み中...</p>
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
      <div className="absolute inset-0 z-0">
        <Image
          src="/入室画面.png"
          alt="background"
          fill
          className="object-cover object-center"
          priority
        />
        {/* オーバーレイ */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/20 to-black/50" />
      </div>

      {/* コンテンツ */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* ヘッダー：ユーザー情報 */}
        <header className="px-4 pt-8 pb-2">
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl backdrop-blur-sm"
            style={{
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            {profile?.pictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.pictureUrl}
                alt={profile.displayName}
                className="w-9 h-9 rounded-full"
                style={{ border: '2px solid rgba(200,160,80,0.6)' }}
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-amber-100 text-sm font-bold"
                style={{ background: 'rgba(139,90,43,0.5)' }}
              >
                {profile?.displayName?.charAt(0) ?? '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white/50 text-xs tracking-widest">のまぼど</p>
              <p className="text-white text-sm font-medium leading-tight truncate">{profile?.displayName} さん</p>
            </div>
            {subscription?.isActive && (
              <span
                className="text-xs px-2.5 py-0.5 rounded-full font-bold tracking-wider flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #f0c040, #c9922a)',
                  color: '#3d2008',
                }}
              >
                会員
              </span>
            )}
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 gap-4">

          {!openSession && (
            <>
              {/* ロゴ */}
              <div className="flex flex-col items-center gap-2">
                <Image
                  src="/logo.jpg"
                  alt="のまぼど"
                  width={180}
                  height={180}
                  className="drop-shadow-xl"
                />
                <p className="text-white/90 text-xs tracking-widest font-medium">BOARD GAME CAFÉ ☕</p>
                <p className="text-white text-sm font-medium text-center drop-shadow">
                  ボードゲームでつながる、最高の時間を。
                </p>
              </div>

              {/* チェックインボタン */}
              <CheckInButton onCheckedIn={() => fetchStatus()} />
            </>
          )}

          {openSession && (
            <CheckOutCard
              checkedInAt={openSession.checkedInAt}
              estimatedCost={openSession.estimatedCost}
              intervalMinutes={openSession.intervalMinutes}
              amountPerInterval={openSession.amountPerInterval}
              onCheckedOut={() => {
                setOpenSession(null)
                fetchStatus()
              }}
            />
          )}
        </main>

        {/* フッター：在室人数バー */}
        <footer className="px-4 pb-8">
          {!openSession && (
            <div
              className="backdrop-blur-md rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,248,230,0.88), rgba(250,235,200,0.88))',
                border: '1px solid rgba(200,150,80,0.25)',
                boxShadow: '0 4px 24px rgba(60,30,0,0.2)',
              }}
            >
              <div className="text-2xl">👥</div>
              <div className="flex-1">
                <p className="text-xs font-medium tracking-wider" style={{ color: '#a07040' }}>
                  現在のご利用人数
                </p>
                <p className="text-base font-bold" style={{ color: '#3d2008' }}>
                  {currentOccupancy}
                  <span className="font-normal" style={{ color: 'rgba(80,50,20,0.4)' }}> / {MAX_CAPACITY}名</span>
                </p>
              </div>
              {/* 混雑度バー */}
              <div className="w-20">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(139,90,43,0.15)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((currentOccupancy / MAX_CAPACITY) * 100, 100)}%`,
                      background: currentOccupancy / MAX_CAPACITY > 0.8
                        ? 'linear-gradient(to right, #c0392b, #e74c3c)'
                        : 'linear-gradient(to right, #8B5E3C, #c9922a)',
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </footer>
      </div>
    </div>
  )
}
