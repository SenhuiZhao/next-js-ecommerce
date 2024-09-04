import {
  ProductCard,
  ProductCardSkeleton,
} from "@/app/admin/_components/ProductCard";
import prisma from "@/db/db";
import { cache } from "@/lib/cache";
import { Suspense } from "react";

// function getProducts() {
//   return prisma.product.findMany({
//     where: { isAvailablePurchase: true },
//     orderBy: { name: "asc" },
//   });
// }

const getProducts = cache(() => {
  return prisma.product.findMany({
    where: { isAvailablePurchase: true },
    orderBy: { name: "asc" },
  });
}, ["/products", "getProducts"]);

export default function ProductsPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Suspense
        fallback={
          <>
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </>
        }
      >
        <ProductsSuspense />
      </Suspense>
    </div>
  );
}

async function ProductsSuspense() {
  const products = await getProducts();
  return products.map((product) => (
    <ProductCard key={product.id} {...product} />
  ));
}
