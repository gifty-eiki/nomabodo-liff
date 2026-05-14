import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyLineToken, getLineUserId } from '@/lib/line'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  const token = getLineUserId(request)
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const lineUserId = await verifyLineToken(token)
  if (!lineUserId) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const profile = await prisma.profile.findUnique({
    where: { lineUserId },
    include: { subscription: true },
  })
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (profile.subscription?.status === 'active') {
    return NextResponse.json(
      { error: '既にサブスクリプションに登録済みです' },
      { status: 409 }
    )
  }

  let stripeCustomerId = profile.stripeCustomerId
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      name: profile.displayName ?? undefined,
      metadata: { lineUserId },
    })
    stripeCustomerId = customer.id
    await prisma.profile.update({
      where: { id: profile.id },
      data: { stripeCustomerId },
    })
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: [
      {
        price: process.env.STRIPE_SUBSCRIPTION_PRICE_ID!,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
    metadata: { lineUserId },
  })

  return NextResponse.json({ url: session.url })
}
