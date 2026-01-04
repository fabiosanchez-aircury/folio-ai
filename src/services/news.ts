import api from "./api";

export interface NewsArticle {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  image?: string;
  related: string[];
}

export interface NewsResponse {
  articles: NewsArticle[];
  category: string;
}

export type NewsCategory = "general" | "crypto" | "forex" | "merger";

const NewsService = {
  /**
   * Get news articles
   */
  getNews: async (category: NewsCategory = "general"): Promise<NewsResponse> => {
    const response = await api.get<NewsResponse>("/news", {
      params: { category },
    });
    return response.data;
  },

  /**
   * Get news for specific symbols
   */
  getNewsBySymbols: async (symbols: string[]): Promise<NewsResponse> => {
    const response = await api.get<NewsResponse>("/news", {
      params: { symbols: symbols.join(",") },
    });
    return response.data;
  },
};

export default NewsService;

