"use client";

import React from "react";
import { StakeholderBreakdown } from "@/types/analysis";
import { Users, Briefcase, Building2, BookOpen, User } from "lucide-react";

interface StakeholderViewProps {
  stakeholders: StakeholderBreakdown[];
  selectedStakeholder: string | null;
  onSelectStakeholder: (type: string | null) => void;
}

const getStakeholderIcon = (name: string) => {
  const low = name.toLowerCase();
  if (low.includes("accountant") || low.includes("ca")) return <Briefcase className="h-4 w-4" />;
  if (low.includes("lawyer") || low.includes("legal")) return <BookOpen className="h-4 w-4" />;
  if (low.includes("industry") || low.includes("commerce")) return <Building2 className="h-4 w-4" />;
  if (low.includes("citizen") || low.includes("public")) return <User className="h-4 w-4" />;
  return <Users className="h-4 w-4" />;
};

export const StakeholderView: React.FC<StakeholderViewProps> = ({
  stakeholders,
  selectedStakeholder,
  onSelectStakeholder,
}) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* Titlebar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-3.5 text-xs">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-700" />
          <span className="font-bold text-slate-900">
            Stakeholder Perspectives & Representation
          </span>
        </div>
        {selectedStakeholder && (
          <button
            onClick={() => onSelectStakeholder(null)}
            className="text-xs text-blue-700 hover:text-blue-900 font-semibold underline"
          >
            Show All Stakeholder Groups
          </button>
        )}
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stakeholders.map((s) => {
          const isSelected = selectedStakeholder === s.stakeholder_type;
          const total = s.positive + s.negative + s.neutral;
          const posPct = total > 0 ? Math.round((s.positive / total) * 100) : 0;
          const negPct = total > 0 ? Math.round((s.negative / total) * 100) : 0;

          return (
            <div
              key={s.stakeholder_type}
              onClick={() =>
                onSelectStakeholder(isSelected ? null : s.stakeholder_type)
              }
              className={`cursor-pointer rounded-xl border p-4 transition flex flex-col justify-between ${
                isSelected
                  ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      isSelected
                        ? "bg-slate-800 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {getStakeholderIcon(s.stakeholder_type)}
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                      isSelected
                        ? "bg-slate-800 text-slate-200"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {s.count} Submissions
                  </span>
                </div>

                <div>
                  <h4
                    className={`text-sm font-bold tracking-tight ${
                      isSelected ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {s.stakeholder_type}
                  </h4>
                  <p
                    className={`text-xs line-clamp-2 mt-1 leading-relaxed ${
                      isSelected ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    {s.summary || "General consultation feedback"}
                  </p>
                </div>
              </div>

              {/* Sentiment Pill Bar */}
              <div className="pt-4 mt-3 border-t border-slate-100/30">
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className={isSelected ? "text-slate-400" : "text-slate-500"}>
                    Support / Concern:
                  </span>
                  <span className={isSelected ? "text-emerald-400 font-bold" : "text-emerald-700 font-bold"}>
                    {posPct}% / {negPct}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200/50 overflow-hidden flex">
                  <div
                    style={{ width: `${posPct}%` }}
                    className="bg-emerald-500"
                  />
                  <div
                    style={{ width: `${negPct}%` }}
                    className="bg-rose-500"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
