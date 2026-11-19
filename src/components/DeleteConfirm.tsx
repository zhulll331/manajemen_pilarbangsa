"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useId, useRef } from "react";

interface DeleteConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  loading?: boolean;
}

function isPointerOutsideDialog(
  e: React.PointerEvent<HTMLDialogElement>,
  dialog: HTMLDialogElement
): boolean {
  const r = dialog.getBoundingClientRect();
  return (
    e.clientX < r.left ||
    e.clientX > r.right ||
    e.clientY < r.top ||
    e.clientY > r.bottom
  );
}

export function DeleteConfirm({
  isOpen,
  onClose,
  onConfirm,
  title = "Hapus Data",
  message = "Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.",
  loading = false,
}: DeleteConfirmProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressedOutsideRef = useRef(false);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descId}
      onCancel={(e) => {
        if (loading) e.preventDefault();
      }}
      onClose={() => {
        if (!loading) onClose();
      }}
      onPointerDown={(e) => {
        pressedOutsideRef.current = isPointerOutsideDialog(e, e.currentTarget);
      }}
      onPointerUp={(e) => {
        if (
          !loading &&
          !('closedBy' in HTMLDialogElement.prototype) &&
          pressedOutsideRef.current &&
          isPointerOutsideDialog(e, e.currentTarget)
        ) {
          e.currentTarget.close();
        }
        pressedOutsideRef.current = false;
      }}
      {...({ closedby: loading ? "none" : "any" } as Record<string, string>)}
      className="bg-white rounded-2xl shadow-2xl w-[calc(100%-2rem)] max-w-sm p-6 text-center border-0"
    >
      <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertTriangle size={28} className="text-red-500" aria-hidden="true" />
      </div>
      <h2 id={titleId} className="text-lg font-bold text-gray-800 mb-2">
        {title}
      </h2>
      <p id={descId} className="text-sm text-gray-500 mb-6">
        {message}
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          autoFocus
          onClick={onClose}
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {loading ? "Menghapus..." : "Hapus"}
        </button>
      </div>
    </dialog>
  );
}
