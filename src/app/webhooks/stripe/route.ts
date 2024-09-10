import prisma from "@/db/db";
import { NextRequest, NextResponse } from "next/server";

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: NextRequest) {
  const event = await stripe.webhooks.constructEvent(
    await req.text(),
    req.headers.get("stripe-signature") as string,
    process.env.STRIPE_WEBHOOK_SECRET as string
  );

  if (event.type === "charge.succeeded") {
    const charge = event.data.object;
    const productId = charge.metadata.productId;
    const email = charge.billing_details.email;
    const pricePaidInCents = charge.amount;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (product == null || email == null) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    const userInfo = {
      email,
      order: { create: { productId, pricePaidInCents } },
    };

    const {
      order: [order],
    } = await prisma.user.upsert({
      where: { email },
      create: userInfo,
      update: userInfo,
      select: { order: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    const downloadVerification = await prisma.downloadVerification.create({
      data: {
        productId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });
  }
}
