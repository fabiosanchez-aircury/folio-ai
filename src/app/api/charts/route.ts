import { NextResponse } from "next/server";
import { getBinanceKlines, get24hChange } from "@/lib/api/binance";
import { getStockCandles, getQuote, mapTimeRangeToFinnhub } from "@/lib/api/finnhub";

// Popular crypto symbols for quick validation
const CRYPTO_SYMBOLS = new Set([
  "BTC", "ETH", "BNB", "XRP", "ADA", "DOGE", "SOL", "DOT", "MATIC", "LINK",
  "LTC", "AVAX", "ATOM", "UNI", "XLM", "ALGO", "VET", "FIL", "TRX", "ETC",
  "NEAR", "APT", "ARB", "OP", "INJ", "SUI", "SEI", "PEPE", "SHIB", "BONK"
]);

// Popular stock symbols
const STOCK_SYMBOLS = new Set([
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "BRK.B", "V", "JNJ",
  "WMT", "JPM", "MA", "PG", "UNH", "DIS", "HD", "PYPL", "BAC", "NFLX"
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
  const assetType = searchParams.get("type")?.toUpperCase() || "CRYPTO";

  try {
    // Check if it's a crypto symbol
    const isCrypto = assetType === "CRYPTO" || CRYPTO_SYMBOLS.has(symbol) || (symbol.length <= 5 && !STOCK_SYMBOLS.has(symbol));

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

    // For stocks, use Finnhub
    const apiKey = process.env.FINNHUB_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { 
          error: "Stock data requires API key configuration",
          message: "Add FINNHUB_API_KEY to environment variables for stock data" 
        },
        { status: 400 }
      );
    }

    const { resolution, from, to } = mapTimeRangeToFinnhub(timeRange);
    
    // Fetch stock candles and quote in parallel
    const [candles, quote] = await Promise.all([
      getStockCandles(symbol, apiKey, resolution, from, to),
      getQuote(symbol, apiKey).catch(() => null), // Quote is optional, don't fail if it errors
    ]);

    // Convert to chart format (time already in seconds timestamp)
    const formattedData = candles.map((c) => ({
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
    }));

    return NextResponse.json({
      symbol,
      type: "STOCK",
      data: formattedData,
      ticker: quote ? {
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
      } : {
        price: formattedData[formattedData.length - 1]?.close || 0,
        change: 0,
        changePercent: 0,
      },
    });

  } catch (error) {
    console.error("Chart API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chart data", message: (error as Error).message },
      { status: 500 }
    );
  }
}

