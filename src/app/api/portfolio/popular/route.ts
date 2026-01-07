import { NextRequest, NextResponse } from "next/server";
import { getCoinsMarkets } from "@/lib/api/coingecko";
import { getCompanyProfile } from "@/lib/api/finnhub";
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
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Finnhub API key not configured" }, { status: 500 });
    }

    const cacheKey = "portfolio:popular:stocks";
    let results = await cache.get<Array<{
      id: string;
      symbol: string;
      name: string;
      type: "STOCK";
    }>>(cacheKey);

    if (!results) {
      // Get company profile for each popular stock to get names
      const stockResults = await Promise.all(
        POPULAR_STOCK_SYMBOLS.map(async (symbol) => {
          try {
            const company = await getCompanyProfile(symbol, apiKey);
            return {
              id: symbol,
              symbol: symbol,
              name: company.name,
              type: "STOCK" as const,
            };
          } catch {
            // Fallback to symbol if company profile fails
            return {
              id: symbol,
              symbol: symbol,
              name: symbol,
              type: "STOCK" as const,
            };
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

