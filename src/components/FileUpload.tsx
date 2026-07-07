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
      className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => document.getElementById("fileInput")?.click()}
    >
      <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
        Click or drag CSV to upload
      </h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        CSV files only
      </p>
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
