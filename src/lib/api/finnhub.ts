const FINNHUB_URL = "https://finnhub.io/api/v1";

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

  const response = await fetch(
    `${FINNHUB_URL}/company-news?symbol=${symbol}&from=${fromDate}&to=${toDate}&token=${apiKey}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch company news");
  }

  const data: FinnhubNews[] = await response.json();

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

export async function getMarketNews(apiKey: string, category: string = "general") {
  const response = await fetch(
    `${FINNHUB_URL}/news?category=${category}&token=${apiKey}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch market news");
  }

  const data: FinnhubNews[] = await response.json();

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
  const response = await fetch(
    `${FINNHUB_URL}/quote?symbol=${symbol}&token=${apiKey}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch quote");
  }

  const data: FinnhubQuote = await response.json();

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

export async function getCryptoSymbols(apiKey: string, exchange: string = "binance") {
  const response = await fetch(
    `${FINNHUB_URL}/crypto/symbol?exchange=${exchange}&token=${apiKey}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch crypto symbols");
  }

  return response.json();
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

export async function symbolSearch(query: string, apiKey: string): Promise<SymbolSearchResult> {
  const response = await fetch(
    `${FINNHUB_URL}/search?q=${encodeURIComponent(query)}&token=${apiKey}`
  );

  if (!response.ok) {
    throw new Error("Failed to search symbols");
  }

  return response.json();
}

