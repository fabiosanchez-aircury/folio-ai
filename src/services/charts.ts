import api from "./api";

export interface ChartDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartTicker {
  price: number;
  change: number;
  changePercent: number;
}

export interface ChartResponse {
  symbol: string;
  type: "CRYPTO" | "STOCK";
  data: ChartDataPoint[];
  ticker: ChartTicker;
}

export type TimeRange = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";

const ChartService = {
  /**
   * Get chart data for a symbol
   */
  getChartData: async (symbol: string, timeRange: TimeRange = "3M"): Promise<ChartResponse> => {
    const response = await api.get<ChartResponse>("/charts", {
      params: { symbol, timeRange },
    });
    return response.data;
  },
};

export default ChartService;

