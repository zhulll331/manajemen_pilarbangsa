"use client";

import { useEffect, useRef, useState } from "react";
import { Edit2, Trash2, FileText, ChevronLeft, ChevronRight } from "lucide-react";

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
  align?: "left" | "center" | "right" | string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  emptyMessage?: string;
  pagination?: boolean;
  pageSize?: number;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  isRowSelectable?: (item: T) => boolean;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  onEdit,
  onDelete,
  emptyMessage = "Belum ada data.",
  pagination = false,
  pageSize = 10,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  isRowSelectable,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const currentData = pagination ? data.slice(startIndex, startIndex + pageSize) : data;

  const selectedSet = new Set(selectedIds);
  const selectablePageItems = selectable
    ? currentData.filter((item) => (isRowSelectable ? isRowSelectable(item) : true))
    : [];
  const allPageSelected =
    selectablePageItems.length > 0 &&
    selectablePageItems.every((item) => selectedSet.has(item.id));
  const somePageSelected =
    selectablePageItems.some((item) => selectedSet.has(item.id)) && !allPageSelected;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = somePageSelected;
    }
  }, [somePageSelected]);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-200/80 shadow-xs">
        <FileText size={48} className="mb-4 opacity-50" />
        <p className="text-sm font-medium">{emptyMessage}</p>
      </div>
    );
  }

  const getAlignClass = (align?: string) => {
    if (align === "right") return "text-right";
    if (align === "center") return "text-center";
    return "text-left";
  };

  const toggleAllOnPage = () => {
    if (!onSelectionChange) return;
    const next = new Set(selectedSet);
    if (allPageSelected) {
      for (const item of selectablePageItems) {
        next.delete(item.id);
      }
    } else {
      for (const item of selectablePageItems) {
        next.add(item.id);
      }
    }
    onSelectionChange(Array.from(next));
  };

  const toggleRow = (id: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedSet);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(Array.from(next));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tabel data">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50/90 border-b border-gray-200/70 text-gray-700">
            <tr>
              {selectable && (
                <th className="py-3.5 pl-4 pr-2 w-10 text-center">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={allPageSelected}
                    disabled={selectablePageItems.length === 0}
                    onChange={toggleAllOnPage}
                    aria-label="Pilih semua baris di halaman ini"
                    className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer disabled:opacity-40"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`py-3.5 px-4 font-semibold text-xs tracking-wider text-gray-600 uppercase whitespace-nowrap ${getAlignClass(col.align)}`}
                >
                  {col.label}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="py-3.5 px-4 font-semibold text-xs tracking-wider text-gray-600 uppercase text-center w-24 whitespace-nowrap">
                  Aksi
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentData.map((item) => {
              const rowCanSelect = selectable && (isRowSelectable ? isRowSelectable(item) : true);
              const isChecked = selectedSet.has(item.id);
              return (
                <tr
                  key={item.id}
                  className={`transition-colors ${
                    isChecked ? "bg-red-50/40" : "hover:bg-blue-50/40"
                  }`}
                >
                  {selectable && (
                    <td className="py-3.5 pl-4 pr-2 align-middle text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={!rowCanSelect}
                        onChange={() => toggleRow(item.id)}
                        aria-label="Pilih baris"
                        className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={`py-3.5 px-4 align-middle ${getAlignClass(col.align)}`}
                    >
                      {col.render
                        ? col.render(item)
                        : String((item as Record<string, unknown>)[col.key as string] ?? "-")}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="py-3.5 px-4 align-middle">
                      <div className="flex items-center justify-center gap-1">
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
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
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pagination && totalPages > 1 && (
        <div className="admin-table-pagination flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
          <span className="text-sm text-gray-500">
            Menampilkan <span className="font-medium">{startIndex + 1}</span> hingga{" "}
            <span className="font-medium">{Math.min(startIndex + pageSize, data.length)}</span> dari{" "}
            <span className="font-medium">{data.length}</span> data
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
              aria-label="Halaman sebelumnya"
              disabled={safePage === 1}
              className="p-1 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-medium text-gray-700 px-2">
              Halaman {safePage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
              aria-label="Halaman berikutnya"
              disabled={safePage === totalPages}
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
