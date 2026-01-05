import { NextRequest, NextResponse } from "next/server";
import { searchCoins } from "@/lib/api/coingecko";
import { searchSymbol } from "@/lib/api/alphavantage";
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

    // Search stocks via Alpha Vantage
    if (!type || type === "STOCK") {
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
      if (apiKey) {
        const cacheKey = `search:stock:${query.toLowerCase()}`;
        let stockResults = await cache.get<typeof results>(cacheKey);

        if (!stockResults) {
          try {
            const searchResult = await searchSymbol(query, apiKey);
            // Filter to only stocks (exclude ETFs, etc. if needed)
            stockResults = searchResult
              .filter((stock) => stock.type === "Equity" || stock.type === "Common Stock")
              .slice(0, 10)
              .map((stock) => ({
                id: stock.symbol,
                symbol: stock.symbol,
                name: stock.name,
                type: "STOCK" as const,
              }));
            await cache.set(cacheKey, stockResults, 60 * 60); // Cache 1 hour
          } catch (error) {
            console.error("Alpha Vantage search error:", error);
            stockResults = [];
          }
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

