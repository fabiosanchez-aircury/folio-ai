import { NextRequest, NextResponse } from "next/server";
import { searchCoins } from "@/lib/api/coingecko";
import { symbolSearch } from "@/lib/api/finnhub";
import { cache } from "@/lib/redis";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const type = searchParams.get("type"); // "CRYPTO", "STOCK", or undefined for both

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results: Array<{
      id: string;
      symbol: string;
      name: string;
      type: "CRYPTO" | "STOCK";
      image?: string;
    }> = [];

    // Search crypto via CoinGecko
    if (!type || type === "CRYPTO") {
      const cacheKey = `search:crypto:${query.toLowerCase()}`;
      let cryptoResults = await cache.get<typeof results>(cacheKey);

      if (!cryptoResults) {
        try {
          const searchResult = await searchCoins(query);
          cryptoResults = searchResult.coins
            .slice(0, 15) // Get more results to filter
            .map((coin) => ({
              id: coin.id,
              symbol: coin.symbol.toUpperCase(),
              name: coin.name,
              type: "CRYPTO" as const,
              // Use large image if available, fallback to thumb
              image: coin.large || coin.thumb || undefined,
            }))
            .slice(0, 10); // Return top 10
          await cache.set(cacheKey, cryptoResults, 60 * 60); // Cache 1 hour
        } catch (error) {
          console.error("CoinGecko search error:", error);
          cryptoResults = [];
        }
      }

      results.push(...cryptoResults);
    }

    // Search stocks via Finnhub
    if (!type || type === "STOCK") {
      const apiKey = process.env.FINNHUB_API_KEY;
      if (apiKey) {
        const cacheKey = `search:stock:${query.toLowerCase()}`;
        let stockResults = await cache.get<typeof results>(cacheKey);

        if (!stockResults) {
          const searchResult = await symbolSearch(query, apiKey);
          stockResults = searchResult.result.slice(0, 10).map((stock) => ({
            id: stock.symbol,
            symbol: stock.symbol,
            name: stock.description,
            type: "STOCK" as const,
          }));
          await cache.set(cacheKey, stockResults, 60 * 60); // Cache 1 hour
        }

        results.push(...stockResults);
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 }
    );
  }
}

