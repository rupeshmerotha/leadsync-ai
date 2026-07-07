"use client";

import React, { useCallback } from "react";
import { UploadCloud } from "lucide-react";

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

export default function FileUpload({ onFileUpload }: FileUploadProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type === "text/csv" || file.name.endsWith(".csv")) {
          onFileUpload(file);
        } else {
          alert("Please upload a valid CSV file.");
        }
      }
    },
    [onFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        if (file.type === "text/csv" || file.name.endsWith(".csv")) {
          onFileUpload(file);
        } else {
          alert("Please upload a valid CSV file.");
        }
      }
    },
    [onFileUpload]
  );

  return (
    <div
      className="group relative border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-16 text-center bg-white dark:bg-zinc-900 hover:border-brand-500 hover:bg-brand-50/50 dark:hover:border-brand-500/50 dark:hover:bg-brand-500/5 transition-all duration-300 cursor-pointer overflow-hidden shadow-sm hover:shadow-md"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => document.getElementById("fileInput")?.click()}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-50/20 dark:to-brand-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30 transition-transform duration-300">
          <UploadCloud className="h-8 w-8 text-slate-400 dark:text-zinc-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" />
        </div>
        <h3 className="mt-6 text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Click or drag your CSV here
        </h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400 font-medium">
          Supports .csv files
        </p>
      </div>

      <input
        id="fileInput"
        type="file"
        accept=".csv, text/csv"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
