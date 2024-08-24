import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import prisma from "@/db/db";
import { formatCurrency, formatNumber } from "@/lib/formatters";

export default async function AdminDashboard() {
    // const salesData = await getSalesData()
    const [salesData, userData, productData] = await Promise.all([
        getSalesData(),
        getUserData(),
        getProductData()
    ]);
    return (
        <div className="grid grid-clos-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DashboardCard
                title="Sales"
                subtitle={`${formatNumber(salesData.numberOfSales)} orders`}
                body={formatCurrency(salesData.amount)}
            ></DashboardCard>
            <DashboardCard
                title="Customer"
                subtitle={`${formatCurrency(
                    userData.averageValuePerUser
                )} Average Value`}
                body={formatNumber(userData.userCount)}
            ></DashboardCard>
            <DashboardCard
                title="Active Products"
                subtitle={`${formatCurrency(
                    productData.inactiveCount
                )} Inactive`}
                body={formatNumber(productData.activeCount)}
            ></DashboardCard>
        </div>
    );
}

type DashBoardCardProps = {
    title: string;
    subtitle: string;
    body: string;
};

async function getSalesData() {
    const data = await prisma.order.aggregate({
        _sum: { pricePaidInCents: true },
        _count: true,
    });

    await wait(2000)

    return {
        amount: data._sum.pricePaidInCents || 0 / 100,
        numberOfSales: data._count,
    };
}

function wait(duration: number) {
    return new Promise(resolve => setTimeout(resolve, duration))
}


async function getUserData() {
    // const userCount = await prisma.user.count()
    // const orderData = await prisma.order.aggregate(
    //     {
    //         _sum: { pricePaidInCents: true }
    //     }
    // )

    const [userCount, orderData] = await Promise.all([
        prisma.user.count(),
        prisma.order.aggregate({
            _sum: { pricePaidInCents: true },
        }),
    ]);

    return {
        userCount,
        averageValuePerUser:
            userCount === 0
                ? 0
                : (orderData._sum.pricePaidInCents || 0) / userCount / 100,
    };
}

async function getProductData() {
    const [activeCount, inactiveCount] =
        await Promise.all([
            prisma.product.count({ where: { isAvailablePurchase: true } }),
            prisma.product.count({ where: { isAvailablePurchase: false } })
        ])

    return { activeCount, inactiveCount }
}

function DashboardCard({ title, subtitle, body }: DashBoardCardProps) {
    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{subtitle}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>{body}</p>
                </CardContent>
            </Card>
        </>
    );
}
