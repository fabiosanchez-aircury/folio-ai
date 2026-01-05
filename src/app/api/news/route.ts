import { NextRequest, NextResponse } from "next/server";
import { getCompanyNews, getMarketNews } from "@/lib/api/finnhub";
import { cache, cacheKey, CACHE_TTL } from "@/lib/redis";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol");
  const category = searchParams.get("category") || "general";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Finnhub API key not configured" },
      { status: 500 }
    );
  }

  try {
    if (symbol) {
      // Check cache first
      const cacheKeyStr = cacheKey.news(symbol);
      const cached = await cache.get<unknown[]>(cacheKeyStr);

      if (cached) {
        return NextResponse.json({ symbol, news: cached, cached: true });
      }

      const news = await getCompanyNews(
        symbol,
        apiKey,
        from || undefined,
        to || undefined
      );

      // Cache the result
      await cache.set(cacheKeyStr, news, CACHE_TTL.NEWS);

      return NextResponse.json({ symbol, news });
    }

    // Market news with cache
    const marketCacheKey = `news:market:${category}`;
    const cached = await cache.get<unknown[]>(marketCacheKey);

    if (cached) {
      return NextResponse.json({ category, news: cached, cached: true });
    }

    const news = await getMarketNews(apiKey, category);
    await cache.set(marketCacheKey, news, CACHE_TTL.NEWS);

    return NextResponse.json({ category, news });
  } catch (error) {
    console.error("News API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch news" },
      { status: 500 }
    );
  }
}
