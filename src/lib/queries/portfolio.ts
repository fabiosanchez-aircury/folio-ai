import { prisma } from "@/lib/prisma";

export async function getPortfolios(userId: string) {
  return prisma.portfolio.findMany({
    where: { userId },
    include: {
      assets: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPortfolioById(portfolioId: string, userId: string) {
  return prisma.portfolio.findFirst({
    where: {
      id: portfolioId,
      userId,
    },
    include: {
      assets: true,
    },
  });
}

export async function getPortfolioWithAssets(portfolioId: string) {
  return prisma.portfolio.findUnique({
    where: { id: portfolioId },
    include: {
      assets: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
