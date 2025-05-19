import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text(); // raw body
  const sig = (await headers()).get('stripe-signature') as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.metadata?.user_id;

    if (!userId) {
      console.error('No user ID in metadata');
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    const { error } = await supabase
      .from('users')
      .update({ role: 'premium_basic' })
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to update user role:', error);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    console.log(`User ${userId} upgraded to premium_basic`);
  }

  return NextResponse.json({ received: true });
}
