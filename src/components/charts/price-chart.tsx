"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
  Time,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
} from "lightweight-charts";

export type ChartType = "candlestick" | "line" | "area";

export interface ChartDataPoint {
  time: string | number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  value?: number;
}

interface PriceChartProps {
  data: ChartDataPoint[];
  type?: ChartType;
  height?: number;
  showVolume?: boolean;
  symbol?: string;
}

const chartColors = {
  background: "#0a0a0f",
  text: "#a1a1aa",
  grid: "#27272a",
  upColor: "#22c55e",
  downColor: "#ef4444",
  lineColor: "#3b82f6",
  areaTopColor: "rgba(59, 130, 246, 0.4)",
  areaBottomColor: "rgba(59, 130, 246, 0.0)",
};

export function PriceChart({
  data,
  type = "candlestick",
  height = 400,
  symbol,
}: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick" | "Line" | "Area"> | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: chartColors.background },
        textColor: chartColors.text,
      },
      grid: {
        vertLines: { color: chartColors.grid },
        horzLines: { color: chartColors.grid },
      },
      width: chartContainerRef.current.clientWidth,
      height,
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: chartColors.text,
          style: 2,
        },
        horzLine: {
          width: 1,
          color: chartColors.text,
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: chartColors.grid,
      },
      timeScale: {
        borderColor: chartColors.grid,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Create series based on type (v5 API)
    let series: ISeriesApi<"Candlestick" | "Line" | "Area">;

    if (type === "candlestick") {
      series = chart.addSeries(CandlestickSeries, {
        upColor: chartColors.upColor,
        downColor: chartColors.downColor,
        borderDownColor: chartColors.downColor,
        borderUpColor: chartColors.upColor,
        wickDownColor: chartColors.downColor,
        wickUpColor: chartColors.upColor,
      });

      const candleData: CandlestickData<Time>[] = data.map((d) => ({
        time: d.time as Time,
        open: d.open!,
        high: d.high!,
        low: d.low!,
        close: d.close!,
      }));

      series.setData(candleData);
    } else if (type === "line") {
      series = chart.addSeries(LineSeries, {
        color: chartColors.lineColor,
        lineWidth: 2,
      });

      const lineData: LineData<Time>[] = data.map((d) => ({
        time: d.time as Time,
        value: d.close || d.value!,
      }));

      series.setData(lineData);
    } else {
      series = chart.addSeries(AreaSeries, {
        topColor: chartColors.areaTopColor,
        bottomColor: chartColors.areaBottomColor,
        lineColor: chartColors.lineColor,
        lineWidth: 2,
      });

      const areaData: LineData<Time>[] = data.map((d) => ({
        time: d.time as Time,
        value: d.close || d.value!,
      }));

      series.setData(areaData);
    }

    seriesRef.current = series;

    // Set current price
    if (data.length > 0) {
      const lastPoint = data[data.length - 1];
      setCurrentPrice(lastPoint.close || lastPoint.value || null);
    }

    // Subscribe to crosshair move
    chart.subscribeCrosshairMove((param) => {
      if (param.time && param.seriesData.size > 0) {
        const seriesData = param.seriesData.get(series);
        if (seriesData) {
          if ("close" in seriesData) {
            setCurrentPrice(seriesData.close);
          } else if ("value" in seriesData) {
            setCurrentPrice(seriesData.value);
          }
        }
      } else if (data.length > 0) {
        const lastPoint = data[data.length - 1];
        setCurrentPrice(lastPoint.close || lastPoint.value || null);
      }
    });

    // Fit content
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, type, height]);

  return (
    <div className="relative">
      {symbol && currentPrice !== null && (
        <div className="absolute top-2 left-2 z-10 bg-card/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border">
          <span className="text-sm text-muted-foreground">{symbol}</span>
          <span className="ml-2 text-lg font-semibold">
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}
