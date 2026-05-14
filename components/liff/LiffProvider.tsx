'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import type Liff from '@line/liff'

type LiffProfile = {
  userId: string
  displayName: string
  pictureUrl?: string
}

type LiffContextValue = {
  liff: typeof Liff | null
  profile: LiffProfile | null
  accessToken: string | null
  isReady: boolean
  error: string | null
}

const LiffContext = createContext<LiffContextValue>({
  liff: null,
  profile: null,
  accessToken: null,
  isReady: false,
  error: null,
})

// 開発モード用のダミープロファイル
const DEV_PROFILE: LiffProfile = {
  userId: 'dev-user-001',
  displayName: '開発ユーザー',
  pictureUrl: undefined,
}
const DEV_TOKEN = 'dev-access-token'
const IS_DEV = process.env.NEXT_PUBLIC_LIFF_ID === 'dev-mode'

export function LiffProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<LiffContextValue>({
    liff: null,
    profile: null,
    accessToken: null,
    isReady: false,
    error: null,
  })

  useEffect(() => {
    async function init() {
      // 開発モード: LINEなしで動作
      if (IS_DEV) {
        await fetch('/api/upsert-profile', {
          method: 'POST',
          headers: { Authorization: `Bearer ${DEV_TOKEN}` },
        })
        setValue({
          liff: null,
          profile: DEV_PROFILE,
          accessToken: DEV_TOKEN,
          isReady: true,
          error: null,
        })
        return
      }

      // 本番モード: LIFF初期化
      try {
        const liff = (await import('@line/liff')).default
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })

        if (!liff.isLoggedIn()) {
          liff.login()
          return
        }

        const profile = await liff.getProfile()
        const accessToken = liff.getAccessToken()

        if (accessToken) {
          await fetch('/api/upsert-profile', {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
          })
        }

        setValue({
          liff,
          profile: {
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
          },
          accessToken,
          isReady: true,
          error: null,
        })
      } catch (err) {
        setValue((prev) => ({
          ...prev,
          isReady: true,
          error: err instanceof Error ? err.message : 'LIFF初期化に失敗しました',
        }))
      }
    }

    init()
  }, [])

  return <LiffContext.Provider value={value}>{children}</LiffContext.Provider>
}

export function useLiff() {
  return useContext(LiffContext)
}
