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
        }))
      );

      // Total value will be calculated with current prices if needed
      const totalValue = 0;

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
    
    const errorObj = error as { message?: string; data?: { error?: { details?: { retryDelay?: string }[] } } };
    const errorMessage = errorObj.message || "";
    
    // Handle rate limiting
    if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
      // Try to extract retry delay from error
      let retryDelay = "60";
      try {
        const details = errorObj.data?.error?.details;
        if (details) {
          const retryInfo = details.find((d: Record<string, unknown>) => d["@type"]?.toString().includes("RetryInfo"));
          if (retryInfo && retryInfo.retryDelay) {
            retryDelay = retryInfo.retryDelay.toString().replace("s", "");
          }
        }
      } catch {
        // Use default
      }
      
      return NextResponse.json(
        { error: `Rate limit exceeded. Please wait ${retryDelay} seconds and try again.` },
        { status: 429 }
      );
    }
    
    // Handle API key issues
    if (errorMessage.includes("API key") || errorMessage.includes("API_KEY")) {
      return NextResponse.json(
        { error: "AI service not configured. Please add GOOGLE_GENERATIVE_AI_API_KEY to environment." },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to generate summary. Please try again." },
      { status: 500 }
    );
  }
}

