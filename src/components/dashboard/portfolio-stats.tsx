"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, PieChart, Activity, RefreshCw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/services/api";

interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  portfolioCount: number;
  assetCount: number;
}

export function PortfolioStats() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<{ summary: PortfolioSummary }>("/portfolio/values");
      setSummary(response.data.summary);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Refresh indicator */}
      <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
        {lastUpdated && (
          <span>Updated {lastUpdated.toLocaleTimeString()}</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={fetchData}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
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
              {isLoading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              ) : (
                formatCurrency(summary?.totalValue || 0)
              )}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {!isLoading && summary && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center">
                        {summary.totalProfitLoss >= 0 ? (
                          <TrendingUp className="mr-1 h-3 w-3 text-chart-green" />
                        ) : (
                          <TrendingDown className="mr-1 h-3 w-3 text-chart-red" />
                        )}
                        <span
                          className={
                            summary.totalProfitLoss >= 0 ? "text-chart-green" : "text-chart-red"
                          }
                        >
                          {formatPercent(summary.totalProfitLossPercent)}
                        </span>
                        <span className="ml-1">
                          ({summary.totalProfitLoss >= 0 ? "+" : ""}
                          {formatCurrency(summary.totalProfitLoss)})
                        </span>
                        <Info className="ml-1 h-3 w-3 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[250px]">
                      <div className="text-left space-y-1">
                        <p className="font-medium">Profit/Loss (P/L)</p>
                        <p className="text-xs text-muted-foreground">
                          Shows your total gain or loss across all portfolios compared to your total investment cost.
                          Calculated as: Current Value - Total Cost
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              ) : (
                formatCurrency(summary?.totalCost || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">Investment basis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolios</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-12 bg-muted animate-pulse rounded" />
              ) : (
                summary?.portfolioCount || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Active portfolios</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-12 bg-muted animate-pulse rounded" />
              ) : (
                summary?.assetCount || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Across all portfolios</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

