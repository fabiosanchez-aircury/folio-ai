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

export async function getPortfolioNews(
  stockSymbols: string[],
  cryptoSymbols: string[],
  apiKey: string,
  from?: string,
  to?: string
) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const fromDate = from || weekAgo.toISOString().split("T")[0];
  const toDate = to || now.toISOString().split("T")[0];

  const newsPromises: Promise<{ data: FinnhubNews[] }>[] = [];

  // Fetch stock news for each symbol
  stockSymbols.forEach((symbol) => {
    newsPromises.push(
      finnhubClient
        .get<FinnhubNews[]>("/company-news", {
          params: {
            symbol,
            from: fromDate,
            to: toDate,
            token: apiKey,
          },
        })
        .catch((error) => {
          console.error(`Error fetching news for stock ${symbol}:`, error);
          return { data: [] };
        })
    );
  });

  // Fetch crypto market news if there are crypto symbols
  // Note: Finnhub crypto news API doesn't support date filtering, so we'll filter client-side
  if (cryptoSymbols.length > 0) {
    newsPromises.push(
      finnhubClient
        .get<FinnhubNews[]>("/news", {
          params: {
            category: "crypto",
            token: apiKey,
          },
        })
        .catch((error) => {
          console.error(`Error fetching crypto news:`, error);
          return { data: [] };
        })
    );
  }

  const responses = await Promise.all(newsPromises);

  // Separate stock news and crypto news
  const stockNews: FinnhubNews[] = [];
  const cryptoNews: FinnhubNews[] = [];

  // First N responses are stock news (one per stock symbol)
  let responseIndex = 0;
  for (let i = 0; i < stockSymbols.length; i++) {
    if (responses[responseIndex]?.data) {
      stockNews.push(...responses[responseIndex].data);
    }
    responseIndex++;
  }

  // Last response (if exists) is crypto market news
  if (cryptoSymbols.length > 0 && responses[responseIndex]?.data) {
    cryptoNews.push(...responses[responseIndex].data);
  }

  // Filter crypto news by date range and symbols
  const fromTimestamp = fromDate ? new Date(fromDate).getTime() / 1000 : null;
  const toTimestamp = toDate ? new Date(toDate).getTime() / 1000 + 86400 : null; // Add 1 day to include end date

  const filteredCryptoNews = cryptoNews.filter((news) => {
    // Filter by date range
    if (fromTimestamp && news.datetime < fromTimestamp) return false;
    if (toTimestamp && news.datetime > toTimestamp) return false;

    // Filter by related symbols
    if (cryptoSymbols.length === 0) return false;

    const relatedSymbols = news.related
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    return cryptoSymbols.some((crypto) =>
      relatedSymbols.includes(crypto.toUpperCase())
    );
  });

  // Combine stock news (already filtered by API date range) and filtered crypto news
  const allNews = [...stockNews, ...filteredCryptoNews];

  // Remove duplicates based on news ID and sort by date (newest first)
  const uniqueNews = Array.from(
    new Map(allNews.map((news) => [news.id, news])).values()
  ).sort((a, b) => b.datetime - a.datetime);

  return uniqueNews.map((news) => ({
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
