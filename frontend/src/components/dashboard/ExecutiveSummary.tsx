"use client";

import React from "react";
import { DashboardData } from "@/types/analysis";
import {
  FileText,
  Users,
  Scale,
  Sparkles,
  TrendingUp,
  Building2,
  Calendar,
  CheckCircle2,
} from "lucide-react";

interface ExecutiveSummaryProps {
  data: DashboardData;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ data }) => {
  const dominantSentiment =
    data.sentiment_overview.negative_pct > data.sentiment_overview.positive_pct &&
    data.sentiment_overview.negative_pct >= data.sentiment_overview.neutral_pct
      ? "Friction Observed / Significant Concerns"
      : data.sentiment_overview.positive_pct > data.sentiment_overview.negative_pct &&
        data.sentiment_overview.positive_pct >= data.sentiment_overview.neutral_pct
      ? "Broad Support / Favorable Consensus"
      : "Balanced Feedback / Inquiries Prevalent";

  return (
    <div className="space-y-4">
      {/* Primary Summary Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Titlebar */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-3 text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-700" />
            <span className="font-bold text-slate-900">
              Executive Consultation Synthesis
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-500 text-[11px]">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Ingested: {new Date(data.uploaded_at).toISOString().split("T")[0]}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-semibold text-emerald-700">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              Verified Analysis
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <span className="text-slate-500 font-normal">Document:</span> {data.filename}
            </h2>
            <div className="border-l-4 border-slate-900 pl-4 py-1">
              <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
                {data.overall_summary}
              </p>
            </div>
          </div>

          {/* Stance Box */}
          <div className="flex flex-col rounded-lg border border-slate-200 bg-slate-50 p-4 min-w-[220px] space-y-1.5 shrink-0">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Consultation Stance
            </div>
            <div className="text-xs font-bold text-slate-900">
              {dominantSentiment}
            </div>
            <div className="text-xs text-slate-600 pt-2 border-t border-slate-200 flex justify-between">
              <span>Points of Concern:</span>
              <span className="font-bold text-rose-700">
                {data.sentiment_overview.negative_pct}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Connected Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Comments */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Submissions / Comments</span>
            <FileText className="h-4 w-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {data.total_comments}
            </span>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
              Parsed
            </span>
          </div>
          <p className="text-xs text-slate-500 truncate">
            Across {data.clauses.length} statutory clauses
          </p>
        </div>

        {/* Stakeholder Groups */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Stakeholder Groups</span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {data.stakeholders.length}
            </span>
            <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-sm">
              Active
            </span>
          </div>
          <p className="text-xs text-slate-500 truncate">
            Industry, legal & civil society
          </p>
        </div>

        {/* Support Level */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Favorable Stance</span>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {data.sentiment_overview.positive_pct}%
            </span>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
              Support
            </span>
          </div>
          <p className="text-xs text-slate-500 truncate">
            {data.sentiment_overview.positive} positive submissions
          </p>
        </div>

        {/* Clause Density */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Statutory Provisions</span>
            <Scale className="h-4 w-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {data.clauses.length}
            </span>
            <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-sm">
              Cited
            </span>
          </div>
          <p className="text-xs text-slate-500 truncate">
            {data.topics.length} thematic policy topics
          </p>
        </div>
      </div>
    </div>
  );
};
