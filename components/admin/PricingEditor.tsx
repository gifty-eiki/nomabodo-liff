'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PricePlan } from '@prisma/client'

export function PricingEditor({ plans }: { plans: PricePlan[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function startEdit(plan: PricePlan) {
    setEditing(plan.id)
    setForm({
      label: plan.label,
      maxMinutes: plan.maxMinutes == null ? '' : String(plan.maxMinutes),
      amountYen: String(plan.amountYen),
    })
  }

  async function save(id: string) {
    setSaving(true)
    setMessage(null)
    try {
      const trimmed = form.maxMinutes.trim()
      const res = await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          label: form.label,
          // 空欄はフリー（上限なし = null）
          maxMinutes: trimmed === '' ? null : parseInt(trimmed),
          amountYen: parseInt(form.amountYen),
        }),
      })
      if (res.ok) {
        setMessage('保存しました')
        setEditing(null)
        router.refresh()
      } else {
        setMessage('保存に失敗しました')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {message && (
        <div className="px-6 py-3 bg-green-50 text-green-700 text-sm border-b">
          {message}
        </div>
      )}
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs text-gray-500 border-b">
            <th className="px-6 py-3">プラン名</th>
            <th className="px-6 py-3">上限時間（分）</th>
            <th className="px-6 py-3">料金（円）</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan) => (
            <tr key={plan.id} className="border-b last:border-0">
              <td className="px-6 py-4">
                {editing === plan.id ? (
                  <input
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    className="border rounded px-2 py-1 text-sm w-40"
                  />
                ) : (
                  <span className="text-sm font-medium">{plan.label}</span>
                )}
              </td>
              <td className="px-6 py-4">
                {editing === plan.id ? (
                  <input
                    type="number"
                    value={form.maxMinutes}
                    placeholder="空欄=フリー"
                    onChange={(e) =>
                      setForm({ ...form, maxMinutes: e.target.value })
                    }
                    className="border rounded px-2 py-1 text-sm w-32"
                  />
                ) : (
                  <span className="text-sm">
                    {plan.maxMinutes == null ? (
                      <span className="text-amber-600 font-medium">フリー（上限なし）</span>
                    ) : (
                      `${plan.maxMinutes} 分まで`
                    )}
                  </span>
                )}
              </td>
              <td className="px-6 py-4">
                {editing === plan.id ? (
                  <input
                    type="number"
                    value={form.amountYen}
                    onChange={(e) =>
                      setForm({ ...form, amountYen: e.target.value })
                    }
                    className="border rounded px-2 py-1 text-sm w-24"
                  />
                ) : (
                  <span className="text-sm">¥{plan.amountYen.toLocaleString()}</span>
                )}
              </td>
              <td className="px-6 py-4">
                {editing === plan.id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => save(plan.id)}
                      disabled={saving}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg disabled:opacity-50"
                    >
                      {saving ? '保存中...' : '保存'}
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-lg"
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(plan)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm rounded-lg"
                  >
                    編集
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
