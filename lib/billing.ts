/** 料金プラン1件分（クライアント/サーバー共通で扱える最小形。PricePlanと構造互換） */
export type PlanTier = {
  label: string
  maxMinutes: number | null // null = フリー（上限なし）
  amountYen: number
  isActive?: boolean
}

/** 学割: 半額（端数は切り捨て） */
export function applyStudentDiscount(amount: number, isStudent: boolean): number {
  if (!isStudent) return amount
  return Math.floor(amount / 2)
}

/**
 * 滞在時間から適用プランを選ぶ（段階制）。
 * maxMinutes が小さい順に見て、滞在時間が収まる最初のプランを返す。
 * どれにも収まらなければフリー（maxMinutes=null）、無ければ最大のプランを返す。
 */
export function pickPlan(
  durationMinutes: number,
  plans: PlanTier[]
): PlanTier | null {
  const active = plans.filter((p) => p.isActive !== false)
  const capped = active
    .filter((p) => p.maxMinutes != null)
    .sort((a, b) => (a.maxMinutes as number) - (b.maxMinutes as number))
  const free = active.find((p) => p.maxMinutes == null) ?? null

  for (const p of capped) {
    if (durationMinutes <= (p.maxMinutes as number)) return p
  }
  return free ?? capped[capped.length - 1] ?? null
}

/**
 * 来店1回分の料金を計算する。
 * - 会員(サブスク)は ¥0
 * - それ以外は滞在時間で自動判定したプラン料金に、学割（半額）を適用
 * - 土日祝の加算は呼び出し側で別途上乗せする（半額対象外のため）
 */
export function getPlanCost(
  durationMinutes: number,
  isSubscriber: boolean,
  plans: PlanTier[],
  isStudent = false
): number {
  if (isSubscriber) return 0
  const plan = pickPlan(durationMinutes, plans)
  const base = plan?.amountYen ?? 0
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
