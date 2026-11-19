"use client";

import React from "react";
import { ClauseStat } from "@/types/analysis";
import { Scale, ChevronRight, Filter } from "lucide-react";

interface ClauseTableProps {
  clauses: ClauseStat[];
  selectedClause: string | null;
  onSelectClause: (clause: string | null) => void;
}

export const ClauseTable: React.FC<ClauseTableProps> = ({
  clauses,
  selectedClause,
  onSelectClause,
}) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* Titlebar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-3.5 text-xs">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-slate-700" />
          <span className="font-bold text-slate-900">
            Clause-by-Clause Statutory Analysis
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            Tracked Provisions: {clauses.length}
          </span>
          {selectedClause && (
            <button
              onClick={() => onSelectClause(null)}
              className="text-xs text-blue-700 hover:text-blue-900 font-semibold underline"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold text-slate-600">
              <th className="py-3 px-6">Statutory Clause / Provision</th>
              <th className="py-3 px-4 text-center">Submissions</th>
              <th className="py-3 px-4">Sentiment Distribution</th>
              <th className="py-3 px-4">Dominant Stance</th>
              <th className="py-3 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clauses.map((clause, idx) => {
              const total = clause.positive + clause.neutral + clause.negative;
              const posPct = total > 0 ? Math.round((clause.positive / total) * 100) : 0;
              const neuPct = total > 0 ? Math.round((clause.neutral / total) * 100) : 0;
              const negPct = total > 0 ? Math.round((clause.negative / total) * 100) : 0;
              const isSelected = selectedClause === clause.clause;

              return (
                <tr
                  key={idx}
                  onClick={() =>
                    onSelectClause(isSelected ? null : clause.clause)
                  }
                  className={`cursor-pointer transition ${
                    isSelected
                      ? "bg-blue-50/60 font-medium"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <td className="py-3.5 px-6 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      <span>{clause.clause}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-700 font-medium">
                    {clause.mention_count}
                  </td>
                  <td className="py-3.5 px-4 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-full flex rounded-full overflow-hidden bg-slate-100">
                        <div
                          style={{ width: `${posPct}%` }}
                          className="bg-emerald-500"
                          title={`Support: ${posPct}%`}
                        />
                        <div
                          style={{ width: `${neuPct}%` }}
                          className="bg-slate-400"
                          title={`Neutral: ${neuPct}%`}
                        />
                        <div
                          style={{ width: `${negPct}%` }}
                          className="bg-rose-500"
                          title={`Concerns: ${negPct}%`}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0 font-medium">
                        {posPct}% / {negPct}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${
                        posPct > negPct
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : negPct > posPct
                          ? "bg-rose-50 text-rose-800 border border-rose-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {posPct > negPct
                        ? "Broad Support"
                        : negPct > posPct
                        ? "Friction Observed"
                        : "Mixed Stance"}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <span className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium">
                      <span>View Submissions</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
