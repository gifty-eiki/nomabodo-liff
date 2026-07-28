// 土日祝の判定（サーバー専用）
// ⚠️ このファイルは祝日データ(大)を含む @holiday-jp/holiday_jp を読み込むため、
//    クライアントコンポーネントから import しないこと。加算額はサーバーからpropsで渡す。
import { formatInTimeZone } from 'date-fns-tz'
import holidayJp from '@holiday-jp/holiday_jp'

const TZ = 'Asia/Tokyo'

/** 土日祝の一律加算額（円） */
export const WEEKEND_HOLIDAY_SURCHARGE = 500

/** 入室日時(UTC保存)を日本時間で見て、土日または日本の祝日かを判定する */
export function isWeekendOrHoliday(date: Date): boolean {
  // 日本時間での 年-月-日-ISO曜日(1=月〜7=日) を取得
  const [y, m, d, isoDow] = formatInTimeZone(date, TZ, 'yyyy-MM-dd-i')
    .split('-')
    .map(Number)

  if (isoDow === 6 || isoDow === 7) return true // 土曜・日曜

  // 祝日判定は日本時間の年月日で行う
  return holidayJp.isHoliday(new Date(y, m - 1, d))
}

/**
 * 土日祝の加算額を返す。
 * - 会員(サブスク)は対象外（¥0のまま）
 * - 一律加算（学割の半額対象外。呼び出し側で利用料に加算する）
 */
export function getWeekendHolidaySurcharge(
  checkInDate: Date,
  isSubscriber: boolean
): number {
  if (isSubscriber) return 0
  return isWeekendOrHoliday(checkInDate) ? WEEKEND_HOLIDAY_SURCHARGE : 0
}
