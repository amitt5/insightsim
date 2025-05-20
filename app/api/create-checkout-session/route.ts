import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  console.log('user111', user)

  const { data: dbUser, error } = await supabase
    .from("users")
    .select("stripe_customer_id, email")
    .eq("user_id", user.id)
    .single();

  if (error || !dbUser) {
    return NextResponse.json({ error: "User not found in DB" }, { status: 400 });
  }

  let customerId = dbUser.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: dbUser.email,
      metadata: { supabase_uid: user.id },
    });

    customerId = customer.id;

    await supabase
      .from("users")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        price: "price_1RQUCoIrmrN5n2Ted3o42POX", // Replace with actual price ID
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account?canceled=true`,
    metadata: {
      user_id: user.id, // 🔥 this is what webhook needs!
    },
  });

  return NextResponse.json({ url: session.url })
}
