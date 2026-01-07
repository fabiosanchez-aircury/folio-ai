"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

export async function updateDefaultNewsPortfolio(portfolioId: string | null) {
  const session = await getSession();

  await prisma.user.update({
    where: { id: session.user.id },
    data: { defaultNewsPortfolioId: portfolioId },
  });

  revalidatePath("/dashboard/news");
  return { success: true };
}

