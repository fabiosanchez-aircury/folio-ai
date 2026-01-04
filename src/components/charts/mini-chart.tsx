"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, IChartApi } from "lightweight-charts";

interface MiniChartProps {
  data: { time: string; value: number }[];
  color?: "green" | "red" | "blue";
  height?: number;
}

const colors = {
  green: {
    line: "#22c55e",
    areaTop: "rgba(34, 197, 94, 0.3)",
    areaBottom: "rgba(34, 197, 94, 0.0)",
  },
  red: {
    line: "#ef4444",
    areaTop: "rgba(239, 68, 68, 0.3)",
    areaBottom: "rgba(239, 68, 68, 0.0)",
  },
  blue: {
    line: "#3b82f6",
    areaTop: "rgba(59, 130, 246, 0.3)",
    areaBottom: "rgba(59, 130, 246, 0.0)",
  },
};

export function MiniChart({ data, color = "blue", height = 60 }: MiniChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "transparent",
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      width: containerRef.current.clientWidth,
      height,
      handleScroll: false,
      handleScale: false,
      rightPriceScale: {
        visible: false,
      },
      leftPriceScale: {
        visible: false,
      },
      timeScale: {
        visible: false,
      },
      crosshair: {
        mode: 0,
      },
    });

    chartRef.current = chart;

    const colorSet = colors[color];
    const series = chart.addAreaSeries({
      topColor: colorSet.areaTop,
      bottomColor: colorSet.areaBottom,
      lineColor: colorSet.line,
      lineWidth: 2,
    });

    series.setData(
      data.map((d) => ({
        time: d.time as unknown as import("lightweight-charts").Time,
        value: d.value,
      }))
    );

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, color, height]);

  return <div ref={containerRef} className="w-full" />;
}

