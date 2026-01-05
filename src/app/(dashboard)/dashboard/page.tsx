import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Activity, Newspaper } from "lucide-react";
import Link from "next/link";
import { PortfolioStats } from "@/components/dashboard/portfolio-stats";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) return null;

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

      {/* Real-time Portfolio Stats */}
      <PortfolioStats />

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
