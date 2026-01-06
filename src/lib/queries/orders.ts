import { prisma } from "@/lib/prisma";

export async function getOrdersByPortfolio(portfolioId: string) {
  return prisma.order.findMany({
    where: { portfolioId },
    orderBy: { executedAt: "desc" },
  });
}

export async function getOrdersBySymbol(portfolioId: string, symbol: string) {
  return prisma.order.findMany({
    where: {
      portfolioId,
      symbol: symbol.toUpperCase(),
    },
    orderBy: { executedAt: "desc" },
  });
}

export async function getOrderById(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: { portfolio: true },
  });
}

/**
 * Calculate average purchase price for a symbol based on BUY orders
 */
export async function getAveragePurchasePrice(
  portfolioId: string,
  symbol: string
): Promise<number> {
  const buyOrders = await prisma.order.findMany({
    where: {
      portfolioId,
      symbol: symbol.toUpperCase(),
      orderType: "BUY",
    },
  });

  if (buyOrders.length === 0) return 0;

  let totalCost = 0;
  let totalQuantity = 0;

  buyOrders.forEach((order) => {
    const qty = Number(order.quantity);
    const price = Number(order.price);
    totalCost += qty * price;
    totalQuantity += qty;
  });

  return totalQuantity > 0 ? totalCost / totalQuantity : 0;
}

/**
 * Calculate current holdings from orders
 * Returns a map of symbol -> { quantity, avgPrice, name, type }
 */
export async function getPortfolioHoldings(portfolioId: string) {
  const orders = await prisma.order.findMany({
    where: { portfolioId },
    orderBy: { executedAt: "asc" },
  });

  const holdings = new Map<
    string,
    {
      quantity: number;
      avgPrice: number;
      name: string | null;
      type: "CRYPTO" | "STOCK";
    }
  >();

  orders.forEach((order) => {
    const symbol = order.symbol.toUpperCase();
    const current = holdings.get(symbol) || {
      quantity: 0,
      avgPrice: 0,
      name: order.name,
      type: order.type as "CRYPTO" | "STOCK",
    };

    const qty = Number(order.quantity);
    const price = Number(order.price);

    if (order.orderType === "BUY") {
      // Calculate weighted average price
      const totalCost = current.quantity * current.avgPrice + qty * price;
      const totalQuantity = current.quantity + qty;
      holdings.set(symbol, {
        quantity: totalQuantity,
        avgPrice: totalQuantity > 0 ? totalCost / totalQuantity : price,
        name: order.name || current.name,
        type: current.type,
      });
    } else if (order.orderType === "SELL") {
      // Reduce quantity (FIFO or average cost basis)
      // For simplicity, we'll use average cost basis
      const remainingQuantity = current.quantity - qty;
      holdings.set(symbol, {
        quantity: Math.max(0, remainingQuantity),
        avgPrice: current.avgPrice, // Keep same avg price
        name: current.name,
        type: current.type,
      });
    }
  });

  return holdings;
}

