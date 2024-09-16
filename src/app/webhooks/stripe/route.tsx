import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/db/db";
import { Resend } from "resend";
import PurchaseReceiptEmail from "@/email/PurchaseReceipt";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const resend = new Resend(process.env.RESEND_API_KEY as string);

export async function POST(req: NextRequest) {
  // console.log("11111--------------1111");
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

    console.log(`email ${email}`);
    console.log(`productId ${productId}`);

    if (product == null || email == null) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    const userFields = {
      email,
      order: { create: { productId, pricePaidInCents } }, // Updated to 'order'
    };

    const {
      order: [order],
    } = await prisma.user.upsert({
      where: { email },
      create: userFields,
      update: userFields,
      select: { order: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    const downloadVerification = await prisma.downloadVerification.create({
      data: {
        productId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });

    await resend.emails.send({
      from: `Support <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: "Order Confirmation",
      react: (
        <PurchaseReceiptEmail
          order={order}
          product={product}
          downloadVerificationId={downloadVerification.id}
        />
        // <h1>Hello</h1>
      ),
    });
  }

  return new NextResponse();
}
