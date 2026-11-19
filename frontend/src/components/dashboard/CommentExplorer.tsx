"use client";

import React, { useState, useMemo } from "react";
import { CommentItem } from "@/types/analysis";
import {
  Search,
  MessageSquare,
  Smile,
  Frown,
  MinusCircle,
  Tag,
  Scale,
  Users,
  Filter,
} from "lucide-react";

interface CommentExplorerProps {
  comments: CommentItem[];
  selectedStakeholder: string | null;
  selectedClause: string | null;
  onClearFilters: () => void;
}

export const CommentExplorer: React.FC<CommentExplorerProps> = ({
  comments,
  selectedStakeholder,
  selectedClause,
  onClearFilters,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");

  const filteredComments = useMemo(() => {
    return comments.filter((c) => {
      if (selectedStakeholder && c.stakeholder_type !== selectedStakeholder) {
        return false;
      }
      if (selectedClause && c.clause !== selectedClause) {
        return false;
      }
      if (sentimentFilter !== "all" && c.sentiment !== sentimentFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const contentMatch = c.content?.toLowerCase().includes(query);
        const topicMatch = c.topic?.toLowerCase().includes(query);
        const issueMatch = c.canonical_issue?.toLowerCase().includes(query);
        const recMatch = c.recommendation?.toLowerCase().includes(query);
        if (!contentMatch && !topicMatch && !issueMatch && !recMatch) {
          return false;
        }
      }
      return true;
    });
  }, [comments, selectedStakeholder, selectedClause, sentimentFilter, searchQuery]);

  const hasActiveFilters = Boolean(
    selectedStakeholder || selectedClause || sentimentFilter !== "all" || searchQuery
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden space-y-4">
      {/* Titlebar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/80 px-6 py-3.5 text-xs">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-slate-700" />
          <span className="font-bold text-slate-900">
            Stakeholder Feedback & Submissions Explorer
          </span>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Showing {filteredComments.length} of {comments.length} submissions
        </span>
      </div>

      <div className="p-6 space-y-4">
        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by keywords, clauses, issues or recommendations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50/50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none transition"
            />
          </div>

          {/* Stance Selector */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
            {[
              { id: "all", label: "All" },
              { id: "positive", label: "Support" },
              { id: "neutral", label: "Neutral" },
              { id: "negative", label: "Concerns" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSentimentFilter(s.id)}
                className={`px-3 py-1.5 rounded-md transition font-medium ${
                  sentimentFilter === s.id
                    ? "bg-slate-900 text-white font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSentimentFilter("all");
                onClearFilters();
              }}
              className="text-xs text-blue-700 hover:text-blue-900 underline font-semibold whitespace-nowrap self-center"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Active Filter Tags */}
        {(selectedStakeholder || selectedClause) && (
          <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
            <span className="font-medium text-slate-500">Active Filters:</span>
            {selectedStakeholder && (
              <span className="rounded-md border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-slate-800 font-medium">
                Group: {selectedStakeholder}
              </span>
            )}
            {selectedClause && (
              <span className="rounded-md border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-slate-800 font-medium">
                Clause: {selectedClause}
              </span>
            )}
          </div>
        )}

        {/* Comment Entries */}
        <div className="space-y-3 pt-2">
          {filteredComments.length > 0 ? (
            filteredComments.map((comment, idx) => {
              const sentiment = comment.sentiment || "neutral";
              const sentimentBadge =
                sentiment === "positive"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : sentiment === "negative"
                  ? "bg-rose-50 text-rose-800 border-rose-200"
                  : "bg-slate-100 text-slate-700 border-slate-200";

              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xs hover:border-slate-300 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-500" />
                        {comment.stakeholder_type}
                      </span>
                      {comment.clause && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200">
                          {comment.clause}
                        </span>
                      )}
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${sentimentBadge}`}
                    >
                      {sentiment === "positive"
                        ? "Supportive Stance"
                        : sentiment === "negative"
                        ? "Concerns Raised"
                        : "Neutral / Clarification"}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                    &ldquo;{comment.content}&rdquo;
                  </p>

                  {(comment.canonical_issue || comment.recommendation) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                      {comment.canonical_issue && (
                        <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                          <span className="font-semibold text-slate-500 text-[11px] block">
                            Key Issue:
                          </span>
                          <span className="text-slate-800 font-medium">
                            {comment.canonical_issue}
                          </span>
                        </div>
                      )}
                      {comment.recommendation && (
                        <div className="rounded-lg bg-blue-50/50 p-2.5 border border-blue-200">
                          <span className="font-semibold text-blue-700 text-[11px] block">
                            Proposed Adjustment:
                          </span>
                          <span className="text-slate-800 font-medium">
                            {comment.recommendation}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-xs text-slate-500">
              No comments match the selected filters or search criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
