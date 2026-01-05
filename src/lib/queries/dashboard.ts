import { prisma } from "@/lib/prisma";

export async function getPortfolioStats(userId: string) {
  const portfolios = await prisma.portfolio.findMany({
    where: { userId },
    include: {
      assets: true,
    },
  });

  const totalAssets = portfolios.reduce((acc, p) => acc + p.assets.length, 0);

  // Calculate total value (placeholder - will be updated with real prices)
  let totalValue = 0;
  let totalCost = 0;

  portfolios.forEach((portfolio) => {
    portfolio.assets.forEach((asset) => {
      const quantity = Number(asset.quantity);
      const avgPrice = Number(asset.avgPrice);
      totalCost += quantity * avgPrice;
      // For now, use avgPrice as current price (will update with API)
      totalValue += quantity * avgPrice;
    });
  });

  const change = totalValue - totalCost;
  const changePercent = totalCost > 0 ? (change / totalCost) * 100 : 0;

  return {
    portfolioCount: portfolios.length,
    totalAssets,
    totalValue,
    change,
    changePercent,
  };
}
