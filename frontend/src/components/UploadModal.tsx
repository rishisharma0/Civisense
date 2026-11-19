"use client";

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  FileText,
  X,
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Building2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadAndAnalyze: (file: File) => Promise<void>;
  onBatchComplete: (batchStatus: any) => void;
  isAnalyzing: boolean;
  analysisStep: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadAndAnalyze,
  isAnalyzing,
  analysisStep,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveOnlyPending, setSaveOnlyPending] = useState(false);
  const [isSavingPending, setIsSavingPending] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: isAnalyzing || isSavingPending,
    onDrop: (accepted, rejected) => {
      if (rejected.length > 0) {
        setError("Only PDF consultation documents are supported.");
        return;
      }
      if (accepted.length > 0) {
        setSelectedFile(accepted[0]);
        setError(null);
        setSaveSuccessMsg(null);
      }
    },
  });

  if (!isOpen) return null;

  // Handle immediate upload & full analysis
  const handleStartAnalysis = async () => {
    if (!selectedFile) return;
    try {
      setError(null);
      await onUploadAndAnalyze(selectedFile);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Analysis failed.";
      setError(msg);
    }
  };

  // Handle upload to SQLite only (pending for batch processing)
  const handleSaveToPending = async () => {
    if (!selectedFile) return;
    try {
      setIsSavingPending(true);
      setError(null);
      await api.uploadDocument(selectedFile);
      setSaveSuccessMsg(`"${selectedFile.name}" has been saved to the database. It will be included in the next batch processing cycle.`);
      setSelectedFile(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save submission.";
      setError(msg);
    } finally {
      setIsSavingPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Building2 className="h-5 w-5 text-slate-800" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Upload Consultation Document
              </h2>
              <p className="text-xs text-slate-500">
                Official Submission Ingestion Portal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isAnalyzing || isSavingPending}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {saveSuccessMsg && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {isAnalyzing ? (
            /* Progress State */
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <Loader2 className="h-10 w-10 animate-spin text-slate-900" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-sm font-semibold text-slate-900">
                  Analyzing Consultation Document
                </h3>
                <p className="text-xs text-slate-500">
                  {analysisStep || "Extracting statutory clauses and stakeholder stance..."}
                </p>
              </div>
              <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-1.5 text-[11px] text-slate-600 flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Saved securely to consultation database</span>
              </div>
            </div>
          ) : (
            /* Upload Zone */
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                  isDragActive
                    ? "border-blue-600 bg-blue-50/50"
                    : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
                }`}
              >
                <input {...getInputProps()} />
                <UploadCloud className="mx-auto h-10 w-10 text-slate-400 mb-3" />
                <p className="text-sm font-medium text-slate-800">
                  {selectedFile
                    ? selectedFile.name
                    : "Choose a consultation PDF or drag and drop"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports consultation papers, stakeholder memorandums, and feedback reports (PDF up to 25MB)
                </p>
              </div>

              {selectedFile && (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800">
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                    <span className="font-medium truncate">{selectedFile.name}</span>
                    <span className="text-[11px] text-slate-400">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Mode choice */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="text-xs font-semibold text-slate-800">
                  Choose Workflow:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSaveOnlyPending(false)}
                    className={`p-3 rounded-lg border text-left transition ${
                      !saveOnlyPending
                        ? "border-slate-900 bg-white shadow-xs text-slate-900 font-semibold"
                        : "border-slate-200 bg-white/50 text-slate-600 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-slate-900">
                      <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                      <span>Upload & Analyze Now</span>
                    </div>
                    <p className="text-[11px] font-normal text-slate-500">
                      Saves to database and immediately displays complete dashboard.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSaveOnlyPending(true)}
                    className={`p-3 rounded-lg border text-left transition ${
                      saveOnlyPending
                        ? "border-slate-900 bg-white shadow-xs text-slate-900 font-semibold"
                        : "border-slate-200 bg-white/50 text-slate-600 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-slate-900">
                      <FileText className="h-3.5 w-3.5 text-slate-600" />
                      <span>Queue for Batch Processing</span>
                    </div>
                    <p className="text-[11px] font-normal text-slate-500">
                      Saves submission to DB for official batch review.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!isAnalyzing && (
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              onClick={onClose}
              disabled={isSavingPending}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-400 transition"
            >
              Cancel
            </button>

            {saveOnlyPending ? (
              <button
                onClick={handleSaveToPending}
                disabled={!selectedFile || isSavingPending}
                className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition"
              >
                {isSavingPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileText className="h-3.5 w-3.5" />
                )}
                <span>Save to Submissions Database</span>
              </button>
            ) : (
              <button
                onClick={handleStartAnalysis}
                disabled={!selectedFile || isAnalyzing}
                className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition"
              >
                <span>Upload & View Analysis</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
