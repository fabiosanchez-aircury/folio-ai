import { NextRequest, NextResponse } from "next/server";
import { getCoinsMarkets } from "@/lib/api/coingecko";
import { searchSymbol } from "@/lib/api/alphavantage";
import { cache, CACHE_TTL } from "@/lib/redis";

// Popular cryptos (CoinGecko IDs)
const POPULAR_CRYPTO_IDS = [
  "bitcoin",
  "ethereum",
  "binancecoin",
  "solana",
  "ripple",
  "cardano",
  "avalanche-2",
  "dogecoin",
  "polkadot",
  "chainlink",
];

// Popular stocks (symbols)
const POPULAR_STOCK_SYMBOLS = [
  "AAPL", // Apple
  "MSFT", // Microsoft
  "GOOGL", // Google
  "AMZN", // Amazon
  "TSLA", // Tesla
  "META", // Meta
  "NVDA", // NVIDIA
  "JPM", // JPMorgan
  "V", // Visa
  "JNJ", // Johnson & Johnson
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "CRYPTO";

  try {
    if (type === "CRYPTO") {
      const cacheKey = "portfolio:popular:crypto";
      let results = await cache.get<Array<{
        id: string;
        symbol: string;
        name: string;
        type: "CRYPTO";
        image?: string;
      }>>(cacheKey);

      if (!results) {
        const markets = await getCoinsMarkets(POPULAR_CRYPTO_IDS, {
          perPage: POPULAR_CRYPTO_IDS.length,
          sparkline: false,
        });

        results = markets.map((coin) => ({
          id: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          type: "CRYPTO" as const,
          image: coin.image,
        }));

        await cache.set(cacheKey, results, 60 * 60); // Cache 1 hour
      }

      return NextResponse.json({ results });
    }

    // Stocks
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Alpha Vantage API key not configured" }, { status: 500 });
    }

    const cacheKey = "portfolio:popular:stocks";
    let results = await cache.get<Array<{
      id: string;
      symbol: string;
      name: string;
      type: "STOCK";
    }>>(cacheKey);

    if (!results) {
      // Search for each stock symbol
      const stockResults = await Promise.all(
        POPULAR_STOCK_SYMBOLS.map(async (symbol) => {
          try {
            const searchResult = await searchSymbol(symbol, apiKey);
            const stock = searchResult.find(
              (s) => s.symbol === symbol && (s.type === "Equity" || s.type === "Common Stock")
            );
            if (stock) {
              return {
                id: stock.symbol,
                symbol: stock.symbol,
                name: stock.name,
                type: "STOCK" as const,
              };
            }
            return null;
          } catch {
            return null;
          }
        })
      );

      results = stockResults.filter((r): r is NonNullable<typeof r> => r !== null);
      await cache.set(cacheKey, results, 60 * 60); // Cache 1 hour
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Popular assets error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch popular assets" },
      { status: 500 }
    );
  }
}

