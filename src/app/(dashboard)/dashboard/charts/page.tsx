"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PriceChart, ChartType, ChartDataPoint } from "@/components/charts";
import { Search, CandlestickChart, LineChartIcon, AreaChart } from "lucide-react";

// Sample data for demo (will be replaced with real API data)
function generateSampleData(days: number = 90): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const now = new Date();
  let price = 45000 + Math.random() * 5000;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const change = (Math.random() - 0.48) * 1000;
    const open = price;
    price = Math.max(1000, price + change);
    const close = price;
    const high = Math.max(open, close) + Math.random() * 500;
    const low = Math.min(open, close) - Math.random() * 500;

    data.push({
      time: dateStr,
      open,
      high,
      low,
      close,
      value: close,
    });
  }

  return data;
}

const chartTypes: { type: ChartType; icon: React.ReactNode; label: string }[] = [
  { type: "candlestick", icon: <CandlestickChart className="h-4 w-4" />, label: "Candles" },
  { type: "line", icon: <LineChartIcon className="h-4 w-4" />, label: "Line" },
  { type: "area", icon: <AreaChart className="h-4 w-4" />, label: "Area" },
];

const timeRanges = ["1D", "1W", "1M", "3M", "1Y", "ALL"];

export default function ChartsPage() {
  const [symbol, setSymbol] = useState("BTC");
  const [searchInput, setSearchInput] = useState("");
  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [timeRange, setTimeRange] = useState("3M");
  const [data] = useState(() => generateSampleData(90));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSymbol(searchInput.toUpperCase());
      setSearchInput("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Charts</h1>
        <p className="text-muted-foreground mt-1">
          Analyze price movements with interactive charts
        </p>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search symbol (BTC, ETH, AAPL...)"
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{symbol}/USD</span>
              <span className="text-sm text-muted-foreground font-normal">
                Demo Data
              </span>
            </CardTitle>
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
        </CardHeader>
        <CardContent className="pt-0">
          <PriceChart
            data={data}
            type={chartType}
            height={500}
            symbol={symbol}
          />
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              24h High
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-chart-green">
              ${data[data.length - 1]?.high?.toLocaleString() || "—"}
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
            <p className="text-2xl font-bold text-chart-red">
              ${data[data.length - 1]?.low?.toLocaleString() || "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${data[data.length - 1]?.close?.toLocaleString() || "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Note: Currently showing demo data. Connect to market APIs for real-time prices.
      </p>
    </div>
  );
}

