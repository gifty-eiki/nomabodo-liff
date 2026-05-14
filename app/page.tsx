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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="text-center">
          <p className="text-red-500 mb-2">エラーが発生しました</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-6 pt-12">
      <div className="w-full max-w-sm">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          {profile?.pictureUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.pictureUrl}
              alt={profile.displayName}
              className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-green-500"
            />
          )}
          <h1 className="text-2xl font-bold text-gray-800">のまぼど</h1>
          <p className="text-gray-500 text-sm">
            {profile?.displayName} さん
          </p>
          {subscription?.isActive && (
            <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
              会員
            </span>
          )}
        </div>

        {/* メインコンテンツ */}
        <div className="flex flex-col items-center gap-6">
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

          {/* サブスクリンク */}
          {!subscription?.isActive && (
            <Link
              href="/subscription"
              className="text-green-600 text-sm underline underline-offset-2"
            >
              月額プランに登録する →
            </Link>
          )}
          {subscription?.isActive && subscription.currentPeriodEnd && (
            <p className="text-gray-400 text-xs">
              次回更新:{' '}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                'ja-JP'
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
