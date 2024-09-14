"use server";

import prisma from "@/db/db";
import { notFound } from "next/navigation";

export async function deleteOrder(id: string) {
  const order = await prisma.order.delete({
    where: { id },
  });

  if (order == null) return notFound();

  return order;
}
