import { finnhubClient } from "./clients";

interface FinnhubNews {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

interface FinnhubQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

interface SymbolSearchResult {
  count: number;
  result: Array<{
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
  }>;
}

export async function getCompanyNews(
  symbol: string,
  apiKey: string,
  from?: string,
  to?: string
) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const fromDate = from || weekAgo.toISOString().split("T")[0];
  const toDate = to || now.toISOString().split("T")[0];

  const response = await finnhubClient.get<FinnhubNews[]>("/company-news", {
    params: {
      symbol,
      from: fromDate,
      to: toDate,
      token: apiKey,
    },
  });

  const data = response.data;

  return data.map((news) => ({
    id: String(news.id),
    title: news.headline,
    summary: news.summary,
    source: news.source,
    url: news.url,
    imageUrl: news.image,
    publishedAt: new Date(news.datetime * 1000),
    symbols: news.related.split(",").filter(Boolean),
    category: news.category,
  }));
}

export async function getMarketNews(
  apiKey: string,
  category: string = "general"
) {
  const response = await finnhubClient.get<FinnhubNews[]>("/news", {
    params: {
      category,
      token: apiKey,
    },
  });

  const data = response.data;

  return data.map((news) => ({
    id: String(news.id),
    title: news.headline,
    summary: news.summary,
    source: news.source,
    url: news.url,
    imageUrl: news.image,
    publishedAt: new Date(news.datetime * 1000),
    symbols: news.related.split(",").filter(Boolean),
    category: news.category,
  }));
}

export async function getQuote(symbol: string, apiKey: string) {
  const response = await finnhubClient.get<FinnhubQuote>("/quote", {
    params: {
      symbol,
      token: apiKey,
    },
  });

  const data = response.data;

  return {
    symbol,
    price: data.c,
    change: data.d,
    changePercent: data.dp,
    high: data.h,
    low: data.l,
    open: data.o,
    previousClose: data.pc,
    timestamp: new Date(data.t * 1000),
  };
}

export async function getCryptoSymbols(
  apiKey: string,
  exchange: string = "binance"
) {
  const response = await finnhubClient.get("/crypto/symbol", {
    params: {
      exchange,
      token: apiKey,
    },
  });

  return response.data;
}

export async function symbolSearch(
  query: string,
  apiKey: string
): Promise<SymbolSearchResult> {
  const response = await finnhubClient.get<SymbolSearchResult>("/search", {
    params: {
      q: query,
      token: apiKey,
    },
  });

  return response.data;
}

interface FinnhubCandle {
  c: number[]; // Close prices
  h: number[]; // High prices
  l: number[]; // Low prices
  o: number[]; // Open prices
  s: string; // Status
  t: number[]; // Timestamps
  v: number[]; // Volumes
}

/**
 * Get historical stock candle data
 * @param symbol Stock symbol
 * @param apiKey Finnhub API key
 * @param resolution Resolution: 1, 5, 15, 30, 60, D, W, M
 * @param from Unix timestamp (start)
 * @param to Unix timestamp (end)
 */
export async function getStockCandles(
  symbol: string,
  apiKey: string,
  resolution: string = "D",
  from?: number,
  to?: number
) {
  const now = Math.floor(Date.now() / 1000);
  const defaultFrom = now - 90 * 24 * 60 * 60; // 90 days ago

  const response = await finnhubClient.get<FinnhubCandle>("/stock/candle", {
    params: {
      symbol,
      resolution,
      from: from || defaultFrom,
      to: to || now,
      token: apiKey,
    },
  });

  const data = response.data;

  if (data.s !== "ok" || !data.t || data.t.length === 0) {
    throw new Error("No data available for symbol");
  }

  return data.t.map((timestamp, index) => ({
    time: timestamp,
    open: data.o[index],
    high: data.h[index],
    low: data.l[index],
    close: data.c[index],
    volume: data.v[index],
  }));
}

/**
 * Get company profile/info
 */
export async function getCompanyProfile(symbol: string, apiKey: string) {
  const response = await finnhubClient.get<{
    name: string;
    ticker: string;
    exchange: string;
    finnhubIndustry: string;
    weburl: string;
    logo: string;
  }>("/stock/profile2", {
    params: {
      symbol,
      token: apiKey,
    },
  });

  return response.data;
}

/**
 * Map time range to Finnhub resolution and calculate from/to timestamps
 */
export function mapTimeRangeToFinnhub(timeRange: string): {
  resolution: string;
  from: number;
  to: number;
} {
  const to = Math.floor(Date.now() / 1000);
  let from: number;
  let resolution: string;

  switch (timeRange) {
    case "1D":
      from = to - 1 * 24 * 60 * 60; // 1 day
      resolution = "15"; // 15 minutes
      break;
    case "1W":
      from = to - 7 * 24 * 60 * 60; // 7 days
      resolution = "60"; // 1 hour
      break;
    case "1M":
      from = to - 30 * 24 * 60 * 60; // 30 days
      resolution = "D"; // Daily
      break;
    case "3M":
      from = to - 90 * 24 * 60 * 60; // 90 days
      resolution = "D"; // Daily
      break;
    case "1Y":
      from = to - 365 * 24 * 60 * 60; // 365 days
      resolution = "D"; // Daily
      break;
    case "ALL":
      from = to - 5 * 365 * 24 * 60 * 60; // 5 years
      resolution = "W"; // Weekly
      break;
    default:
      from = to - 90 * 24 * 60 * 60;
      resolution = "D";
  }

  return { resolution, from, to };
}
