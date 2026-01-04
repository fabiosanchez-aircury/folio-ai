import { NextRequest, NextResponse } from "next/server";
import { getCompanyNews, getMarketNews } from "@/lib/api/finnhub";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol");
  const category = searchParams.get("category") || "general";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Finnhub API key not configured" },
      { status: 500 }
    );
  }

  try {
    if (symbol) {
      const news = await getCompanyNews(
        symbol,
        apiKey,
        from || undefined,
        to || undefined
      );
      return NextResponse.json({ symbol, news });
    }

    const news = await getMarketNews(apiKey, category);
    return NextResponse.json({ category, news });
  } catch (error) {
    console.error("News API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch news" },
      { status: 500 }
    );
  }
}

