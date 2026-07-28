import type { PricingConfig } from '@prisma/client'

/** 学割: 半額（500円単位なので250円単位で綺麗に割れる。端数は切り捨て） */
export function applyStudentDiscount(amount: number, isStudent: boolean): number {
  if (!isStudent) return amount
  return Math.floor(amount / 2)
}

export function getVisitCost(
  durationMinutes: number,
  isSubscriber: boolean,
  configs: PricingConfig[],
  isStudent = false
): number {
  const applicableTo = isSubscriber ? 'subscriber' : 'pay_per_use'
  const config = configs.find((c) => c.appliesTo === applicableTo && c.isActive)

  if (!config) return 0

  const units = Math.ceil(durationMinutes / config.intervalMinutes)
  const base = units * config.amountYen
  return applyStudentDiscount(base, isStudent)
}

export function formatYen(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount)
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}分`
  if (m === 0) return `${h}時間`
  return `${h}時間${m}分`
}
