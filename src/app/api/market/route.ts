import { NextRequest, NextResponse } from "next/server";
import { getStockQuote, getStockHistory } from "@/lib/api/alphavantage";
import { getBinancePrice, getBinanceKlines } from "@/lib/api/binance";
import { cache, cacheKey, CACHE_TTL } from "@/lib/redis";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol");
  const type = searchParams.get("type") || "CRYPTO";
  const action = searchParams.get("action") || "quote";

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  try {
    if (type === "CRYPTO") {
      if (action === "history") {
        const interval = searchParams.get("interval") || "1d";
        const limit = parseInt(searchParams.get("limit") || "100");

        // Cache key for history
        const historyCacheKey = `${cacheKey.price(symbol)}:history:${interval}:${limit}`;
        const cached = await cache.get<unknown[]>(historyCacheKey);

        if (cached) {
          return NextResponse.json({ symbol, data: cached, cached: true });
        }

        const klines = await getBinanceKlines(symbol, interval, limit);
        const data = klines.map((k) => ({
          time: new Date(k.openTime).toISOString().split("T")[0],
          open: parseFloat(k.open),
          high: parseFloat(k.high),
          low: parseFloat(k.low),
          close: parseFloat(k.close),
          volume: parseFloat(k.volume),
        }));

        await cache.set(historyCacheKey, data, CACHE_TTL.MARKET);

        return NextResponse.json({ symbol, data });
      }

      // Quote with cache
      const quoteCacheKey = cacheKey.price(symbol);
      const cached = await cache.get<string>(quoteCacheKey);

      if (cached) {
        return NextResponse.json({ symbol, price: cached, type: "CRYPTO", cached: true });
      }

      const price = await getBinancePrice(symbol);
      await cache.set(quoteCacheKey, price, CACHE_TTL.PRICE);

      return NextResponse.json({ symbol, price, type: "CRYPTO" });
    }

    // Stock data from Alpha Vantage
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Alpha Vantage API key not configured" },
        { status: 500 }
      );
    }

    if (action === "history") {
      const historyCacheKey = `stock:${symbol}:history`;
      const cached = await cache.get<unknown[]>(historyCacheKey);

      if (cached) {
        return NextResponse.json({ symbol, data: cached, cached: true });
      }

      const history = await getStockHistory(symbol, apiKey);
      await cache.set(historyCacheKey, history, CACHE_TTL.MARKET);

      return NextResponse.json({ symbol, data: history });
    }

    // Stock quote with cache
    const quoteCacheKey = `stock:${symbol}:quote`;
    const cached = await cache.get<Record<string, unknown>>(quoteCacheKey);

    if (cached) {
      return NextResponse.json({ symbol, ...cached, type: "STOCK", cached: true });
    }

    const quote = await getStockQuote(symbol, apiKey);
    await cache.set(quoteCacheKey, quote, CACHE_TTL.PRICE);

    return NextResponse.json({ symbol, ...quote, type: "STOCK" });
  } catch (error) {
    console.error("Market API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch data" },
      { status: 500 }
    );
  }
}
