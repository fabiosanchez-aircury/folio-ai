import api from "./api";

export interface SummaryResponse {
  summary: string;
}

export type SummaryType = "portfolio" | "news";

const AIService = {
  /**
   * Get AI-generated summary
   */
  getSummary: async (
    type: SummaryType = "portfolio"
  ): Promise<SummaryResponse> => {
    const response = await api.get<SummaryResponse>("/ai/summary", {
      params: { type },
    });
    return response.data;
  },
};

export default AIService;
