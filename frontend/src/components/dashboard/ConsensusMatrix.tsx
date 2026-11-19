"use client";

import React from "react";
import { ConsensusData } from "@/types/analysis";
import { CheckCircle2, AlertTriangle, Lightbulb, Compass } from "lucide-react";

interface ConsensusMatrixProps {
  consensus: ConsensusData;
}

export const ConsensusMatrix: React.FC<ConsensusMatrixProps> = ({ consensus }) => {
  const agreements = consensus.agreements || [];
  const disagreements = consensus.disagreements || [];
  const recommendations = consensus.recommendations || [];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* Titlebar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-3.5 text-xs">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-slate-700" />
          <span className="font-bold text-slate-900">
            Policy Consensus & Legislative Action Matrix
          </span>
        </div>
        <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Cross-Stakeholder Synthesis Complete
        </span>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Agreements */}
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-2 text-xs font-bold text-emerald-950">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Shared Agreements
            </span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800">
              {agreements.length}
            </span>
          </div>
          <div className="space-y-2.5">
            {agreements.length > 0 ? (
              agreements.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-800 leading-relaxed shadow-2xs border-l-3 border-l-emerald-600"
                >
                  <p>{item}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No universal agreements recorded.</p>
            )}
          </div>
        </div>

        {/* Friction Points */}
        <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-rose-100 pb-2 text-xs font-bold text-rose-950">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              Points of Contention
            </span>
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] text-rose-800">
              {disagreements.length}
            </span>
          </div>
          <div className="space-y-2.5">
            {disagreements.length > 0 ? (
              disagreements.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-800 leading-relaxed shadow-2xs border-l-3 border-l-rose-600"
                >
                  <p>{item}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No significant points of friction detected.</p>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-blue-100 pb-2 text-xs font-bold text-blue-950">
            <span className="flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              Policy Recommendations
            </span>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] text-blue-800">
              {recommendations.length}
            </span>
          </div>
          <div className="space-y-2.5">
            {recommendations.length > 0 ? (
              recommendations.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-800 leading-relaxed shadow-2xs border-l-3 border-l-blue-600"
                >
                  <p>{item}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No draft amendments generated.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
