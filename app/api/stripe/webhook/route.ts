import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'
import type Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.mode === 'payment' && session.metadata?.paymentId) {
        await prisma.payment.update({
          where: { id: session.metadata.paymentId },
          data: {
            status: 'succeeded',
            stripePaymentIntentId: session.payment_intent as string,
          },
        })
      }

      if (session.mode === 'subscription' && session.metadata?.lineUserId) {
        const sub = await stripe.subscriptions.retrieve(
          session.subscription as string
        )
        const profile = await prisma.profile.findUnique({
          where: { lineUserId: session.metadata.lineUserId },
        })
        if (profile) {
          await prisma.subscription.upsert({
            where: { profileId: profile.id },
            create: {
              profileId: profile.id,
              stripeSubscriptionId: sub.id,
              stripePriceId: sub.items.data[0].price.id,
              planName: 'monthly_unlimited',
              status: sub.status,
              currentPeriodStart: new Date(sub.current_period_start * 1000),
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
            },
            update: {
              status: sub.status,
              currentPeriodStart: new Date(sub.current_period_start * 1000),
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
            },
          })
        }
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          status: sub.status,
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        },
      })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { status: 'canceled' },
      })
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subId =
        typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id
      if (subId) {
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subId },
          data: { status: 'past_due' },
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
