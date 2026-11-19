"use client";

import React from "react";
import { SentimentOverview } from "@/types/analysis";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { BarChart3, Smile, Frown, MinusCircle } from "lucide-react";

interface SentimentChartProps {
  overview: SentimentOverview;
}

export const SentimentChart: React.FC<SentimentChartProps> = ({ overview }) => {
  const chartData = [
    {
      name: "Positive Support",
      value: overview.positive,
      pct: overview.positive_pct,
      color: "#059669", // Emerald-600
    },
    {
      name: "Neutral / Inquiries",
      value: overview.neutral,
      pct: overview.neutral_pct,
      color: "#64748b", // Slate-500
    },
    {
      name: "Concerns / Friction",
      value: overview.negative,
      pct: overview.negative_pct,
      color: "#e11d48", // Rose-600
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between overflow-hidden">
      {/* Titlebar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-3 text-xs">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-slate-700" />
          <span className="font-bold text-slate-900">
            Stakeholder Sentiment Distribution
          </span>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Total Feedback: {overview.total}
        </span>
      </div>

      <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Recharts Pie */}
        <div className="h-44 w-44 relative shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={46}
                outerRadius={68}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={1}
                stroke="#fff"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs shadow-md">
                        <div className="font-semibold text-slate-900">{d.name}</div>
                        <div className="text-slate-600">
                          {d.value} submissions ({d.pct}%)
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Metric */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold tracking-tight text-slate-900">
              {overview.positive_pct}%
            </span>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
              Support
            </span>
          </div>
        </div>

        {/* Legend / Breakdown List */}
        <div className="w-full space-y-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
            {chartData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-700 font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <span>{item.value}</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    ({item.pct}%)
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Sentiment is evaluated across all consultation submissions using statutory sentiment classification models.
          </p>
        </div>
      </div>
    </div>
  );
};
