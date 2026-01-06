import api from "./api";

export interface AssetPrice {
  symbol: string;
  coinGeckoId?: string;
  name: string;
  type: "CRYPTO" | "STOCK";
  currentPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  image?: string;
}

export interface PortfolioAsset {
  id: string;
  symbol: string;
  name: string | null;
  type: "CRYPTO" | "STOCK";
  quantity: number;
  currentPrice?: number;
  currentValue?: number;
}

export interface PortfolioSummary {
  totalValue: number;
  assets: PortfolioAsset[];
}

export interface SearchResult {
  id: string;
  symbol: string;
  name: string;
  type: "CRYPTO" | "STOCK";
  image?: string;
}

const PortfolioService = {
  /**
   * Get real-time prices for portfolio assets
   */
  getPrices: async (symbols: string[], type: "CRYPTO" | "STOCK" = "CRYPTO"): Promise<AssetPrice[]> => {
    const response = await api.get<{ prices: AssetPrice[] }>("/portfolio/prices", {
      params: { symbols: symbols.join(","), type },
    });
    return response.data.prices;
  },

  /**
   * Search for coins/stocks to add to portfolio
   */
  search: async (query: string, type?: "CRYPTO" | "STOCK"): Promise<SearchResult[]> => {
    const params: Record<string, string> = { q: query };
    if (type) {
      params.type = type;
    }
    const response = await api.get<{ results: SearchResult[] }>("/portfolio/search", {
      params,
    });
    return response.data.results;
  },

  /**
   * Calculate portfolio value with current prices
   */
  calculateValue: async (portfolioId: string): Promise<PortfolioSummary> => {
    const response = await api.get<PortfolioSummary>(`/portfolio/${portfolioId}/value`);
    return response.data;
  },

  /**
   * Get all portfolios with real-time values
   */
  getAllWithValues: async (): Promise<PortfolioSummary[]> => {
    const response = await api.get<{ portfolios: PortfolioSummary[] }>("/portfolio/values");
    return response.data.portfolios;
  },

  /**
   * Get popular assets (crypto or stocks)
   */
  getPopular: async (type: "CRYPTO" | "STOCK" = "CRYPTO"): Promise<SearchResult[]> => {
    const response = await api.get<{ results: SearchResult[] }>("/portfolio/popular", {
      params: { type },
    });
    return response.data.results;
  },
};

export default PortfolioService;

