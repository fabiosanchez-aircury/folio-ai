/**
 * CoinGecko API Client
 * Free tier limits:
 * - Simple endpoints: 10-50 calls/minute
 * - Complex endpoints: 10-30 calls/minute
 * - Some coins may not have complete data (price, images, etc.)
 * - Search may return coins that don't have market data
 * Docs: https://www.coingecko.com/en/api/documentation
 */

const BASE_URL = "https://api.coingecko.com/api/v3";

export interface CoinPrice {
  [coinId: string]: {
    usd: number;
    usd_24h_change?: number;
    usd_24h_vol?: number;
    usd_market_cap?: number;
  };
}

export interface CoinInfo {
  id: string;
  symbol: string;
  name: string;
}

export interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  sparkline_in_7d?: {
    price: number[];
  };
}

export interface CoinHistoryData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

/**
 * Get list of all supported coins
 */
export async function getCoinsList(): Promise<CoinInfo[]> {
  const response = await fetch(`${BASE_URL}/coins/list`);

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Search for coins by query
 */
export async function searchCoins(query: string): Promise<{
  coins: Array<{
    id: string;
    name: string;
    symbol: string;
    thumb: string;
    large: string;
  }>;
}> {
  const response = await fetch(
    `${BASE_URL}/search?query=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get current price for multiple coins
 */
export async function getCoinsPrice(
  coinIds: string[],
  options?: {
    include24hChange?: boolean;
    include24hVol?: boolean;
    includeMarketCap?: boolean;
  }
): Promise<CoinPrice> {
  const params = new URLSearchParams({
    ids: coinIds.join(","),
    vs_currencies: "usd",
  });

  if (options?.include24hChange) {
    params.append("include_24hr_change", "true");
  }
  if (options?.include24hVol) {
    params.append("include_24hr_vol", "true");
  }
  if (options?.includeMarketCap) {
    params.append("include_market_cap", "true");
  }

  const response = await fetch(`${BASE_URL}/simple/price?${params}`);

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get market data for coins (with more details)
 */
export async function getCoinsMarkets(
  coinIds?: string[],
  options?: {
    perPage?: number;
    page?: number;
    sparkline?: boolean;
    priceChangePercentage?: string;
  }
): Promise<CoinMarketData[]> {
  const params = new URLSearchParams({
    vs_currency: "usd",
    order: "market_cap_desc",
    per_page: String(options?.perPage || 100),
    page: String(options?.page || 1),
    sparkline: String(options?.sparkline || false),
  });

  if (coinIds && coinIds.length > 0) {
    params.append("ids", coinIds.join(","));
  }

  if (options?.priceChangePercentage) {
    params.append("price_change_percentage", options.priceChangePercentage);
  }

  const response = await fetch(`${BASE_URL}/coins/markets?${params}`);

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get historical market data for a coin
 */
export async function getCoinHistory(
  coinId: string,
  days: number | "max" = 30
): Promise<CoinHistoryData> {
  const params = new URLSearchParams({
    vs_currency: "usd",
    days: String(days),
  });

  const response = await fetch(
    `${BASE_URL}/coins/${coinId}/market_chart?${params}`
  );

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get coin details by ID
 */
export async function getCoinDetails(coinId: string): Promise<{
  id: string;
  symbol: string;
  name: string;
  image: { thumb: string; small: string; large: string };
  market_data: {
    current_price: { usd: number };
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_30d: number;
    market_cap: { usd: number };
    total_volume: { usd: number };
  };
}> {
  const response = await fetch(
    `${BASE_URL}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`
  );

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Map common symbols to CoinGecko IDs
 * CoinGecko uses IDs like "bitcoin" instead of symbols like "BTC"
 */
export const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  BNB: "binancecoin",
  SOL: "solana",
  XRP: "ripple",
  USDC: "usd-coin",
  ADA: "cardano",
  AVAX: "avalanche-2",
  DOGE: "dogecoin",
  DOT: "polkadot",
  TRX: "tron",
  LINK: "chainlink",
  MATIC: "matic-network",
  SHIB: "shiba-inu",
  LTC: "litecoin",
  ATOM: "cosmos",
  UNI: "uniswap",
  XLM: "stellar",
  NEAR: "near",
  APT: "aptos",
  ARB: "arbitrum",
  OP: "optimism",
  INJ: "injective-protocol",
  SUI: "sui",
};

/**
 * Convert symbol to CoinGecko ID
 */
export function symbolToCoinGeckoId(symbol: string): string | null {
  const upperSymbol = symbol.toUpperCase();
  return SYMBOL_TO_COINGECKO_ID[upperSymbol] || null;
}
