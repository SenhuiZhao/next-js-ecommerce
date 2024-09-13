import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import prisma from "@/db/db";

export async function GET(
  req: NextRequest,
  {
    params: { downloadVerificationId },
  }: { params: { downloadVerificationId: string } }
) {
  const data = await prisma.downloadVerification.findUnique({
    where: { id: downloadVerificationId, expiresAt: { gt: new Date() } },
    select: { product: { select: { filePath: true, name: true } } },
  });

  if (data == null) {
    return NextResponse.redirect(
      new URL("/products/download/expired", req.url)
    );
  }

  const { size } = await fs.stat(data.product.filePath);
  const file = await fs.readFile(data.product.filePath);
  const extension = data.product.filePath.split(".").pop();
  return new NextResponse(file, {
    headers: {
      "content-disposition": `attachment; filename = "${data.product.name}.${extension}"`,
      "content-length": size.toString(),
    },
  });
}

// export function GET() {
//   return new NextResponse(" Hi here ");
// }
