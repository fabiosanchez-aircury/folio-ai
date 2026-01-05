import { NextRequest, NextResponse } from "next/server";
import { getCoinsPrice, symbolToCoinGeckoId, SYMBOL_TO_COINGECKO_ID } from "@/lib/api/coingecko";
import { getQuote } from "@/lib/api/finnhub";
import { cache, CACHE_TTL } from "@/lib/redis";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbols = searchParams.get("symbols")?.split(",") || [];
  const type = searchParams.get("type") || "CRYPTO";

  if (symbols.length === 0) {
    return NextResponse.json({ error: "Symbols required" }, { status: 400 });
  }

  try {
    if (type === "CRYPTO") {
      // Convert symbols to CoinGecko IDs
      const coinGeckoIds: string[] = [];
      const symbolToId: Record<string, string> = {};

      for (const symbol of symbols) {
        const id = symbolToCoinGeckoId(symbol.toUpperCase());
        if (id) {
          coinGeckoIds.push(id);
          symbolToId[symbol.toUpperCase()] = id;
        }
      }

      if (coinGeckoIds.length === 0) {
        return NextResponse.json({ prices: [] });
      }

      // Check cache
      const cacheKey = `portfolio:prices:${coinGeckoIds.sort().join(",")}`;
      const cached = await cache.get<Record<string, { usd: number; usd_24h_change?: number }>>(cacheKey);

      let priceData = cached;
      if (!priceData) {
        priceData = await getCoinsPrice(coinGeckoIds, {
          include24hChange: true,
        });
        await cache.set(cacheKey, priceData, CACHE_TTL.PRICE);
      }

      const prices = symbols.map((symbol) => {
        const upperSymbol = symbol.toUpperCase();
        const coinId = symbolToId[upperSymbol];
        const data = coinId ? priceData![coinId] : null;

        return {
          symbol: upperSymbol,
          coinGeckoId: coinId,
          name: Object.entries(SYMBOL_TO_COINGECKO_ID).find(([s]) => s === upperSymbol)?.[1] || upperSymbol,
          type: "CRYPTO" as const,
          currentPrice: data?.usd || 0,
          priceChange24h: data?.usd_24h_change ? (data.usd * data.usd_24h_change) / 100 : 0,
          priceChangePercent24h: data?.usd_24h_change || 0,
        };
      });

      return NextResponse.json({ prices, cached: !!cached });
    }

    // Stock prices via Finnhub
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Finnhub API key not configured" }, { status: 500 });
    }

    const prices = await Promise.all(
      symbols.map(async (symbol) => {
        const cacheKey = `stock:${symbol}:quote`;
        let quote = await cache.get<{ c: number; d: number; dp: number }>(cacheKey);

        if (!quote) {
          quote = await getQuote(symbol, apiKey);
          await cache.set(cacheKey, quote, CACHE_TTL.PRICE);
        }

        return {
          symbol: symbol.toUpperCase(),
          name: symbol.toUpperCase(),
          type: "STOCK" as const,
          currentPrice: quote.c || 0,
          priceChange24h: quote.d || 0,
          priceChangePercent24h: quote.dp || 0,
        };
      })
    );

    return NextResponse.json({ prices });
  } catch (error) {
    console.error("Portfolio prices error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch prices" },
      { status: 500 }
    );
  }
}

