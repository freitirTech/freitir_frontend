"use client";

import { useState } from "react";

type UploadResponse = {
  filename: string;
  row_count: number;
  column_count: number;
  columns: string[];
  preview_rows: Record<string, unknown>[];
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<UploadResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setLoading(true);
    setError("");
    setData(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8000/upload/plan", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Upload failed.");
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">FREITIR</h1>
        <p className="mt-2 text-gray-600">
          Upload a transport plan and preview the parsed file.
        </p>

        <div className="mt-8 rounded-xl border p-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700">
            Select CSV or Excel file
          </label>

          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0] || null;
              setFile(selectedFile);
            }}
            className="mt-3 block w-full rounded-md border p-2"
          />

          <button
            onClick={handleUpload}
            disabled={loading}
            className="mt-4 rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Upload Plan"}
          </button>

          {error && (
            <p className="mt-4 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        {data && (
          <div className="mt-8 rounded-xl border p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Parsed Preview</h2>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-gray-500">Filename</p>
                <p className="font-medium">{data.filename}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-gray-500">Rows</p>
                <p className="font-medium">{data.row_count}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-gray-500">Columns</p>
                <p className="font-medium">{data.column_count}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-gray-500">Detected Fields</p>
                <p className="font-medium">{data.columns.length}</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium">Columns</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.columns.map((column) => (
                  <span
                    key={column}
                    className="rounded-full border px-3 py-1 text-sm"
                  >
                    {column}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <h3 className="mb-3 text-lg font-medium">Preview Rows</h3>
              <table className="min-w-full border-collapse border text-sm">
                <thead>
                  <tr>
                    {data.columns.map((column) => (
                      <th
                        key={column}
                        className="border bg-gray-50 px-3 py-2 text-left"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.preview_rows.map((row, index) => (
                    <tr key={index}>
                      {data.columns.map((column) => (
                        <td key={column} className="border px-3 py-2">
                          {row[column] !== null && row[column] !== undefined
                            ? String(row[column])
                            : ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}