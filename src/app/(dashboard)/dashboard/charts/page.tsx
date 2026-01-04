"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PriceChart, ChartType, ChartDataPoint } from "@/components/charts";
import { Search, CandlestickChart, LineChartIcon, AreaChart, Loader2, RefreshCw } from "lucide-react";

interface ChartApiResponse {
  symbol: string;
  type: "CRYPTO" | "STOCK";
  data: ChartDataPoint[];
  ticker: {
    price: number;
    change: number;
    changePercent: number;
  };
}

const chartTypes: { type: ChartType; icon: React.ReactNode; label: string }[] = [
  { type: "candlestick", icon: <CandlestickChart className="h-4 w-4" />, label: "Candles" },
  { type: "line", icon: <LineChartIcon className="h-4 w-4" />, label: "Line" },
  { type: "area", icon: <AreaChart className="h-4 w-4" />, label: "Area" },
];

const timeRanges = ["1D", "1W", "1M", "3M", "1Y", "ALL"];

const popularSymbols = ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX"];

export default function ChartsPage() {
  const [symbol, setSymbol] = useState("BTC");
  const [searchInput, setSearchInput] = useState("");
  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [timeRange, setTimeRange] = useState("3M");
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [ticker, setTicker] = useState<ChartApiResponse["ticker"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchChartData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/charts?symbol=${symbol}&timeRange=${timeRange}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch data");
      }

      const result: ChartApiResponse = await response.json();
      setData(result.data);
      setTicker(result.ticker);
      setLastUpdate(new Date());
    } catch (err) {
      setError((err as Error).message);
      setData([]);
      setTicker(null);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, timeRange]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchChartData, 30000);
    return () => clearInterval(interval);
  }, [fetchChartData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSymbol(searchInput.toUpperCase());
      setSearchInput("");
    }
  };

  const handleSymbolClick = (sym: string) => {
    setSymbol(sym);
  };

  // Calculate high/low from data
  const high24h = data.length > 0 
    ? Math.max(...data.slice(-96).map(d => d.high || d.close || 0))
    : null;
  const low24h = data.length > 0 
    ? Math.min(...data.slice(-96).map(d => d.low || d.close || Infinity))
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Charts</h1>
        <p className="text-muted-foreground mt-1">
          Real-time crypto price charts powered by Binance
        </p>
      </div>

      {/* Popular Symbols */}
      <div className="flex flex-wrap gap-2">
        {popularSymbols.map((sym) => (
          <Button
            key={sym}
            variant={symbol === sym ? "default" : "outline"}
            size="sm"
            onClick={() => handleSymbolClick(sym)}
          >
            {sym}
          </Button>
        ))}
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search crypto (BTC, ETH, SOL...)"
              className="pl-9"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <div className="flex gap-2">
          {chartTypes.map((ct) => (
            <Button
              key={ct.type}
              variant={chartType === ct.type ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType(ct.type)}
              className="gap-1"
            >
              {ct.icon}
              <span className="hidden sm:inline">{ct.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{symbol}/USDT</span>
                {ticker && (
                  <span className={`text-lg font-semibold ${ticker.changePercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {ticker.changePercent >= 0 ? "+" : ""}{ticker.changePercent.toFixed(2)}%
                  </span>
                )}
              </CardTitle>
              {lastUpdate && (
                <span className="text-xs text-muted-foreground">
                  Updated: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchChartData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              <div className="flex gap-1">
                {timeRanges.map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading && data.length === 0 ? (
            <div className="flex items-center justify-center h-[500px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
              <p className="text-destructive mb-2">{error}</p>
              <Button variant="outline" onClick={fetchChartData}>
                Try Again
              </Button>
            </div>
          ) : (
            <PriceChart
              data={data}
              type={chartType}
              height={500}
              symbol={symbol}
            />
          )}
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${ticker?.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              24h Change
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${(ticker?.change || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
              {ticker?.change !== undefined 
                ? `${ticker.change >= 0 ? "+" : ""}$${ticker.change.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              24h High
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">
              ${high24h?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              24h Low
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">
              ${low24h?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Data provided by Binance • Auto-refreshes every 30 seconds
      </p>
    </div>
  );
}
