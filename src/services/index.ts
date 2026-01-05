// API Instance
export { default as api } from "./api";

// Services
export { default as AuthService } from "./auth";
export { default as ChartService } from "./charts";
export { default as MarketService } from "./market";
export { default as NewsService } from "./news";
export { default as AIService } from "./ai";
export { default as PortfolioService } from "./portfolio";

// Types
export type { RegisterData, RegisterResponse } from "./auth";
export type { ChartDataPoint, ChartTicker, ChartResponse, TimeRange } from "./charts";
export type { MarketPrice, MarketResponse } from "./market";
export type { NewsArticle, NewsResponse, NewsCategory } from "./news";
export type { SummaryResponse, SummaryType } from "./ai";
export type { AssetPrice, PortfolioAsset, PortfolioSummary, SearchResult } from "./portfolio";

