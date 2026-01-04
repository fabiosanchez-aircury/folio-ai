"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getBinanceBalances, getBinancePrices } from "@/lib/api/binance";

async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function saveApiKey(data: {
  platform: "BINANCE";
  apiKey: string;
  apiSecret: string;
}) {
  const session = await getSession();

  // Test the API key first
  try {
    await getBinanceBalances(data.apiKey, data.apiSecret);
  } catch (error) {
    throw new Error("Invalid API credentials. Please check your keys.");
  }

  // Upsert the API key
  await prisma.apiKey.upsert({
    where: {
      userId_platform: {
        userId: session.user.id,
        platform: data.platform,
      },
    },
    update: {
      apiKey: data.apiKey,
      apiSecret: data.apiSecret,
    },
    create: {
      platform: data.platform,
      apiKey: data.apiKey,
      apiSecret: data.apiSecret,
      userId: session.user.id,
    },
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function deleteApiKey(platform: "BINANCE") {
  const session = await getSession();

  await prisma.apiKey.deleteMany({
    where: {
      userId: session.user.id,
      platform,
    },
  });

  revalidatePath("/dashboard/settings");
}

export async function getConnectedPlatforms() {
  const session = await getSession();

  const apiKeys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    select: {
      platform: true,
      lastSync: true,
      createdAt: true,
    },
  });

  return apiKeys;
}

export async function syncBinancePortfolio() {
  const session = await getSession();

  const apiKey = await prisma.apiKey.findFirst({
    where: {
      userId: session.user.id,
      platform: "BINANCE",
    },
  });

  if (!apiKey) {
    throw new Error("Binance not connected");
  }

  // Get balances and prices
  const [balances, prices] = await Promise.all([
    getBinanceBalances(apiKey.apiKey, apiKey.apiSecret),
    getBinancePrices(),
  ]);

  // Find or create Binance portfolio
  let portfolio = await prisma.portfolio.findFirst({
    where: {
      userId: session.user.id,
      name: "Binance",
    },
  });

  if (!portfolio) {
    portfolio = await prisma.portfolio.create({
      data: {
        name: "Binance",
        description: "Synced from Binance",
        userId: session.user.id,
      },
    });
  }

  // Sync assets
  for (const balance of balances) {
    if (balance.total < 0.00000001) continue;

    const price = prices.get(balance.asset) || 0;

    await prisma.asset.upsert({
      where: {
        portfolioId_symbol: {
          portfolioId: portfolio.id,
          symbol: balance.asset,
        },
      },
      update: {
        quantity: balance.total,
        avgPrice: price,
      },
      create: {
        symbol: balance.asset,
        type: "CRYPTO",
        quantity: balance.total,
        avgPrice: price,
        portfolioId: portfolio.id,
      },
    });
  }

  // Update last sync time
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastSync: new Date() },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/portfolio");

  return { success: true, assetsCount: balances.length };
}

