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
    <main className="min-h-screen p-8 bg-gray-50 dark:bg-zinc-950 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-end">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors"
            title="Toggle Light/Dark Mode"
          >
            <Sun className="h-5 w-5 hidden dark:block" />
            <Moon className="h-5 w-5 block dark:hidden" />
          </button>
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            LeadSync AI
          </h1>
          <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-gray-400">
            Intelligently map arbitrary CSV columns to our CRM schema.
          </p>
        </div>

        {!file && !results && (
          <div className="max-w-2xl mx-auto mt-10">
            <FileUpload onFileUpload={handleFileUpload} />
          </div>
        )}

        {file && !processing && !results && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Preview: {file.name}
              </h2>
              <div className="flex gap-4">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                >
                  Confirm Import
                </button>
              </div>
            </div>

            <DataTable columns={previewColumns} data={previewData} />
          </div>
        )}

        {processing && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-6 text-lg font-medium text-gray-900 dark:text-white">
              AI is processing your records...
            </p>
          </div>
        )}

        {results && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Import Results
              </h2>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
              >
                Import Another File
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="px-4 py-5 overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Successfully Imported</dt>
                <dd className="mt-1 text-3xl font-semibold text-green-600">{results.imported || 0}</dd>
              </div>
              <div className="px-4 py-5 overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Skipped Records</dt>
                <dd className="mt-1 text-3xl font-semibold text-red-600">{results.skipped || 0}</dd>
              </div>
              <div className="px-4 py-5 overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Processed</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{(results.imported || 0) + (results.skipped || 0)}</dd>
              </div>
            </div>

            {results.records && results.records.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Imported Records</h3>
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
