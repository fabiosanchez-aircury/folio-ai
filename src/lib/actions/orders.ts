"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const orderSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").max(20),
  name: z.string().max(100).optional(),
  type: z.enum(["CRYPTO", "STOCK"]),
  orderType: z.enum(["BUY", "SELL"]),
  quantity: z.number().positive("Quantity must be positive"),
  price: z.number().positive("Price must be positive"),
  portfolioId: z.string(),
  executedAt: z.date().optional(),
  notes: z.string().max(500).optional(),
});

async function getSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

export async function createOrder(data: z.infer<typeof orderSchema>) {
  const session = await getSession();
  const validated = orderSchema.parse(data);

  // Verify portfolio belongs to user
  const portfolio = await prisma.portfolio.findFirst({
    where: {
      id: validated.portfolioId,
      userId: session.user.id,
    },
  });

  if (!portfolio) throw new Error("Portfolio not found");

  const order = await prisma.order.create({
    data: {
      symbol: validated.symbol.toUpperCase(),
      name: validated.name,
      type: validated.type,
      orderType: validated.orderType,
      quantity: validated.quantity,
      price: validated.price,
      portfolioId: validated.portfolioId,
      executedAt: validated.executedAt || new Date(),
      notes: validated.notes,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/portfolio");
  return order;
}

export async function updateOrder(
  id: string,
  data: {
    quantity?: number;
    price?: number;
    executedAt?: Date;
    notes?: string;
  }
) {
  const session = await getSession();

  const order = await prisma.order.findFirst({
    where: { id },
    include: { portfolio: true },
  });

  if (!order || order.portfolio.userId !== session.user.id) {
    throw new Error("Order not found");
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      quantity: data.quantity,
      price: data.price,
      executedAt: data.executedAt,
      notes: data.notes,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/portfolio");
  return updated;
}

export async function deleteOrder(id: string) {
  const session = await getSession();

  const order = await prisma.order.findFirst({
    where: { id },
    include: { portfolio: true },
  });

  if (!order || order.portfolio.userId !== session.user.id) {
    throw new Error("Order not found");
  }

  await prisma.order.delete({ where: { id } });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/portfolio");
}

export async function getOrders(portfolioId: string) {
  const session = await getSession();

  // Verify portfolio belongs to user
  const portfolio = await prisma.portfolio.findFirst({
    where: {
      id: portfolioId,
      userId: session.user.id,
    },
  });

  if (!portfolio) throw new Error("Portfolio not found");

  return prisma.order.findMany({
    where: { portfolioId },
    orderBy: { executedAt: "desc" },
  });
}

