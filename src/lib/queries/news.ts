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

