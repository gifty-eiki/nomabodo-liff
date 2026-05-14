'use client'

import { useEffect, useState } from 'react'
import { useLiff } from '@/components/liff/LiffProvider'
import Link from 'next/link'

type SubStatus = {
  isActive: boolean
  planName: string | null
  currentPeriodEnd: string | null
}

export default function SubscriptionPage() {
  const { isReady, accessToken } = useLiff()
  const [sub, setSub] = useState<SubStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    if (!isReady || !accessToken) return
    fetch('/api/status', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.json())
      .then((d) => setSub(d.subscription))
      .finally(() => setLoading(false))
  }, [isReady, accessToken])

  async function handleSubscribe() {
    if (!accessToken) return
    setSubscribing(true)
    try {
      const res = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setSubscribing(false)
    }
  }

  if (!isReady || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-6 pt-12">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-8 text-center">
          月額プラン
        </h1>

        {sub?.isActive ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <div className="text-green-600 text-4xl mb-3">✓</div>
            <p className="font-bold text-green-700 text-lg mb-2">
              会員登録済み
            </p>
            <p className="text-green-600 text-sm">
              次回更新:{' '}
              {sub.currentPeriodEnd
                ? new Date(sub.currentPeriodEnd).toLocaleDateString('ja-JP')
                : '-'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="font-bold text-lg mb-4 text-center">
                のまぼど 月額プラン
              </h2>
              <ul className="space-y-3 text-sm text-gray-600 mb-6">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  入室料金が無料（または割引）
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  月に何度でもご来店いただけます
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Stripeで安全に決済
                </li>
              </ul>
              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl disabled:opacity-50 transition-colors"
              >
                {subscribing ? '処理中...' : '月額プランに登録する'}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-gray-400 text-sm">
            ← ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
