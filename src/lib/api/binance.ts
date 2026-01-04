import crypto from "crypto";

const BINANCE_API_URL = "https://api.binance.com";

interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
}

interface BinanceAccountInfo {
  balances: BinanceBalance[];
}

interface BinancePrice {
  symbol: string;
  price: string;
}

interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
}

function generateSignature(queryString: string, apiSecret: string): string {
  return crypto
    .createHmac("sha256", apiSecret)
    .update(queryString)
    .digest("hex");
}

export async function getBinanceAccountInfo(
  apiKey: string,
  apiSecret: string
): Promise<BinanceAccountInfo> {
  const timestamp = Date.now();
  const queryString = `timestamp=${timestamp}`;
  const signature = generateSignature(queryString, apiSecret);

  const response = await fetch(
    `${BINANCE_API_URL}/api/v3/account?${queryString}&signature=${signature}`,
    {
      headers: {
        "X-MBX-APIKEY": apiKey,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || "Failed to fetch account info");
  }

  return response.json();
}

export async function getBinanceBalances(
  apiKey: string,
  apiSecret: string
): Promise<{ asset: string; free: number; locked: number; total: number }[]> {
  const accountInfo = await getBinanceAccountInfo(apiKey, apiSecret);

  return accountInfo.balances
    .filter((b) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
    .map((b) => ({
      asset: b.asset,
      free: parseFloat(b.free),
      locked: parseFloat(b.locked),
      total: parseFloat(b.free) + parseFloat(b.locked),
    }));
}

export async function getBinancePrice(symbol: string): Promise<number> {
  const response = await fetch(
    `${BINANCE_API_URL}/api/v3/ticker/price?symbol=${symbol}USDT`
  );

  if (!response.ok) {
    // Try with BUSD if USDT fails
    const busdResponse = await fetch(
      `${BINANCE_API_URL}/api/v3/ticker/price?symbol=${symbol}BUSD`
    );
    if (!busdResponse.ok) {
      return 0;
    }
    const busdData: BinancePrice = await busdResponse.json();
    return parseFloat(busdData.price);
  }

  const data: BinancePrice = await response.json();
  return parseFloat(data.price);
}

export async function getBinancePrices(): Promise<Map<string, number>> {
  const response = await fetch(`${BINANCE_API_URL}/api/v3/ticker/price`);

  if (!response.ok) {
    throw new Error("Failed to fetch prices");
  }

  const data: BinancePrice[] = await response.json();
  const prices = new Map<string, number>();

  data.forEach((item) => {
    if (item.symbol.endsWith("USDT")) {
      const asset = item.symbol.replace("USDT", "");
      prices.set(asset, parseFloat(item.price));
    }
  });

  // Add USDT itself
  prices.set("USDT", 1);

  return prices;
}

export async function getBinanceKlines(
  symbol: string,
  interval: string = "1d",
  limit: number = 100
): Promise<BinanceKline[]> {
  const response = await fetch(
    `${BINANCE_API_URL}/api/v3/klines?symbol=${symbol}USDT&interval=${interval}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch klines");
  }

  const data = await response.json();

  return data.map((k: (string | number)[]) => ({
    openTime: k[0],
    open: k[1],
    high: k[2],
    low: k[3],
    close: k[4],
    volume: k[5],
    closeTime: k[6],
  }));
}

export async function get24hChange(
  symbol: string
): Promise<{ price: number; change: number; changePercent: number }> {
  const response = await fetch(
    `${BINANCE_API_URL}/api/v3/ticker/24hr?symbol=${symbol}USDT`
  );

  if (!response.ok) {
    return { price: 0, change: 0, changePercent: 0 };
  }

  const data = await response.json();

  return {
    price: parseFloat(data.lastPrice),
    change: parseFloat(data.priceChange),
    changePercent: parseFloat(data.priceChangePercent),
  };
}

