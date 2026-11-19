"use client";

import React from "react";
import { TopicBreakdown } from "@/types/analysis";
import { Tag } from "lucide-react";

interface TopicCloudProps {
  topics: TopicBreakdown[];
}

export const TopicCloud: React.FC<TopicCloudProps> = ({ topics }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between overflow-hidden">
      {/* Titlebar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-3 text-xs">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-slate-700" />
          <span className="font-bold text-slate-900">
            Thematic Consultation Issues & Topics
          </span>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Identified Topics: {topics.length}
        </span>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-center">
        <div className="flex flex-wrap gap-2.5">
          {topics.map((t) => (
            <div
              key={t.topic}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs transition hover:border-slate-300 hover:bg-slate-100"
            >
              <span className="font-medium text-slate-800">{t.topic}</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                {t.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
