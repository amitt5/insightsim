import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  console.log("🔥 Webhook received!");
  
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });

  switch (event.type) {
    case "checkout.session.completed":
      console.log("✅ Checkout session completed");
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      
      if (userId && session.subscription) {
        await supabase
          .from("users")
          .update({
            subscription_id: session.subscription,
            subscription_status: "active",
          })
          .eq("user_id", userId);
        console.log("✅ User subscription updated to active");
      }
      break;

    case "invoice.payment_succeeded":
      console.log("✅ Payment succeeded");
      break;

    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      console.log("✅ Subscription updated/deleted");
      break;
  }

  console.log("✅ Webhook processed successfully");
  return NextResponse.json({ received: true });
}
