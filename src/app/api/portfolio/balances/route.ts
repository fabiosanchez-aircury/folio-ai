import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPortfolioHoldings } from "@/lib/queries/orders";
import { getCoinsPrice, symbolToCoinGeckoId } from "@/lib/api/coingecko";
import { getQuote } from "@/lib/api/finnhub";
import { cache, CACHE_TTL } from "@/lib/redis";

interface BalanceData {
  symbol: string;
  name: string | null;
  type: "CRYPTO" | "STOCK";
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  profitLoss: number;
  profitLossPercent: number;
}

interface PortfolioBalance {
  id: string;
  name: string;
  totalValue: number;
  totalCost: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  balances: BalanceData[];
}

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const portfolioBalances: PortfolioBalance[] = [];

    // Get all portfolios with assets (for Total Value calculation)
    const portfoliosWithAssets = await prisma.portfolio.findMany({
      where: { userId: session.user.id },
      include: {
        assets: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Collect all unique symbols by type for price fetching FROM ASSETS
    const cryptoSymbols = new Set<string>();
    const stockSymbols = new Set<string>();

    portfoliosWithAssets.forEach((p) => {
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
        let priceData = await cache.get<Record<string, { usd: number }>>(
          cacheKey
        );

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

    // Calculate balances for each portfolio
    for (const portfolio of portfoliosWithAssets) {
      // Get all BUY orders to calculate total cost
      const buyOrders = await prisma.order.findMany({
        where: {
          portfolioId: portfolio.id,
          orderType: "BUY",
        },
      });

      // Calculate total cost from BUY orders only
      const totalCost = buyOrders.reduce((sum, order) => {
        return sum + Number(order.quantity) * Number(order.price);
      }, 0);

      const balances: BalanceData[] = [];
      let totalValue = 0;

      // Calculate Total Value ONLY from actual assets (exactly like /portfolio/values)
      for (const asset of portfolio.assets) {
        const quantity = Number(asset.quantity);

        const currentPrice =
          asset.type === "CRYPTO"
            ? cryptoPrices[asset.symbol] || 0
            : stockPrices[asset.symbol] || 0;

        // Skip if no current price available
        if (currentPrice === 0) {
          continue;
        }

        const currentValue = quantity * currentPrice;
        totalValue += currentValue;

        // Cost basis for this symbol (from orders)
        const symbolBuyOrders = buyOrders.filter(
          (o) => o.symbol.toUpperCase() === asset.symbol.toUpperCase()
        );
        const costBasis = symbolBuyOrders.reduce(
          (sum, o) => sum + Number(o.quantity) * Number(o.price),
          0
        );

        // Calculate avgPrice from orders for this symbol
        const totalOrderQuantity = symbolBuyOrders.reduce(
          (sum, o) => sum + Number(o.quantity),
          0
        );
        const avgPrice =
          totalOrderQuantity > 0 ? costBasis / totalOrderQuantity : 0;

        const profitLoss = currentValue - costBasis;
        const profitLossPercent =
          costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;

        balances.push({
          symbol: asset.symbol.toUpperCase(),
          name: asset.name,
          type: asset.type as "CRYPTO" | "STOCK",
          quantity,
          avgPrice,
          currentPrice,
          currentValue,
          costBasis,
          profitLoss,
          profitLossPercent,
        });
      }

      const totalProfitLoss = totalValue - totalCost;
      const totalProfitLossPercent =
        totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

      portfolioBalances.push({
        id: portfolio.id,
        name: portfolio.name,
        totalValue,
        totalCost,
        totalProfitLoss,
        totalProfitLossPercent,
        balances,
      });
    }

    // Calculate totals
    const totalValue = portfolioBalances.reduce(
      (sum, p) => sum + p.totalValue,
      0
    );
    const totalCost = portfolioBalances.reduce(
      (sum, p) => sum + p.totalCost,
      0
    );
    const totalProfitLoss = totalValue - totalCost;
    const totalProfitLossPercent =
      totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

    return NextResponse.json({
      portfolios: portfolioBalances,
      summary: {
        totalValue,
        totalCost,
        totalProfitLoss,
        totalProfitLossPercent,
        portfolioCount: portfoliosWithAssets.length,
        assetCount: portfoliosWithAssets.reduce(
          (sum, p) => sum + p.assets.length,
          0
        ),
      },
    });
  } catch (error) {
    console.error("Portfolio balances error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to calculate balances",
      },
      { status: 500 }
    );
  }
}
