import { NextRequest, NextResponse } from "next/server";
import { getQuote, getStockCandles, mapTimeRangeToFinnhub } from "@/lib/api/finnhub";
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

    // Stock data from Finnhub
    const apiKey = process.env.FINNHUB_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Finnhub API key not configured" },
        { status: 500 }
      );
    }

    if (action === "history") {
      const timeRange = searchParams.get("timeRange") || "3M";
      const { resolution, from, to } = mapTimeRangeToFinnhub(timeRange);
      const historyCacheKey = `stock:${symbol}:history:${timeRange}`;
      const cached = await cache.get<unknown[]>(historyCacheKey);

      if (cached) {
        return NextResponse.json({ symbol, data: cached, cached: true });
      }

      const candles = await getStockCandles(symbol, apiKey, resolution, from, to);
      const history = candles.map((c) => ({
        time: new Date(c.time * 1000).toISOString().split("T")[0],
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      }));
      await cache.set(historyCacheKey, history, CACHE_TTL.MARKET);

      return NextResponse.json({ symbol, data: history });
    }

    // Stock quote with cache
    const quoteCacheKey = `stock:${symbol}:quote`;
    const cached = await cache.get<Record<string, unknown>>(quoteCacheKey);

    if (cached) {
      return NextResponse.json({ symbol, ...cached, type: "STOCK", cached: true });
    }

    const quote = await getQuote(symbol, apiKey);
    const quoteData = {
      symbol: quote.symbol,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      open: quote.open,
      high: quote.high,
      low: quote.low,
      previousClose: quote.previousClose,
    };
    await cache.set(quoteCacheKey, quoteData, CACHE_TTL.PRICE);

    return NextResponse.json({ symbol, ...quoteData, type: "STOCK" });
  } catch (error) {
    console.error("Market API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch data" },
      { status: 500 }
    );
  }
}
