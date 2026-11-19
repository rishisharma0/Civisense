"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import { api } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Building2,
  ArrowRight,
  ShieldCheck,
  Inbox,
  Database,
  Layers,
} from "lucide-react";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<{
    document_id: string;
    filename: string;
    uploaded_at?: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [backendOnline, setBackendOnline] = useState(true);

  // Load pending count for header
  const loadPendingCount = async () => {
    try {
      const res = await api.getPendingSubmissions();
      setPendingCount(res.pending_count);
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
    }
  };

  useEffect(() => {
    loadPendingCount();
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: isUploading,
    onDrop: (accepted, rejected) => {
      if (rejected.length > 0) {
        setErrorMsg("Only PDF consultation files are accepted.");
        return;
      }
      if (accepted.length > 0) {
        setSelectedFile(accepted[0]);
        setErrorMsg(null);
        setUploadSuccess(null);
      }
    },
  });

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    try {
      setIsUploading(true);
      setErrorMsg(null);
      // Upload document directly to SQLite database as pending
      const res = await api.uploadDocument(selectedFile);
      setUploadSuccess({
        document_id: res.document_id,
        filename: res.filename,
        uploaded_at: new Date().toISOString(),
      });
      setSelectedFile(null);
      await loadPendingCount();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      setErrorMsg(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 antialiased selection:bg-zinc-900 selection:text-white">
      <Navbar pendingCount={pendingCount} backendOnline={backendOnline} />

      <main className="flex-1 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
          {/* Lera Box: Main Submission Portal */}
          <div className="border border-zinc-200 bg-white shadow-2xs">
            {/* Box Titlebar */}
            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-xs">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-zinc-700" />
                <span className="font-bold text-zinc-900">
                  Public Consultation Submission Portal
                </span>
              </div>
              <span className="border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                Citizen & Stakeholder Ingestion
              </span>
            </div>

            {/* Box Body */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
                  Submit Consultation Feedback or Representation
                </h1>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Upload your consultation paper, stakeholder feedback, or policy memorandum in PDF format. Once submitted, your file is securely recorded in the consultation database (SQLite) for official legislative batch analysis.
                </p>
              </div>

              {errorMsg && (
                <div className="border border-rose-300 bg-rose-50 p-4 text-xs font-medium text-rose-800 flex items-center gap-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {uploadSuccess ? (
                /* Success Confirmation Box - Lera style */
                <div className="border border-emerald-300 bg-emerald-50/60 p-6 space-y-4">
                  <div className="flex items-start gap-3.5">
                    <CheckCircle2 className="h-6 w-6 text-emerald-700 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-emerald-950">
                        Submission Successfully Saved to Database
                      </h3>
                      <p className="text-xs text-emerald-800 leading-relaxed">
                        Your consultation document has been safely ingested into the SQLite consultation database (<code className="font-mono font-semibold">civisense.db</code>). It is queued with status <span className="font-semibold underline">Pending Review</span> for government batch processing.
                      </p>
                    </div>
                  </div>

                  <div className="border border-emerald-200 bg-white p-4 text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Document ID:</span>
                      <span className="font-bold text-zinc-900">{uploadSuccess.document_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Stored Name:</span>
                      <span className="text-zinc-900">{uploadSuccess.filename}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Database Status:</span>
                      <span className="font-semibold text-emerald-700">STORED // PENDING_BATCH_REVIEW</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      onClick={() => {
                        setUploadSuccess(null);
                        setSelectedFile(null);
                      }}
                      className="w-full sm:w-auto border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-800 shadow-2xs hover:bg-zinc-50 transition"
                    >
                      Submit Another Document
                    </button>

                    <Link
                      href="/batch"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-950 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-zinc-800 transition"
                    >
                      <Layers className="h-3.5 w-3.5" />
                      <span>Go to Government Batch Portal</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                /* Upload Dropzone & Action */
                <div className="space-y-5">
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed p-8 sm:p-10 text-center cursor-pointer transition ${
                      isDragActive
                        ? "border-zinc-900 bg-zinc-100"
                        : "border-zinc-300 bg-zinc-50/50 hover:border-zinc-400 hover:bg-zinc-100/60"
                    }`}
                  >
                    <input {...getInputProps()} />
                    <UploadCloud className="mx-auto h-10 w-10 text-zinc-500 mb-3" />
                    <p className="text-sm font-semibold text-zinc-900">
                      {selectedFile
                        ? selectedFile.name
                        : "Click to select a consultation PDF or drag and drop here"}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Consultation paper, legal memorandum, industry comments (PDF format)
                    </p>
                  </div>

                  {selectedFile && (
                    <div className="flex items-center justify-between border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs">
                      <div className="flex items-center gap-3 truncate">
                        <FileText className="h-4 w-4 text-zinc-700 shrink-0" />
                        <span className="font-semibold text-zinc-900 truncate">
                          {selectedFile.name}
                        </span>
                        <span className="text-zinc-500 shrink-0">
                          ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="text-xs text-zinc-500 hover:text-rose-700 underline font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleUploadSubmit}
                    disabled={!selectedFile || isUploading}
                    className="w-full flex items-center justify-center gap-2 bg-zinc-950 px-5 py-3 text-xs font-bold text-white shadow-2xs transition hover:bg-zinc-800 disabled:opacity-40"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving Document to SQLite Database...</span>
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4" />
                        <span>Save Consultation Document to Database</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Lera 3-Column Explanatory Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 border border-zinc-200 bg-white divide-y md:divide-y-0 md:divide-x divide-zinc-200 shadow-2xs">
            <div className="p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-950">
                <Inbox className="h-4 w-4 text-zinc-700" />
                <span>1. Citizen Ingestion</span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Stakeholders upload their consultation representations. Files are immediately validated and saved with unique references.
              </p>
            </div>

            <div className="p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-950">
                <Database className="h-4 w-4 text-zinc-700" />
                <span>2. SQLite Storage</span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Submissions are stored in <code className="font-mono text-[11px] text-zinc-800">civisense.db</code> with status <span className="font-medium text-amber-700">pending</span>, awaiting official legislative batch processing.
              </p>
            </div>

            <div className="p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-950">
                <Layers className="h-4 w-4 text-zinc-700" />
                <span>3. Batch Processing</span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Government officials trigger batch analysis from the official portal. AI parses all submissions and generates consolidated synthesis.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
