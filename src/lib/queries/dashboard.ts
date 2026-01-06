import { prisma } from "@/lib/prisma";

export async function getPortfolioStats(userId: string) {
  const portfolios = await prisma.portfolio.findMany({
    where: { userId },
    include: {
      assets: true,
    },
  });

  const totalAssets = portfolios.reduce((acc, p) => acc + p.assets.length, 0);

  // Total value will be calculated with current prices from API
  const totalValue = 0;

  return {
    portfolioCount: portfolios.length,
    totalAssets,
    totalValue,
    change: 0,
    changePercent: 0,
  };
}
