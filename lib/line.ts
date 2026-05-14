const DEV_LINE_USER_ID = 'dev-user-001'
const DEV_TOKEN = 'dev-access-token'

export async function verifyLineToken(token: string): Promise<string | null> {
  // 開発モード: ダミートークンを通す
  if (token === DEV_TOKEN) return DEV_LINE_USER_ID

  try {
    const res = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.userId as string
  } catch {
    return null
  }
}

export function getLineUserId(request: Request): string | null {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7)
}
