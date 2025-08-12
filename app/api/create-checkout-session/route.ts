import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  try {
    // replaceme: console.log("🔥 Starting checkout session creation");
    
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // replaceme: console.log("❌ User not authenticated");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // replaceme: console.log("✅ User authenticated:", user.id);

    const { data: dbUser, error } = await supabase
      .from("users")
      .select("stripe_customer_id, email")
      .eq("user_id", user.id)
      .single();

    if (error) {
      // replaceme: console.log("❌ Database error:", error);
      return NextResponse.json({ error: "User not found in DB" }, { status: 400 });
    }

    if (!dbUser) {
      // replaceme: console.log("❌ No user found in database");
      return NextResponse.json({ error: "User not found in DB" }, { status: 400 });
    }

    // replaceme: console.log("✅ Database user found:", dbUser);

    let customerId = dbUser.stripe_customer_id;

    if (!customerId) {
      // replaceme: console.log("🔄 Creating new Stripe customer");
      const customer = await stripe.customers.create({
        email: dbUser.email,
        metadata: { supabase_uid: user.id },
      });

      customerId = customer.id;
      // replaceme: console.log("✅ Stripe customer created:", customerId);

      await supabase
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("user_id", user.id);
    }

    // replaceme: console.log("🔄 Creating checkout session");
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: "price_1RX4auGgTkMKNSdseu5fg9LU",
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account?canceled=true`,
      metadata: {
        user_id: user.id,
      },
    });

    // replaceme: console.log("✅ Checkout session created:", session.id);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("❌ Error in create-checkout-session:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
