"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  DocumentItem,
  BatchStatusResponse,
} from "@/types/analysis";
import { Navbar } from "@/components/Navbar";
import { useDropzone } from "react-dropzone";
import {
  Layers,
  UploadCloud,
  FileText,
  Play,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Loader2,
  Inbox,
  Sparkles,
  BarChart3,
  Scale,
  Users,
  Building2,
  Database,
  RefreshCw,
  Printer,
} from "lucide-react";

export default function BatchPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [pendingDocs, setPendingDocs] = useState<Array<{ document_id: string; filename: string; uploaded_at: string }>>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [backendOnline, setBackendOnline] = useState<boolean>(true);

  // Batch execution states
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<BatchStatusResponse | null>(null);
  const [uploadedBatchFiles, setUploadedBatchFiles] = useState<File[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  // Load documents and pending queue
  const refreshData = useCallback(async () => {
    try {
      const [docs, pending, batches] = await Promise.all([
        api.listDocuments(),
        api.getPendingSubmissions(),
        api.listBatches(),
      ]);
      setDocuments(docs);
      setPendingCount(pending.pending_count);
      setPendingDocs(pending.documents);
      if (batches.length > 0 && !currentJobId && !batchStatus) {
        const latestJob = await api.getBatchStatus(batches[0].job_id);
        setBatchStatus(latestJob);
      }
      setBackendOnline(true);
    } catch (err) {
      console.error("Failed to load batch queue data:", err);
      setBackendOnline(false);
    }
  }, [currentJobId, batchStatus]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Poll batch progress when job is active
  useEffect(() => {
    if (!isProcessing || !currentJobId) return;

    const interval = setInterval(async () => {
      try {
        const status = await api.getBatchStatus(currentJobId);
        setBatchStatus(status);

        if (status.status === "completed") {
          setIsProcessing(false);
          clearInterval(interval);
          await refreshData();
        } else if (status.status === "failed") {
          setIsProcessing(false);
          setErrorMsg(status.error_message || "Batch processing failed.");
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Error polling batch status:", err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isProcessing, currentJobId, refreshData]);

  // Dropzone for multi-file upload directly into batch
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    disabled: isProcessing,
    onDrop: (accepted, rejected) => {
      if (rejected.length > 0) {
        setErrorMsg("Only PDF files are supported for consultation analysis.");
        return;
      }
      setUploadedBatchFiles((prev) => [...prev, ...accepted]);
      setErrorMsg(null);
    },
  });

  // Execute batch processing for pending submissions in SQLite DB
  const handleProcessPending = async () => {
    if (pendingCount === 0) return;
    try {
      setIsProcessing(true);
      setErrorMsg(null);
      const res = await api.processPendingSubmissions();
      setCurrentJobId(res.job_id);
      setBatchStatus({
        job_id: res.job_id,
        status: "processing",
        total_files: res.total_files,
        processed_files: 0,
        progress_percentage: 0,
        current_step: "Initializing AI cross-consultation batch pipeline...",
        document_ids: [],
        documents: [],
        batch_summary: null,
        created_at: new Date().toISOString(),
      });
    } catch (err: unknown) {
      setIsProcessing(false);
      const msg = err instanceof Error ? err.message : "Failed to start batch processing.";
      setErrorMsg(msg);
    }
  };

  // Upload dropped files and run batch
  const handleUploadAndRunBatch = async () => {
    if (uploadedBatchFiles.length === 0) return;
    try {
      setIsProcessing(true);
      setErrorMsg(null);
      const res = await api.uploadBatch(uploadedBatchFiles);
      setCurrentJobId(res.job_id);
      setBatchStatus({
        job_id: res.job_id,
        status: "processing",
        total_files: res.total_files,
        processed_files: 0,
        progress_percentage: 0,
        current_step: "Ingesting files and preparing sequential AI extraction...",
        document_ids: [],
        documents: [],
        batch_summary: null,
        created_at: new Date().toISOString(),
      });
      setUploadedBatchFiles([]);
    } catch (err: unknown) {
      setIsProcessing(false);
      const msg = err instanceof Error ? err.message : "Failed to upload and run batch.";
      setErrorMsg(msg);
    }
  };

  // Preload 3 Demo Submissions into the pending database
  const handleLoadDemoBatch = async () => {
    try {
      setIsLoadingSample(true);
      setErrorMsg(null);
      const sampleNames = [
        { file: "sample_batch_1.pdf", label: "submission_industry_association.pdf" },
        { file: "sample_batch_2.pdf", label: "submission_civil_society_org.pdf" },
        { file: "sample_batch_3.pdf", label: "submission_academic_legal_council.pdf" },
      ];

      for (const item of sampleNames) {
        const res = await fetch(`/${item.file}`);
        const blob = await res.blob();
        const fileObj = new File([blob], item.label, { type: "application/pdf" });
        await api.uploadDocument(fileObj);
      }

      await refreshData();
    } catch (err) {
      console.error("Failed to load demo batch submissions:", err);
      setErrorMsg("Failed to load sample submissions into database.");
    } finally {
      setIsLoadingSample(false);
    }
  };

  const progressPct =
    batchStatus && batchStatus.total_files > 0
      ? Math.round((batchStatus.processed_files / batchStatus.total_files) * 100)
      : 0;

  const summary = batchStatus?.batch_summary;

  // Sentiment calculations
  const posCount = summary?.sentiment_distribution?.positive || 0;
  const negCount = summary?.sentiment_distribution?.negative || 0;
  const neuCount = summary?.sentiment_distribution?.neutral || 0;
  const totalSent = posCount + negCount + neuCount;
  const posPct = totalSent > 0 ? Math.round((posCount / totalSent) * 100) : 0;
  const negPct = totalSent > 0 ? Math.round((negCount / totalSent) * 100) : 0;
  const dominantStance =
    posPct > negPct
      ? "Broad Stakeholder Support"
      : negPct > posPct
      ? "Significant Friction Observed"
      : "Balanced Feedback / Mixed Perspectives";

  const agreements = summary?.consensus?.agreements || [];
  const disagreements = summary?.consensus?.disagreements || [];
  const recommendations = summary?.consensus?.recommendations || [];

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 antialiased selection:bg-zinc-900 selection:text-white">
      <Navbar pendingCount={pendingCount} backendOnline={backendOnline} />

      <main className="flex-1 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
          {/* Lera Banner Box: Official Government Portal Header */}
          <div className="border border-zinc-200 bg-white shadow-2xs">
            {/* Titlebar */}
            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-xs">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-zinc-700" />
                <span className="font-bold text-zinc-950">
                  Legislative Department / MCA — Consultation Review Engine
                </span>
              </div>
              <div className="flex items-center gap-3 text-zinc-600 text-[11px]">
                <span>DATABASE: SQLite (civisense.db)</span>
                <span>•</span>
                <span className="font-semibold text-zinc-900">OFFICIAL BATCH PIPELINE</span>
              </div>
            </div>

            {/* Banner Content */}
            <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-3xl">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
                  Government Batch Processing & Policy Synthesis
                </h1>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Citizen submissions stored in the SQLite database remain queued until you initiate batch processing. When triggered, the AI pipeline extracts statutory clauses, stakeholder concerns, and policy consensus across all submissions.
                </p>
              </div>

              {/* Connected Metric Boxes */}
              <div className="flex items-center border border-zinc-200 divide-x divide-zinc-200 bg-zinc-50/70 shrink-0">
                <div className="px-5 py-3 text-center">
                  <div className="text-2xl font-bold text-zinc-950">{pendingCount}</div>
                  <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Pending in DB</div>
                </div>
                <div className="px-5 py-3 text-center">
                  <div className="text-2xl font-bold text-zinc-950">
                    {documents.filter((d) => d.status === "analyzed").length}
                  </div>
                  <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Analyzed Total</div>
                </div>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="border border-rose-300 bg-rose-50 p-4 text-xs font-medium text-rose-800 flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Lera Progress Box (During Execution) */}
          {isProcessing && batchStatus && (
            <div className="border border-zinc-950 bg-zinc-950 text-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Executing Batch Processing Pipeline
                    </h3>
                    <p className="text-xs text-zinc-300">{batchStatus.current_step}</p>
                  </div>
                </div>
                <span className="text-base font-bold text-white">{progressPct}%</span>
              </div>

              {/* Sharp Progress Bar */}
              <div className="h-2 w-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-500 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>
                  Processed {batchStatus.processed_files} of {batchStatus.total_files} submissions
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  Sequential processing active (Groq & Hugging Face rate-safe)
                </span>
              </div>
            </div>
          )}

          {/* Consolidated Batch Results (shown when completed) */}
          {batchStatus && batchStatus.status === "completed" && summary && (
            <div className="space-y-6">
              {/* Lera Box: Synthesis Header */}
              <div className="border border-zinc-200 bg-white shadow-2xs">
                <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    <span className="font-bold text-zinc-950">
                      Consolidated Batch Synthesis Results
                    </span>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="border border-zinc-300 bg-white px-3 py-1 text-xs font-semibold text-zinc-800 shadow-2xs hover:bg-zinc-50 transition"
                  >
                    Print Synthesis Report
                  </button>
                </div>

                {/* 4 Connected Lera Metric Boxes */}
                <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-zinc-200 divide-x divide-y sm:divide-y-0 divide-zinc-200">
                  <div className="p-5 space-y-1">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>Total Submissions</span>
                      <FileText className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div className="text-2xl font-bold text-zinc-950">{summary.total_documents}</div>
                    <p className="text-[11px] text-zinc-500">Processed from SQLite</p>
                  </div>

                  <div className="p-5 space-y-1">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>Extracted Comments</span>
                      <Users className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div className="text-2xl font-bold text-zinc-950">{summary.total_comments}</div>
                    <p className="text-[11px] text-zinc-500">Categorized by clause</p>
                  </div>

                  <div className="p-5 space-y-1">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>Consultation Stance</span>
                      <Scale className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div className="text-sm font-bold text-zinc-950 truncate pt-1">{dominantStance}</div>
                    <p className="text-[11px] text-zinc-500">Dominant Consensus</p>
                  </div>

                  <div className="p-5 space-y-1">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>Sentiment Breakdown</span>
                      <BarChart3 className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div className="text-xs font-semibold text-zinc-800 space-y-0.5 pt-1">
                      <div className="flex justify-between">
                        <span className="text-emerald-700">Support:</span>
                        <span>{posPct}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-rose-700">Concerns:</span>
                        <span>{negPct}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Consensus Matrix - 3 Connected Lera Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-200">
                  {/* Shared Agreements */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-2 text-xs font-bold text-zinc-950">
                      <span className="flex items-center gap-1.5 text-emerald-800">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Broad Consensus Areas
                      </span>
                      <span className="border border-zinc-200 bg-zinc-50 px-1.5 py-0.2 text-[10px] text-zinc-700">
                        {agreements.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {agreements.length > 0 ? (
                        agreements.map((item, idx) => (
                          <div
                            key={idx}
                            className="border border-zinc-200 bg-zinc-50/60 p-3 text-xs text-zinc-800 leading-relaxed border-l-2 border-l-emerald-600"
                          >
                            {item}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-zinc-400 italic">No universal agreements detected.</p>
                      )}
                    </div>
                  </div>

                  {/* Points of Contention */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-2 text-xs font-bold text-zinc-950">
                      <span className="flex items-center gap-1.5 text-rose-800">
                        <AlertTriangle className="h-4 w-4 text-rose-600" />
                        Points of Contention
                      </span>
                      <span className="border border-zinc-200 bg-zinc-50 px-1.5 py-0.2 text-[10px] text-zinc-700">
                        {disagreements.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {disagreements.length > 0 ? (
                        disagreements.map((item, idx) => (
                          <div
                            key={idx}
                            className="border border-zinc-200 bg-zinc-50/60 p-3 text-xs text-zinc-800 leading-relaxed border-l-2 border-l-rose-600"
                          >
                            {item}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-zinc-400 italic">No contentious points detected.</p>
                      )}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-2 text-xs font-bold text-zinc-950">
                      <span className="flex items-center gap-1.5 text-blue-800">
                        <Lightbulb className="h-4 w-4 text-blue-600" />
                        Policy Recommendations
                      </span>
                      <span className="border border-zinc-200 bg-zinc-50 px-1.5 py-0.2 text-[10px] text-zinc-700">
                        {recommendations.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {recommendations.length > 0 ? (
                        recommendations.map((item, idx) => (
                          <div
                            key={idx}
                            className="border border-zinc-200 bg-zinc-50/60 p-3 text-xs text-zinc-800 leading-relaxed border-l-2 border-l-blue-600"
                          >
                            {item}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-zinc-400 italic">No draft amendments generated.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submissions Index Table */}
                <div className="border-t border-zinc-200">
                  <div className="bg-zinc-50 px-5 py-2.5 text-xs font-bold text-zinc-900 border-b border-zinc-200">
                    Submissions Processed in this Batch ({batchStatus.documents?.length || 0})
                  </div>
                  <div className="divide-y divide-zinc-200">
                    {batchStatus.documents && batchStatus.documents.length > 0 ? (
                      batchStatus.documents.map((doc: any) => (
                        <div
                          key={doc.document_id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 hover:bg-zinc-50 transition"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-zinc-600 shrink-0" />
                            <div>
                              <div className="text-xs font-bold text-zinc-950">{doc.filename}</div>
                              <div className="text-[11px] text-zinc-500 font-mono">
                                Comments: {doc.total_comments || 0} • Status: {doc.status || "analyzed"}
                              </div>
                            </div>
                          </div>
                          <span className="border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 self-start sm:self-auto">
                            Analyzed & Indexed
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-zinc-500">
                        No individual document details available.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Two Lera Cards: DB Queue & Multi-Upload */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Submissions in SQLite Queue */}
            <div className="border border-zinc-200 bg-white shadow-2xs flex flex-col justify-between">
              <div className="space-y-4">
                {/* Titlebar */}
                <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-zinc-700" />
                    <span className="font-bold text-zinc-950">
                      SQLite Consultation Database Queue
                    </span>
                  </div>
                  <span className="border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-bold text-zinc-800">
                    {pendingCount} Pending Files
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Citizen and stakeholder PDFs uploaded to the consultation portal are stored in SQLite (<code className="font-mono text-zinc-800">civisense.db</code>). Clicking <strong>Execute Batch Processing</strong> will run AI synthesis across all pending submissions.
                  </p>

                  {/* List of Pending Documents */}
                  <div className="border border-zinc-200 bg-zinc-50/50 divide-y divide-zinc-200 max-h-56 overflow-y-auto">
                    {pendingDocs.length > 0 ? (
                      pendingDocs.map((doc) => (
                        <div
                          key={doc.document_id}
                          className="flex items-center justify-between px-3.5 py-2.5 text-xs bg-white"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                            <span className="font-medium text-zinc-900 truncate">
                              {doc.filename}
                            </span>
                          </div>
                          <span className="border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 shrink-0">
                            Pending Review
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-xs text-zinc-500">
                        No pending submissions waiting in the database.
                        <p className="mt-1 text-[11px] text-zinc-400">
                          Click below to load 3 sample consultation PDFs or upload new ones.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-0 space-y-2.5">
                <button
                  onClick={handleProcessPending}
                  disabled={pendingCount === 0 || isProcessing}
                  className="w-full flex items-center justify-center gap-2 bg-zinc-950 px-4 py-3 text-xs font-bold text-white shadow-2xs transition hover:bg-zinc-800 disabled:opacity-40"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>Execute Batch Processing ({pendingCount} Files)</span>
                </button>

                <button
                  onClick={handleLoadDemoBatch}
                  disabled={isLoadingSample || isProcessing}
                  className="w-full flex items-center justify-center gap-2 border border-zinc-300 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-800 shadow-2xs hover:bg-zinc-50 transition disabled:opacity-50"
                >
                  {isLoadingSample ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-zinc-700" />
                  )}
                  <span>
                    {isLoadingSample
                      ? "Adding Demo Files..."
                      : "Add 3 Sample Stakeholder Submissions to DB"}
                  </span>
                </button>
              </div>
            </div>

            {/* Card 2: Upload Multiple New Submissions Directly */}
            <div className="border border-zinc-200 bg-white shadow-2xs flex flex-col justify-between">
              <div className="space-y-4">
                {/* Titlebar */}
                <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-xs">
                  <div className="flex items-center gap-2">
                    <UploadCloud className="h-4 w-4 text-zinc-700" />
                    <span className="font-bold text-zinc-950">
                      Upload Multiple Submissions to Batch
                    </span>
                  </div>
                  <span className="border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                    Direct Multi-File Ingestion
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Upload multiple consultation feedback PDFs simultaneously to save them to SQLite and execute batch synthesis in one continuous run.
                  </p>

                  {/* Dropzone */}
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed p-6 text-center cursor-pointer transition ${
                      isDragActive
                        ? "border-zinc-900 bg-zinc-100"
                        : "border-zinc-300 bg-zinc-50/50 hover:border-zinc-400 hover:bg-zinc-100/60"
                    }`}
                  >
                    <input {...getInputProps()} />
                    <UploadCloud className="mx-auto h-8 w-8 text-zinc-500 mb-2" />
                    <p className="text-xs font-bold text-zinc-900">
                      Click to select multiple consultation PDFs or drag and drop
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      PDF format • 3-5 files recommended
                    </p>
                  </div>

                  {/* Selected File Badges */}
                  {uploadedBatchFiles.length > 0 && (
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      <div className="text-[11px] font-bold text-zinc-500">
                        Selected Files ({uploadedBatchFiles.length}):
                      </div>
                      {uploadedBatchFiles.map((file, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-800"
                        >
                          <span className="truncate">{file.name}</span>
                          <span className="text-[10px] text-zinc-500 shrink-0 font-mono">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="p-5 pt-0">
                <button
                  onClick={handleUploadAndRunBatch}
                  disabled={uploadedBatchFiles.length === 0 || isProcessing}
                  className="w-full flex items-center justify-center gap-2 bg-zinc-950 px-4 py-3 text-xs font-bold text-white shadow-2xs transition hover:bg-zinc-800 disabled:opacity-40"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Upload & Synthesize Batch ({uploadedBatchFiles.length} Files)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
