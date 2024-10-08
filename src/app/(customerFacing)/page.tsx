import { Button } from "@/components/ui/button";
import prisma from "@/db/db";
import { Product } from "@prisma/client";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  ProductCard,
  ProductCardSkeleton,
} from "../admin/_components/ProductCard";
import { Suspense } from "react";
import { cache } from "@/lib/cache";

// function getNewestProduct() {
//   return prisma.product.findMany({
//     where: { isAvailablePurchase: true },
//     orderBy: { order: { _count: "desc" } },
//     take: 6,
//   });
// }

const getNewestProduct = cache(
  () => {
    return prisma.product.findMany({
      where: { isAvailablePurchase: true },
      orderBy: { order: { _count: "desc" } },
      take: 6,
    });
  },
  ["/", "getNewestProduct"],
  { revalidate: 60 * 60 * 24 }
);

const getMostPopularProducts = cache(
  () => {
    // await wait(2000);
    return prisma.product.findMany({
      where: { isAvailablePurchase: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    });
  },
  ["/", "getMostPopularProducts"],
  { revalidate: 60 * 60 * 24 }
);
// function getMostPopularProducts() {
//   // await wait(2000);
//   return prisma.product.findMany({
//     where: { isAvailablePurchase: true },
//     orderBy: { createdAt: "desc" },
//     take: 6,
//   });
// }

// slow down the browser
// async function wait(duration: number) {
//   return new Promise((resolve) => setTimeout(resolve, duration));
// }

export default function HomePage() {
  return (
    <main className="space-y-12">
      <ProductGridSection
        title="Most Popular"
        productsFetcher={getMostPopularProducts}
      ></ProductGridSection>
      <ProductGridSection
        title="Newest"
        productsFetcher={getNewestProduct}
      ></ProductGridSection>
    </main>
  );
}

type ProductGridSectionProps = {
  title: string;
  productsFetcher: () => Promise<Product[]>;
};

function ProductGridSection({
  productsFetcher,
  title,
}: ProductGridSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <h2 className="text-3xl font-bold">{title}</h2>
        <Button variant="outline" asChild>
          <Link href="/products" className="space-x-2">
            <span>View All</span>
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Suspense
          fallback={
            <>
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </>
          }
        >
          <ProductSuspense productsFetcher={productsFetcher} />
        </Suspense>
      </div>
    </div>
  );
}

async function ProductSuspense({
  productsFetcher,
}: {
  productsFetcher: () => Promise<Product[]>;
}) {
  return (await productsFetcher()).map((product) => (
    <ProductCard key={product.id} {...product} />
  ));
}
