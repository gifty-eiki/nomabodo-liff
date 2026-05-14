'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ForceCheckoutButton({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleForce() {
    if (!confirm('強制チェックアウトしますか？')) return
    setLoading(true)
    try {
      await fetch('/api/admin/force-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleForce}
      disabled={loading}
      className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-lg disabled:opacity-50 transition-colors"
    >
      {loading ? '処理中...' : '強制退室'}
    </button>
  )
}
