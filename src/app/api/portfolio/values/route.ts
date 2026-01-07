import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCoinsPrice, symbolToCoinGeckoId } from "@/lib/api/coingecko";
import { getQuote } from "@/lib/api/finnhub";
import { cache, CACHE_TTL } from "@/lib/redis";

interface PortfolioWithValues {
  id: string;
  name: string;
  totalValue: number;
  assets: Array<{
    id: string;
    symbol: string;
    name: string | null;
    type: string;
    quantity: number;
    currentPrice: number;
    currentValue: number;
  }>;
}

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all portfolios with assets
    const portfolios = await prisma.portfolio.findMany({
      where: { userId: session.user.id },
      include: {
        assets: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Collect all unique symbols by type
    const cryptoSymbols = new Set<string>();
    const stockSymbols = new Set<string>();

    portfolios.forEach((p) => {
      p.assets.forEach((a) => {
        if (a.type === "CRYPTO") {
          cryptoSymbols.add(a.symbol);
        } else {
          stockSymbols.add(a.symbol);
        }
      });
    });

    // Fetch crypto prices from CoinGecko
    const cryptoPrices: Record<string, number> = {};
    if (cryptoSymbols.size > 0) {
      const coinGeckoIds: string[] = [];
      const symbolToId: Record<string, string> = {};

      cryptoSymbols.forEach((symbol) => {
        const id = symbolToCoinGeckoId(symbol);
        if (id) {
          coinGeckoIds.push(id);
          symbolToId[symbol] = id;
        }
      });

      if (coinGeckoIds.length > 0) {
        const cacheKey = `portfolio:prices:${coinGeckoIds.sort().join(",")}`;
        let priceData = await cache.get<Record<string, { usd: number }>>(cacheKey);

        if (!priceData) {
          priceData = await getCoinsPrice(coinGeckoIds);
          await cache.set(cacheKey, priceData, CACHE_TTL.PRICE);
        }

        cryptoSymbols.forEach((symbol) => {
          const coinId = symbolToId[symbol];
          if (coinId && priceData![coinId]) {
            cryptoPrices[symbol] = priceData![coinId].usd;
          }
        });
      }
    }

    // Fetch stock prices from Finnhub
    const stockPrices: Record<string, number> = {};
    const apiKey = process.env.FINNHUB_API_KEY;

    if (stockSymbols.size > 0 && apiKey) {
      await Promise.all(
        Array.from(stockSymbols).map(async (symbol) => {
          const cacheKey = `stock:${symbol}:price`;
          let price = await cache.get<number>(cacheKey);

          if (price === null) {
            try {
              const quote = await getQuote(symbol, apiKey);
              price = quote.price || 0;
              await cache.set(cacheKey, price, CACHE_TTL.PRICE);
            } catch (error) {
              console.error(`Failed to fetch price for ${symbol}:`, error);
              price = 0;
            }
          }

          stockPrices[symbol] = price;
        })
      );
    }

    // Calculate portfolio values
    const portfoliosWithValues: PortfolioWithValues[] = portfolios.map((portfolio) => {
      let totalValue = 0;

      const assetsWithValues = portfolio.assets.map((asset) => {
        const quantity = Number(asset.quantity);

        const currentPrice =
          asset.type === "CRYPTO"
            ? cryptoPrices[asset.symbol] || 0
            : stockPrices[asset.symbol] || 0;

        const currentValue = quantity * currentPrice;
        totalValue += currentValue;

        return {
          id: asset.id,
          symbol: asset.symbol,
          name: asset.name,
          type: asset.type,
          quantity,
          currentPrice,
          currentValue,
        };
      });

      return {
        id: portfolio.id,
        name: portfolio.name,
        totalValue,
        assets: assetsWithValues,
      };
    });

    // Calculate totals
    const totalValue = portfoliosWithValues.reduce((sum, p) => sum + p.totalValue, 0);

    return NextResponse.json({
      portfolios: portfoliosWithValues,
      summary: {
        totalValue,
        portfolioCount: portfolios.length,
        assetCount: portfolios.reduce((sum, p) => sum + p.assets.length, 0),
      },
    });
  } catch (error) {
    console.error("Portfolio values error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to calculate values" },
      { status: 500 }
    );
  }
}

