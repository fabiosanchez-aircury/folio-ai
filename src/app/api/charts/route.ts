import { NextResponse } from "next/server";
import { getBinanceKlines, get24hChange } from "@/lib/api/binance";

// Popular crypto symbols for quick validation
const CRYPTO_SYMBOLS = new Set([
  "BTC", "ETH", "BNB", "XRP", "ADA", "DOGE", "SOL", "DOT", "MATIC", "LINK",
  "LTC", "AVAX", "ATOM", "UNI", "XLM", "ALGO", "VET", "FIL", "TRX", "ETC",
  "NEAR", "APT", "ARB", "OP", "INJ", "SUI", "SEI", "PEPE", "SHIB", "BONK"
]);

// Map time range to Binance interval and limit
function getIntervalConfig(timeRange: string): { interval: string; limit: number } {
  switch (timeRange) {
    case "1D":
      return { interval: "15m", limit: 96 }; // 24h at 15min intervals
    case "1W":
      return { interval: "1h", limit: 168 }; // 7 days at 1h intervals
    case "1M":
      return { interval: "4h", limit: 180 }; // 30 days at 4h intervals
    case "3M":
      return { interval: "1d", limit: 90 }; // 90 days daily
    case "1Y":
      return { interval: "1d", limit: 365 }; // 365 days daily
    case "ALL":
      return { interval: "1w", limit: 200 }; // ~4 years weekly
    default:
      return { interval: "1d", limit: 90 };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.toUpperCase() || "BTC";
  const timeRange = searchParams.get("timeRange") || "3M";

  try {
    // Check if it's a crypto symbol
    const isCrypto = CRYPTO_SYMBOLS.has(symbol) || symbol.length <= 5;

    if (isCrypto) {
      const { interval, limit } = getIntervalConfig(timeRange);
      
      // Fetch klines and 24h change in parallel
      const [klines, ticker] = await Promise.all([
        getBinanceKlines(symbol, interval, limit),
        get24hChange(symbol),
      ]);

      const chartData = klines.map((k) => ({
        time: Math.floor(k.openTime / 1000), // Convert to seconds for lightweight-charts
        open: parseFloat(k.open),
        high: parseFloat(k.high),
        low: parseFloat(k.low),
        close: parseFloat(k.close),
        volume: parseFloat(k.volume),
      }));

      return NextResponse.json({
        symbol,
        type: "CRYPTO",
        data: chartData,
        ticker: {
          price: ticker.price,
          change: ticker.change,
          changePercent: ticker.changePercent,
        },
      });
    }

    // For stocks, we would use Alpha Vantage, but it has strict rate limits
    // Return an error suggesting to use crypto for now
    return NextResponse.json(
      { 
        error: "Stock data requires API key configuration",
        message: "Add ALPHA_VANTAGE_API_KEY to environment variables for stock data" 
      },
      { status: 400 }
    );

  } catch (error) {
    console.error("Chart API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chart data", message: (error as Error).message },
      { status: 500 }
    );
  }
}

