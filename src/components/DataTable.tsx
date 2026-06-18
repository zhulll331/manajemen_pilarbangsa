"use client";

import { useState } from "react";
import { Edit2, Trash2, FileText, ChevronLeft, ChevronRight } from "lucide-react";

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  emptyMessage?: string;
  pagination?: boolean;
  pageSize?: number;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  onEdit,
  onDelete,
  emptyMessage = "Belum ada data.",
  pagination = false,
  pageSize = 10,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <FileText size={48} className="mb-4 opacity-50" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentData = pagination ? data.slice(startIndex, startIndex + pageSize) : data;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-gray-600">
        <thead className="bg-gray-50 text-gray-700">
          <tr>
            {columns.map((col, i) => (
              <th
                key={String(col.key)}
                className={`py-3 px-4 font-medium ${
                  i === 0 ? "rounded-tl-lg rounded-bl-lg" : ""
                } ${
                  i === columns.length - 1 && !onEdit && !onDelete
                    ? "rounded-tr-lg rounded-br-lg"
                    : ""
                }`}
              >
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th className="py-3 px-4 font-medium rounded-tr-lg rounded-br-lg text-center w-24">
                Aksi
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {currentData.map((item, rowIndex) => (
            <tr
              key={item.id}
              className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
            >
              {columns.map((col) => (
                <td key={String(col.key)} className="py-3 px-4">
                  {col.render
                    ? col.render(item)
                    : String((item as Record<string, unknown>)[col.key as string] ?? "-")}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-1">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
          <span className="text-sm text-gray-500">
            Menampilkan <span className="font-medium">{startIndex + 1}</span> hingga{" "}
            <span className="font-medium">{Math.min(startIndex + pageSize, data.length)}</span> dari{" "}
            <span className="font-medium">{data.length}</span> data
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-medium text-gray-700 px-2">
              Halaman {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
