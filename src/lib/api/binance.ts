import crypto from "crypto";
import { binanceClient } from "./clients";

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

interface Binance24hTicker {
  symbol: string;
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
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

  const response = await binanceClient.get<BinanceAccountInfo>("/api/v3/account", {
    params: {
      timestamp,
      signature,
    },
    headers: {
      "X-MBX-APIKEY": apiKey,
    },
  });

  return response.data;
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
  try {
    const response = await binanceClient.get<BinancePrice>("/api/v3/ticker/price", {
      params: {
        symbol: `${symbol}USDT`,
      },
    });
    return parseFloat(response.data.price);
  } catch {
    // Try with BUSD if USDT fails
    try {
      const response = await binanceClient.get<BinancePrice>("/api/v3/ticker/price", {
        params: {
          symbol: `${symbol}BUSD`,
        },
      });
      return parseFloat(response.data.price);
    } catch {
      return 0;
    }
  }
}

export async function getBinancePrices(): Promise<Map<string, number>> {
  const response = await binanceClient.get<BinancePrice[]>("/api/v3/ticker/price");
  const data = response.data;
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
  const response = await binanceClient.get<(string | number)[][]>("/api/v3/klines", {
    params: {
      symbol: `${symbol}USDT`,
      interval,
      limit,
    },
  });

  return response.data.map((k) => ({
    openTime: Number(k[0]),
    open: String(k[1]),
    high: String(k[2]),
    low: String(k[3]),
    close: String(k[4]),
    volume: String(k[5]),
    closeTime: Number(k[6]),
  }));
}

export async function get24hChange(
  symbol: string
): Promise<{ price: number; change: number; changePercent: number }> {
  try {
    const response = await binanceClient.get<Binance24hTicker>("/api/v3/ticker/24hr", {
      params: {
        symbol: `${symbol}USDT`,
      },
    });

    return {
      price: parseFloat(response.data.lastPrice),
      change: parseFloat(response.data.priceChange),
      changePercent: parseFloat(response.data.priceChangePercent),
    };
  } catch {
    return { price: 0, change: 0, changePercent: 0 };
  }
}
