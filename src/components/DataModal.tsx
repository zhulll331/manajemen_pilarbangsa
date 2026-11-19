"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

interface DataModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
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

export function DataModal({ isOpen, onClose, title, children }: DataModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressedOutsideRef = useRef(false);
  const titleId = useId();

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
      onClose={onClose}
      onPointerDown={(e) => {
        pressedOutsideRef.current = isPointerOutsideDialog(e, e.currentTarget);
      }}
      onPointerUp={(e) => {
        if (
          !('closedBy' in HTMLDialogElement.prototype) &&
          pressedOutsideRef.current &&
          isPointerOutsideDialog(e, e.currentTarget)
        ) {
          e.currentTarget.close();
        }
        pressedOutsideRef.current = false;
      }}
      {...({ closedby: "any" } as Record<string, string>)}
      className="admin-modal bg-white rounded-2xl shadow-2xl w-[calc(100%-2rem)] max-w-lg max-h-[90vh] overflow-y-auto p-0 border-0 text-left animate-in zoom-in-95 duration-200"
    >
      {/* Header */}
      <div className="sticky top-0 bg-white flex items-center justify-between p-6 pb-4 border-b border-gray-100 rounded-t-2xl z-10">
        <h2 id={titleId} className="text-lg font-bold text-gray-800">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup dialog"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="p-6">{children}</div>
    </dialog>
  );
}
