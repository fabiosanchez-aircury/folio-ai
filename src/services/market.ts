import api from "./api";

export interface MarketPrice {
  symbol: string;
  price: number;
  change24h: number;
}

export interface MarketResponse {
  prices: MarketPrice[];
  timestamp: string;
}

const MarketService = {
  /**
   * Get current market prices for symbols
   */
  getPrices: async (symbols: string[]): Promise<MarketResponse> => {
    const response = await api.get<MarketResponse>("/market", {
      params: { symbols: symbols.join(",") },
    });
    return response.data;
  },

  /**
   * Get price for a single symbol
   */
  getPrice: async (symbol: string): Promise<MarketPrice> => {
    const response = await api.get<MarketResponse>("/market", {
      params: { symbols: symbol },
    });
    return response.data.prices[0];
  },
};

export default MarketService;

