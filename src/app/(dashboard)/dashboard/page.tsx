import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, PieChart, Newspaper, Activity } from "lucide-react";
import Link from "next/link";

async function getPortfolioStats(userId: string) {
  const portfolios = await prisma.portfolio.findMany({
    where: { userId },
    include: {
      assets: true,
    },
  });

  const totalAssets = portfolios.reduce((acc, p) => acc + p.assets.length, 0);
  
  // Calculate total value (placeholder - will be updated with real prices)
  let totalValue = 0;
  let totalCost = 0;

  portfolios.forEach((portfolio) => {
    portfolio.assets.forEach((asset) => {
      const quantity = Number(asset.quantity);
      const avgPrice = Number(asset.avgPrice);
      totalCost += quantity * avgPrice;
      // For now, use avgPrice as current price (will update with API)
      totalValue += quantity * avgPrice;
    });
  });

  const change = totalValue - totalCost;
  const changePercent = totalCost > 0 ? (change / totalCost) * 100 : 0;

  return {
    portfolioCount: portfolios.length,
    totalAssets,
    totalValue,
    change,
    changePercent,
  };
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) return null;

  const stats = await getPortfolioStats(session.user.id);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {session.user.name || "Investor"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s an overview of your portfolio performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalValue)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stats.change >= 0 ? (
                <TrendingUp className="mr-1 h-3 w-3 text-chart-green" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-chart-red" />
              )}
              <span className={stats.change >= 0 ? "text-chart-green" : "text-chart-red"}>
                {formatPercent(stats.changePercent)}
              </span>
              <span className="ml-1">from cost basis</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolios</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.portfolioCount}</div>
            <p className="text-xs text-muted-foreground">
              Active portfolios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssets}</div>
            <p className="text-xs text-muted-foreground">
              Across all portfolios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h Change</CardTitle>
            <Newspaper className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-green">+0.00%</div>
            <p className="text-xs text-muted-foreground">
              Coming soon with live data
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/portfolio">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Manage Portfolio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Add, edit, or remove assets from your portfolios
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/charts">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                View Charts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Analyze price movements and technical indicators
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/ai">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-primary" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get AI-powered analysis and news summaries
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

