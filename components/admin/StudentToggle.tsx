'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  customerId: string
  initialIsStudent: boolean
}

export function StudentToggle({ customerId, initialIsStudent }: Props) {
  const router = useRouter()
  const [isStudent, setIsStudent] = useState(initialIsStudent)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    const next = !isStudent
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStudent: next }),
      })
      if (!res.ok) throw new Error('更新に失敗しました')
      const data = await res.json()
      setIsStudent(data.isStudent)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggle}
        disabled={loading}
        role="switch"
        aria-checked={isStudent}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
          isStudent ? 'bg-green-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isStudent ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className="text-sm text-gray-700">
        {isStudent ? '学割 適用中（料金半額）' : '学割なし'}
      </span>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
