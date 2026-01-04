import { NextRequest, NextResponse } from "next/server";
import { getStockQuote, getStockHistory } from "@/lib/api/alphavantage";
import { getBinancePrice, getBinanceKlines } from "@/lib/api/binance";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol");
  const type = searchParams.get("type") || "CRYPTO";
  const action = searchParams.get("action") || "quote";

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  try {
    if (type === "CRYPTO") {
      if (action === "history") {
        const interval = searchParams.get("interval") || "1d";
        const limit = parseInt(searchParams.get("limit") || "100");
        const klines = await getBinanceKlines(symbol, interval, limit);

        return NextResponse.json({
          symbol,
          data: klines.map((k) => ({
            time: new Date(k.openTime).toISOString().split("T")[0],
            open: parseFloat(k.open),
            high: parseFloat(k.high),
            low: parseFloat(k.low),
            close: parseFloat(k.close),
            volume: parseFloat(k.volume),
          })),
        });
      }

      const price = await getBinancePrice(symbol);
      return NextResponse.json({ symbol, price, type: "CRYPTO" });
    }

    // Stock data from Alpha Vantage
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Alpha Vantage API key not configured" },
        { status: 500 }
      );
    }

    if (action === "history") {
      const history = await getStockHistory(symbol, apiKey);
      return NextResponse.json({ symbol, data: history });
    }

    const quote = await getStockQuote(symbol, apiKey);
    return NextResponse.json({ symbol, ...quote, type: "STOCK" });
  } catch (error) {
    console.error("Market API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch data" },
      { status: 500 }
    );
  }
}

