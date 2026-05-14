'use client'

import { useEffect, useState } from 'react'
import { useLiff } from '@/components/liff/LiffProvider'
import { CheckInButton } from '@/components/customer/CheckInButton'
import { CheckOutCard } from '@/components/customer/CheckOutCard'
import Link from 'next/link'

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

export default function HomePage() {
  const { isReady, profile, accessToken, error } = useLiff()
  const [openSession, setOpenSession] = useState<OpenSession | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
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
      <div className="flex items-center justify-center min-h-screen bg-stone-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-stone-800 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-400 text-sm tracking-wide">読み込み中</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50 p-6">
        <div className="text-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* ヘッダー */}
      <header className="px-6 pt-12 pb-6">
        <div className="flex items-center gap-3">
          {profile?.pictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.pictureUrl}
              alt={profile.displayName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center">
              <span className="text-stone-500 text-sm font-medium">
                {profile?.displayName?.charAt(0) ?? '?'}
              </span>
            </div>
          )}
          <div>
            <p className="text-xs text-stone-400 tracking-wide">のまぼど</p>
            <p className="text-sm font-medium text-stone-700">{profile?.displayName}</p>
          </div>
          {subscription?.isActive && (
            <span className="ml-auto text-xs px-2 py-0.5 bg-stone-800 text-white rounded-full">
              会員
            </span>
          )}
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 -mt-12">
        {openSession ? (
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
        ) : (
          <CheckInButton onCheckedIn={() => fetchStatus()} />
        )}
      </main>

      {/* フッター */}
      <footer className="px-6 pb-10 text-center">
        {!subscription?.isActive ? (
          <Link
            href="/subscription"
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
          >
            月額プランを見る
          </Link>
        ) : subscription.currentPeriodEnd ? (
          <p className="text-xs text-stone-300">
            次回更新 {new Date(subscription.currentPeriodEnd).toLocaleDateString('ja-JP')}
          </p>
        ) : null}
      </footer>
    </div>
  )
}
