import { prisma } from "@/lib/prisma";

export async function getUserSymbols(userId: string) {
  const portfolios = await prisma.portfolio.findMany({
    where: { userId },
    include: {
      assets: {
        select: { symbol: true, type: true },
      },
    },
  });

  const symbols = new Set<string>();
  portfolios.forEach((p) => {
    p.assets.forEach((a) => {
      // Only add stock symbols for news (crypto news handled differently)
      if (a.type === "STOCK") {
        symbols.add(a.symbol);
      }
    });
  });

  return Array.from(symbols);
}

export async function getUserPortfolios(userId: string) {
  return prisma.portfolio.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      description: true,
      assets: {
        select: {
          symbol: true,
          type: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserDefaultNewsPortfolio(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      defaultNewsPortfolioId: true,
    },
  });

  if (!user?.defaultNewsPortfolioId) {
    return null;
  }

  return prisma.portfolio.findFirst({
    where: {
      id: user.defaultNewsPortfolioId,
      userId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      assets: {
        select: {
          symbol: true,
          type: true,
        },
      },
    },
  });
}

export async function getUserAssetSymbols(userId: string) {
  const portfolios = await prisma.portfolio.findMany({
    where: { userId },
    include: {
      assets: {
        select: { symbol: true, type: true, name: true },
      },
    },
  });

  const assets: Array<{ symbol: string; type: string; name: string | null }> = [];
  const seen = new Set<string>();

  portfolios.forEach((p) => {
    p.assets.forEach((a) => {
      if (!seen.has(a.symbol)) {
        seen.add(a.symbol);
        assets.push({ symbol: a.symbol, type: a.type, name: a.name });
      }
    });
  });

  return assets;
}

