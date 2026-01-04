import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePortfolioSummary, generateNewsSummary } from "@/lib/api/gemini";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "portfolio";

  try {
    if (type === "portfolio") {
      // Get user's portfolio
      const portfolios = await prisma.portfolio.findMany({
        where: { userId: session.user.id },
        include: { assets: true },
      });

      if (portfolios.length === 0) {
        return NextResponse.json({
          summary: "You don't have any portfolios yet. Create one to get AI-powered insights!",
        });
      }

      const allAssets = portfolios.flatMap((p) =>
        p.assets.map((a) => ({
          symbol: a.symbol,
          name: a.name || undefined,
          type: a.type as "CRYPTO" | "STOCK",
          quantity: Number(a.quantity),
          avgPrice: Number(a.avgPrice),
        }))
      );

      const totalValue = allAssets.reduce(
        (acc, a) => acc + a.quantity * a.avgPrice,
        0
      );

      const summary = await generatePortfolioSummary({
        assets: allAssets,
        totalValue,
      });

      return NextResponse.json({ summary });
    }

    if (type === "news") {
      // For news summary, we would fetch recent news first
      // This is a placeholder - in production, you'd fetch real news
      const placeholderNews = [
        { title: "Market Update", summary: "Markets showing mixed signals", source: "Financial Times" },
      ];

      const summary = await generateNewsSummary(placeholderNews);
      return NextResponse.json({ summary });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("AI summary error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}

