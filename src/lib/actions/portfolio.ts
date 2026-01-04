"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const portfolioSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  description: z.string().max(200).optional(),
});

const assetSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").max(20),
  name: z.string().max(100).optional(),
  type: z.enum(["CRYPTO", "STOCK"]),
  quantity: z.number().positive("Quantity must be positive"),
  avgPrice: z.number().positive("Price must be positive"),
  portfolioId: z.string(),
});

async function getSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

// Portfolio actions
export async function createPortfolio(data: { name: string; description?: string }) {
  const session = await getSession();
  const validated = portfolioSchema.parse(data);

  const portfolio = await prisma.portfolio.create({
    data: {
      ...validated,
      userId: session.user.id,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/portfolio");
  return portfolio;
}

export async function updatePortfolio(id: string, data: { name: string; description?: string }) {
  const session = await getSession();
  const validated = portfolioSchema.parse(data);

  const portfolio = await prisma.portfolio.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!portfolio) throw new Error("Portfolio not found");

  const updated = await prisma.portfolio.update({
    where: { id },
    data: validated,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/portfolio");
  return updated;
}

export async function deletePortfolio(id: string) {
  const session = await getSession();

  const portfolio = await prisma.portfolio.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!portfolio) throw new Error("Portfolio not found");

  await prisma.portfolio.delete({ where: { id } });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/portfolio");
}

export async function getPortfolios() {
  const session = await getSession();

  return prisma.portfolio.findMany({
    where: { userId: session.user.id },
    include: {
      assets: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

// Asset actions
export async function addAsset(data: z.infer<typeof assetSchema>) {
  const session = await getSession();
  const validated = assetSchema.parse(data);

  const portfolio = await prisma.portfolio.findFirst({
    where: { id: validated.portfolioId, userId: session.user.id },
  });

  if (!portfolio) throw new Error("Portfolio not found");

  // Check if asset already exists
  const existingAsset = await prisma.asset.findUnique({
    where: {
      portfolioId_symbol: {
        portfolioId: validated.portfolioId,
        symbol: validated.symbol.toUpperCase(),
      },
    },
  });

  if (existingAsset) {
    // Update existing asset (average the price)
    const totalQuantity = Number(existingAsset.quantity) + validated.quantity;
    const totalCost =
      Number(existingAsset.quantity) * Number(existingAsset.avgPrice) +
      validated.quantity * validated.avgPrice;
    const newAvgPrice = totalCost / totalQuantity;

    const updated = await prisma.asset.update({
      where: { id: existingAsset.id },
      data: {
        quantity: totalQuantity,
        avgPrice: newAvgPrice,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/portfolio");
    return updated;
  }

  const asset = await prisma.asset.create({
    data: {
      ...validated,
      symbol: validated.symbol.toUpperCase(),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/portfolio");
  return asset;
}

export async function updateAsset(
  id: string,
  data: { quantity: number; avgPrice: number; name?: string }
) {
  const session = await getSession();

  const asset = await prisma.asset.findFirst({
    where: { id },
    include: { portfolio: true },
  });

  if (!asset || asset.portfolio.userId !== session.user.id) {
    throw new Error("Asset not found");
  }

  const updated = await prisma.asset.update({
    where: { id },
    data: {
      quantity: data.quantity,
      avgPrice: data.avgPrice,
      name: data.name,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/portfolio");
  return updated;
}

export async function deleteAsset(id: string) {
  const session = await getSession();

  const asset = await prisma.asset.findFirst({
    where: { id },
    include: { portfolio: true },
  });

  if (!asset || asset.portfolio.userId !== session.user.id) {
    throw new Error("Asset not found");
  }

  await prisma.asset.delete({ where: { id } });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/portfolio");
}

