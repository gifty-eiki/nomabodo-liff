import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secret = new TextEncoder().encode(
  process.env.ADMIN_COOKIE_SECRET || 'fallback-secret-change-in-production'
)

const COOKIE_NAME = 'nomabodo_admin'

export async function createAdminToken(lineUserId: string): Promise<string> {
  return new SignJWT({ sub: lineUserId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyAdminToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload.sub as string
  } catch {
    return null
  }
}

export async function getAdminSession(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyAdminToken(token)
}

export { COOKIE_NAME }
