const ALPHA_VANTAGE_URL = "https://www.alphavantage.co/query";

interface GlobalQuote {
  "01. symbol": string;
  "02. open": string;
  "03. high": string;
  "04. low": string;
  "05. price": string;
  "06. volume": string;
  "07. latest trading day": string;
  "08. previous close": string;
  "09. change": string;
  "10. change percent": string;
}

interface DailyData {
  "1. open": string;
  "2. high": string;
  "3. low": string;
  "4. close": string;
  "5. volume": string;
}

interface TimeSeriesDaily {
  "Meta Data": {
    "1. Information": string;
    "2. Symbol": string;
    "3. Last Refreshed": string;
  };
  "Time Series (Daily)": Record<string, DailyData>;
}

export async function getStockQuote(symbol: string, apiKey: string) {
  const response = await fetch(
    `${ALPHA_VANTAGE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch stock quote");
  }

  const data = await response.json();

  if (data["Note"]) {
    throw new Error("API rate limit reached");
  }

  const quote: GlobalQuote = data["Global Quote"];

  if (!quote || !quote["05. price"]) {
    throw new Error("Symbol not found");
  }

  return {
    symbol: quote["01. symbol"],
    open: parseFloat(quote["02. open"]),
    high: parseFloat(quote["03. high"]),
    low: parseFloat(quote["04. low"]),
    price: parseFloat(quote["05. price"]),
    volume: parseInt(quote["06. volume"]),
    latestTradingDay: quote["07. latest trading day"],
    previousClose: parseFloat(quote["08. previous close"]),
    change: parseFloat(quote["09. change"]),
    changePercent: parseFloat(quote["10. change percent"].replace("%", "")),
  };
}

export async function getStockHistory(
  symbol: string,
  apiKey: string,
  outputSize: "compact" | "full" = "compact"
) {
  const response = await fetch(
    `${ALPHA_VANTAGE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=${outputSize}&apikey=${apiKey}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch stock history");
  }

  const data: TimeSeriesDaily = await response.json();

  if ((data as unknown as { Note?: string })["Note"]) {
    throw new Error("API rate limit reached");
  }

  const timeSeries = data["Time Series (Daily)"];

  if (!timeSeries) {
    throw new Error("Symbol not found or invalid response");
  }

  const history = Object.entries(timeSeries)
    .map(([date, values]) => ({
      time: date,
      open: parseFloat(values["1. open"]),
      high: parseFloat(values["2. high"]),
      low: parseFloat(values["3. low"]),
      close: parseFloat(values["4. close"]),
      volume: parseInt(values["5. volume"]),
    }))
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  return history;
}

export async function searchSymbol(keywords: string, apiKey: string) {
  const response = await fetch(
    `${ALPHA_VANTAGE_URL}?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${apiKey}`
  );

  if (!response.ok) {
    throw new Error("Failed to search symbols");
  }

  const data = await response.json();

  if (data["Note"]) {
    throw new Error("API rate limit reached");
  }

  interface MatchResult {
    "1. symbol": string;
    "2. name": string;
    "3. type": string;
    "4. region": string;
    "8. currency": string;
  }

  const matches = data["bestMatches"] || [];

  return matches.map((match: MatchResult) => ({
    symbol: match["1. symbol"],
    name: match["2. name"],
    type: match["3. type"],
    region: match["4. region"],
    currency: match["8. currency"],
  }));
}

