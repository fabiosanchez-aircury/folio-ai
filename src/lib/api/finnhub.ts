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
