import { NextRequest, NextResponse } from "next/server";
import {
  getCompanyNews,
  getMarketNews,
  getPortfolioNews,
} from "@/lib/api/finnhub";
import { cache, cacheKey, CACHE_TTL } from "@/lib/redis";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol");
  const portfolioId = searchParams.get("portfolioId");
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
    // If portfolioId is provided, fetch news for all assets in that portfolio
    if (portfolioId) {
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Get portfolio with assets
      const portfolio = await prisma.portfolio.findFirst({
        where: {
          id: portfolioId,
          userId: session.user.id,
        },
        include: {
          assets: {
            select: {
              symbol: true,
              type: true,
            },
          },
        },
      });

      if (!portfolio) {
        return NextResponse.json(
          { error: "Portfolio not found" },
          { status: 404 }
        );
      }

      // Get unique stock and crypto symbols
      const stockSymbols = Array.from(
        new Set(
          portfolio.assets
            .filter((asset) => asset.type === "STOCK")
            .map((asset) => asset.symbol)
        )
      );

      const cryptoSymbols = Array.from(
        new Set(
          portfolio.assets
            .filter((asset) => asset.type === "CRYPTO")
            .map((asset) => asset.symbol)
        )
      );

      if (stockSymbols.length === 0 && cryptoSymbols.length === 0) {
        return NextResponse.json({ portfolioId, news: [] });
      }

      // Check cache first
      const cacheKeyStr = `news:portfolio:${portfolioId}:${stockSymbols
        .sort()
        .join(",")}:${cryptoSymbols.sort().join(",")}`;
      const cached = await cache.get<unknown[]>(cacheKeyStr);

      if (cached) {
        return NextResponse.json({ portfolioId, news: cached, cached: true });
      }

      const news = await getPortfolioNews(
        stockSymbols,
        cryptoSymbols,
        apiKey,
        from || undefined,
        to || undefined
      );

      // Cache the result
      await cache.set(cacheKeyStr, news, CACHE_TTL.NEWS);

      return NextResponse.json({ portfolioId, news });
    }

    // Single symbol news
    if (symbol) {
      const symbolType = searchParams.get("symbolType"); // "STOCK" or "CRYPTO"

      // Check cache first
      const cacheKeyStr = cacheKey.news(symbol);
      const cached = await cache.get<unknown[]>(cacheKeyStr);

      if (cached) {
        return NextResponse.json({ symbol, news: cached, cached: true });
      }

      let news;

      if (symbolType === "CRYPTO") {
        // For crypto, get market news and filter by symbol
        const cryptoNews = await getMarketNews(apiKey, "crypto");
        const relatedSymbols = symbol.toUpperCase();
        news = cryptoNews.filter((article) => {
          const articleSymbols = article.symbols.map((s) => s.toUpperCase());
          return articleSymbols.includes(relatedSymbols);
        });
      } else {
        // For stocks, use company news
        news = await getCompanyNews(
          symbol,
          apiKey,
          from || undefined,
          to || undefined
        );
      }

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
      {
        error: error instanceof Error ? error.message : "Failed to fetch news",
      },
      { status: 500 }
    );
  }
}
