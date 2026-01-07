import { NextRequest, NextResponse } from "next/server";
import { getCoinsPrice, getCoinsMarkets, symbolToCoinGeckoId, SYMBOL_TO_COINGECKO_ID } from "@/lib/api/coingecko";
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

      // Use getCoinsMarkets for better data (includes images)
      const cacheKey = `portfolio:markets:${coinGeckoIds.sort().join(",")}`;
      let marketsData = await cache.get<Array<{
        id: string;
        symbol: string;
        name: string;
        image: string;
        current_price: number;
        price_change_percentage_24h: number;
      }>>(cacheKey);

      if (!marketsData) {
        try {
          marketsData = await getCoinsMarkets(coinGeckoIds, {
            perPage: coinGeckoIds.length,
            sparkline: false,
            priceChangePercentage: "24h",
          });
          
          // Filter out coins with no price data
          marketsData = marketsData.filter((coin) => coin.current_price > 0);
          
          await cache.set(cacheKey, marketsData, CACHE_TTL.PRICE);
        } catch (error) {
          console.error("Failed to fetch markets data, falling back to simple price:", error);
          // Fallback to simple price API
          try {
            const priceData = await getCoinsPrice(coinGeckoIds, {
              include24hChange: true,
            });
            marketsData = coinGeckoIds
              .filter((id) => priceData[id] && priceData[id].usd > 0)
              .map((id) => {
                const data = priceData[id];
                return {
                  id,
                  symbol: "",
                  name: "",
                  image: "",
                  current_price: data.usd,
                  price_change_percentage_24h: data.usd_24h_change || 0,
                };
              });
          } catch (fallbackError) {
            console.error("Failed to fetch price data:", fallbackError);
            marketsData = [];
          }
        }
      }

      // Create a map of coin ID to market data
      const marketsMap = new Map(
        marketsData.map((m) => [m.id, m])
      );

      const prices = symbols.map((symbol) => {
        const upperSymbol = symbol.toUpperCase();
        const coinId = symbolToId[upperSymbol];
        const marketData = coinId ? marketsMap.get(coinId) : null;

        if (!marketData) {
          return {
            symbol: upperSymbol,
            coinGeckoId: coinId || null,
            name: upperSymbol,
            type: "CRYPTO" as const,
            currentPrice: 0,
            priceChange24h: 0,
            priceChangePercent24h: 0,
            image: undefined,
          };
        }

        return {
          symbol: upperSymbol,
          coinGeckoId: coinId,
          name: marketData.name || upperSymbol,
          type: "CRYPTO" as const,
          currentPrice: marketData.current_price || 0,
          priceChange24h: marketData.current_price && marketData.price_change_percentage_24h
            ? (marketData.current_price * marketData.price_change_percentage_24h) / 100
            : 0,
          priceChangePercent24h: marketData.price_change_percentage_24h || 0,
          image: marketData.image || undefined,
        };
      });

      return NextResponse.json({ prices });
    }

    // Stock prices via Finnhub
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Finnhub API key not configured" }, { status: 500 });
    }

    const prices = await Promise.all(
      symbols.map(async (symbol) => {
        const cacheKey = `stock:${symbol}:quote`;
        let quote = await cache.get<{
          price: number;
          change: number;
          changePercent: number;
        }>(cacheKey);

        if (!quote) {
          try {
            const stockQuote = await getQuote(symbol, apiKey);
            quote = {
              price: stockQuote.price,
              change: stockQuote.change,
              changePercent: stockQuote.changePercent,
            };
            await cache.set(cacheKey, quote, CACHE_TTL.PRICE);
          } catch (error) {
            console.error(`Failed to fetch quote for ${symbol}:`, error);
            quote = {
              price: 0,
              change: 0,
              changePercent: 0,
            };
          }
        }

        return {
          symbol: symbol.toUpperCase(),
          name: symbol.toUpperCase(),
          type: "STOCK" as const,
          currentPrice: quote.price || 0,
          priceChange24h: quote.change || 0,
          priceChangePercent24h: quote.changePercent || 0,
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

