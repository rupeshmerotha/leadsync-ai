"use client";

import { useState } from "react";
import Papa from "papaparse";
import { Sun, Moon } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import DataTable from "@/components/DataTable";

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  records: Record<string, any>[];
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);

  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ImportResult | null>(null);

  const handleFileUpload = (uploadedFile: File) => {
    setFile(uploadedFile);
    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setPreviewColumns(Object.keys(results.data[0] as object));
          setPreviewData(results.data as Record<string, string>[]);
        }
      },
    });
  };

  const handleConfirmImport = async () => {
    if (!file) return;

    setProcessing(true);
    setResults(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Import failed:", error);
      alert("An error occurred during import.");
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData([]);
    setPreviewColumns([]);
    setResults(null);
  };

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
      {/* Soft animated background elements */}
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-400/20 dark:bg-brand-600/10 rounded-full blur-[120px]"></div>
      <div className="pointer-events-none absolute bottom-[-10%] right-[-5%] w-[35%] h-[40%] bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-[120px]"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 sm:px-8 space-y-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/25">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">LeadSync</span>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
            title="Toggle Theme"
          >
            <Sun className="h-5 w-5 hidden dark:block" />
            <Moon className="h-5 w-5 block dark:hidden" />
          </button>
        </header>

        <div className="text-center max-w-3xl mx-auto pt-8 pb-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-brand-800 to-slate-900 dark:from-white dark:via-brand-200 dark:to-white sm:text-6xl drop-shadow-sm pb-2">
            Intelligent Data Mapping
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-zinc-400 font-medium">
            Seamlessly transform and map arbitrary CSV columns into our strict CRM schema using the power of AI.
          </p>
        </div>

        {!file && !results && (
          <div className="max-w-2xl mx-auto mt-4 transform transition-all">
            <FileUpload onFileUpload={handleFileUpload} />
          </div>
        )}

        {file && !processing && !results && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Preview Your Data
                </h2>
                <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
                  File: <span className="font-semibold text-slate-700 dark:text-zinc-300">{file.name}</span>
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-400 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700 dark:hover:border-zinc-600 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-500 rounded-xl shadow-md shadow-brand-500/20 hover:shadow-lg hover:shadow-brand-500/30 hover:from-brand-500 hover:to-brand-400 border border-transparent transition-all active:scale-95"
                >
                  Start Import
                </button>
              </div>
            </div>

            <DataTable columns={previewColumns} data={previewData} />
          </div>
        )}

        {processing && (
          <div className="flex flex-col items-center justify-center py-32 animate-in fade-in duration-500">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-brand-200 dark:border-brand-900/50 rounded-full"></div>
              <div className="w-20 h-20 border-4 border-brand-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <h3 className="mt-8 text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              AI is mapping your records...
            </h3>
            <p className="mt-2 text-slate-500 dark:text-zinc-400 font-medium">
              This usually takes a few moments for large files.
            </p>
          </div>
        )}

        {results && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Import Results
              </h2>
              <button
                onClick={handleReset}
                className="px-5 py-2.5 text-sm font-semibold text-brand-700 bg-brand-50 border border-brand-200 rounded-xl shadow-sm hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:border-brand-500/20 dark:hover:bg-brand-500/20 transition-all active:scale-95"
              >
                Import Another File
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="px-6 py-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <dt className="text-sm font-semibold text-slate-500 dark:text-zinc-400">Successfully Imported</dt>
                <dd className="mt-2 text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">{results.imported || 0}</dd>
              </div>
              <div className="px-6 py-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <dt className="text-sm font-semibold text-slate-500 dark:text-zinc-400">Skipped Records</dt>
                <dd className="mt-2 text-4xl font-extrabold text-rose-600 dark:text-rose-500">{results.skipped || 0}</dd>
              </div>
              <div className="px-6 py-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <dt className="text-sm font-semibold text-slate-500 dark:text-zinc-400">Total Processed</dt>
                <dd className="mt-2 text-4xl font-extrabold text-slate-900 dark:text-white">{(results.imported || 0) + (results.skipped || 0)}</dd>
              </div>
            </div>

            {results.records && results.records.length > 0 && (
              <div className="mt-10">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Mapped Records</h3>
                <DataTable
                  columns={Object.keys(results.records[0])}
                  data={results.records}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
