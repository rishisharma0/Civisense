export interface DocumentItem {
  document_id: string;
  filename: string;
  status?: string;
  uploaded_at: string;
  stored_filename?: string;
}

export interface CommentItem {
  id: string;
  document_id: string;
  stakeholder_type: string;
  content: string;
  topic?: string | null;
  raw_issue?: string | null;
  canonical_issue?: string | null;
  clause?: string | null;
  sentiment?: "positive" | "negative" | "neutral" | null;
  sentiment_score?: number | null;
  recommendation?: string | null;
  created_at: string;
}

export interface SentimentOverview {
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  positive_pct: number;
  negative_pct: number;
  neutral_pct: number;
  avg_score: number;
}

export interface ClauseStat {
  clause: string;
  mention_count: number;
  positive: number;
  negative: number;
  neutral: number;
  dominant_sentiment: "positive" | "negative" | "neutral";
}

export interface StakeholderBreakdown {
  stakeholder_type: string;
  count: number;
  positive: number;
  negative: number;
  neutral: number;
  summary?: string | null;
}

export interface TopicBreakdown {
  topic: string;
  count: number;
  percentage: number;
}

export interface ConsensusData {
  agreements?: string[];
  disagreements?: string[];
  recommendations?: string[];
}

export interface BatchUploadResponse {
  job_id: string;
  status: string;
  total_files: number;
  message: string;
  created_at: string;
}

export interface BatchSummary {
  total_comments: number;
  total_documents: number;
  sentiment_distribution: Record<string, number>;
  stakeholder_breakdown: Record<string, number>;
  top_topics: TopicBreakdown[];
  top_canonical_issues: { issue: string; count: number }[];
  consensus: ConsensusData;
}

export interface BatchStatusResponse {
  job_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  total_files: number;
  processed_files: number;
  progress_percentage: number;
  current_step: string;
  document_ids: string[];
  documents?: Array<{
    document_id: string;
    filename: string;
    status: string;
    total_comments?: number;
    uploaded_at?: string;
  }>;
  error_message?: string | null;
  batch_summary?: BatchSummary | null;
  created_at: string;
  completed_at?: string | null;
}

export interface DashboardData {
  document_id: string;
  filename: string;
  uploaded_at: string;
  total_comments: number;
  overall_summary: string;
  sentiment_overview: SentimentOverview;
  clauses: ClauseStat[];
  stakeholders: StakeholderBreakdown[];
  topics: TopicBreakdown[];
  consensus: ConsensusData;
  comments: CommentItem[];
}
