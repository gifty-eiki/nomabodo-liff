'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MenuItem } from '@prisma/client'

export function MenuEditor({ items }: { items: MenuItem[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function startEdit(item: MenuItem) {
    setEditing(item.id)
    setForm({
      label: item.label,
      priceYen: String(item.priceYen),
    })
  }

  async function save(id: string, isActive: boolean) {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          label: form.label,
          priceYen: parseInt(form.priceYen),
          isActive,
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

  async function toggleActive(item: MenuItem) {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          label: item.label,
          priceYen: item.priceYen,
          isActive: !item.isActive,
        }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        setMessage('更新に失敗しました')
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
            <th className="px-6 py-3">メニュー名</th>
            <th className="px-6 py-3">種別</th>
            <th className="px-6 py-3">価格（円）</th>
            <th className="px-6 py-3">状態</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b last:border-0">
              <td className="px-6 py-4">
                {editing === item.id ? (
                  <input
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    className="border rounded px-2 py-1 text-sm w-40"
                  />
                ) : (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-gray-500">
                  {item.kind === 'toggle' ? 'ON/OFF' : '個数'}
                </span>
              </td>
              <td className="px-6 py-4">
                {editing === item.id ? (
                  <input
                    type="number"
                    value={form.priceYen}
                    onChange={(e) => setForm({ ...form, priceYen: e.target.value })}
                    className="border rounded px-2 py-1 text-sm w-24"
                  />
                ) : (
                  <span className="text-sm">¥{item.priceYen.toLocaleString()}</span>
                )}
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => toggleActive(item)}
                  disabled={saving || editing === item.id}
                  className={`px-2.5 py-1 text-xs rounded-full font-medium disabled:opacity-50 ${
                    item.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {item.isActive ? '表示中' : '非表示'}
                </button>
              </td>
              <td className="px-6 py-4">
                {editing === item.id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => save(item.id, item.isActive)}
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
                    onClick={() => startEdit(item)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm rounded-lg"
                  >
                    編集
                  </button>
                )}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">
                メニューが登録されていません
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
