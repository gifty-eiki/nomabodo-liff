'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PricingConfig } from '@prisma/client'

export function PricingEditor({ configs }: { configs: PricingConfig[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function startEdit(config: PricingConfig) {
    setEditing(config.id)
    setForm({
      label: config.label,
      intervalMinutes: String(config.intervalMinutes),
      amountYen: String(config.amountYen),
    })
  }

  async function save(id: string) {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          label: form.label,
          intervalMinutes: parseInt(form.intervalMinutes),
          amountYen: parseInt(form.amountYen),
        }),
      })
      if (res.ok) {
        setMessage('保存しました')
        setEditing(null)
        router.refresh()
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
            <th className="px-6 py-3">対象</th>
            <th className="px-6 py-3">ラベル</th>
            <th className="px-6 py-3">時間単位（分）</th>
            <th className="px-6 py-3">料金（円）</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {configs.map((config) => (
            <tr key={config.id} className="border-b last:border-0">
              <td className="px-6 py-4 text-sm text-gray-500">
                {config.appliesTo === 'pay_per_use' ? '通常' : '会員'}
              </td>
              <td className="px-6 py-4">
                {editing === config.id ? (
                  <input
                    value={form.label}
                    onChange={(e) =>
                      setForm({ ...form, label: e.target.value })
                    }
                    className="border rounded px-2 py-1 text-sm w-40"
                  />
                ) : (
                  <span className="text-sm">{config.label}</span>
                )}
              </td>
              <td className="px-6 py-4">
                {editing === config.id ? (
                  <input
                    type="number"
                    value={form.intervalMinutes}
                    onChange={(e) =>
                      setForm({ ...form, intervalMinutes: e.target.value })
                    }
                    className="border rounded px-2 py-1 text-sm w-24"
                  />
                ) : (
                  <span className="text-sm">{config.intervalMinutes} 分</span>
                )}
              </td>
              <td className="px-6 py-4">
                {editing === config.id ? (
                  <input
                    type="number"
                    value={form.amountYen}
                    onChange={(e) =>
                      setForm({ ...form, amountYen: e.target.value })
                    }
                    className="border rounded px-2 py-1 text-sm w-24"
                  />
                ) : (
                  <span className="text-sm">¥{config.amountYen.toLocaleString()}</span>
                )}
              </td>
              <td className="px-6 py-4">
                {editing === config.id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => save(config.id)}
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
                    onClick={() => startEdit(config)}
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
