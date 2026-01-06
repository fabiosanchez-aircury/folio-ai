// Asset types
export type AssetType = "CRYPTO" | "STOCK";

// User types
export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
}

// Portfolio types
export interface Portfolio {
  id: string;
  name: string;
  userId: string;
  assets: Asset[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Asset {
  id: string;
  symbol: string;
  name?: string;
  type: AssetType;
  quantity: number;
  currentPrice?: number;
  portfolioId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Market data types
export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap?: number;
  lastUpdated: Date;
}

export interface HistoricalDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// News types
export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  imageUrl?: string;
  publishedAt: Date;
  symbols: string[];
  sentiment?: "positive" | "negative" | "neutral";
}

// API Key types
export interface ApiKey {
  id: string;
  platform: "BINANCE";
  apiKey: string;
  userId: string;
  isConnected: boolean;
  lastSync?: Date;
}

// AI types
export interface AISummary {
  id: string;
  portfolioId: string;
  summary: string;
  insights: string[];
  recommendations: string[];
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

