import { prisma } from "@/lib/prisma";

export async function getApiKeys(userId: string) {
  return prisma.apiKey.findMany({
    where: { userId },
    select: {
      id: true,
      platform: true,
      lastSync: true,
      createdAt: true,
    },
  });
}

export async function getBinanceApiKey(userId: string) {
  return prisma.apiKey.findFirst({
    where: {
      userId,
      platform: "BINANCE",
    },
  });
}

