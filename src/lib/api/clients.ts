import axios from "axios";

/**
 * CoinGecko API Client
 * Free tier: 10-50 calls/minute
 */
export const coinGeckoClient = axios.create({
  baseURL: "https://api.coingecko.com/api/v3",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});


/**
 * Finnhub API Client
 * Free tier: 60 calls/minute
 */
export const finnhubClient = axios.create({
  baseURL: "https://finnhub.io/api/v1",
  timeout: 10000,
  params: {}, // Will be set per request
});

/**
 * Binance API Client
 */
export const binanceClient = axios.create({
  baseURL: "https://api.binance.com",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});


