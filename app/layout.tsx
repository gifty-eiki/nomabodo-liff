import type { Metadata } from 'next'
import './globals.css'
import { LiffProvider } from '@/components/liff/LiffProvider'

export const metadata: Metadata = {
  title: 'のまぼど',
  description: 'のまぼどボードゲームカフェ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 min-h-screen">
        <LiffProvider>{children}</LiffProvider>
      </body>
    </html>
  )
}
