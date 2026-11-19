"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Layers,
  UploadCloud,
  FileCheck2,
} from "lucide-react";

interface NavbarProps {
  pendingCount?: number;
  backendOnline?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  pendingCount = 0,
  backendOnline = true,
}) => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white shadow-2xs">
      {/* Official Government Top Bar */}
      <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-1.5 text-xs text-zinc-600 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-900">CiviSense</span>
            <span className="text-zinc-400">•</span>
            <span>Public Consultation & Legislative Feedback Intelligence System</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={`h-2 w-2 rounded-xs ${
                  backendOnline ? "bg-emerald-600" : "bg-rose-500"
                }`}
              />
              <span className="font-medium text-zinc-800">
                {backendOnline ? "System Active" : "System Offline"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Portal Choice */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-none bg-zinc-900 text-white shadow-2xs">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-zinc-950">
                CiviSense
              </span>
              <span className="ml-2 border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-700">
                Official Portal
              </span>
            </div>
          </Link>

          {/* Navigation Links - Lera box style */}
          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className={`flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium transition ${
                pathname === "/"
                  ? "border-zinc-900 bg-zinc-900 text-white font-semibold"
                  : "border-transparent text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Submit Consultation PDF</span>
            </Link>

            <Link
              href="/batch"
              className={`flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium transition relative ${
                pathname === "/batch"
                  ? "border-zinc-900 bg-zinc-900 text-white font-semibold"
                  : "border-transparent text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Government Batch Processing</span>
              {pendingCount > 0 && (
                <span className="ml-1 bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </Link>
          </nav>
        </div>

        {/* Right Info */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-600">
          <span className="border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium">
            Database: SQLite (civisense.db)
          </span>
        </div>
      </div>
    </header>
  );
};
