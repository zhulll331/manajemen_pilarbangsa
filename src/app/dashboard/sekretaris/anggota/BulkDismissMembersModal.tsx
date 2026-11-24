"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, UserX, X } from "lucide-react";
import type { BulkDismissItem } from "@/lib/members/dismissal";

export interface MemberDismissOption {
  id: string;
  name: string;
  nim: string | null;
  division: string | null;
  status: string;
}

interface BulkDismissMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMembers: MemberDismissOption[];
  onRemoveMember: (memberId: string) => void;
  onConfirm: (items: BulkDismissItem[]) => Promise<void>;
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

export function BulkDismissMembersModal({
  isOpen,
  onClose,
  selectedMembers,
  onRemoveMember,
  onConfirm,
}: BulkDismissMembersModalProps) {
  const [sharedReason, setSharedReason] = useState("");
  const [perMemberReasons, setPerMemberReasons] = useState<Record<string, string>>({});
  const [useDifferentReasons, setUseDifferentReasons] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

  const handleApplySharedToAll = () => {
    const next: Record<string, string> = {};
    for (const m of selectedMembers) {
      next[m.id] = sharedReason;
    }
    setPerMemberReasons(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMembers.length === 0) return;

    setLoading(true);
    setErrorMsg("");
    try {
      const items: BulkDismissItem[] = selectedMembers.map((member) => ({
        memberId: member.id,
        reason: useDifferentReasons
          ? perMemberReasons[member.id] ?? sharedReason
          : sharedReason,
      }));
      await onConfirm(items);
      setSharedReason("");
      setPerMemberReasons({});
      setUseDifferentReasons(false);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal menandai anggota diberhentikan."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
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
          !("closedBy" in HTMLDialogElement.prototype) &&
          pressedOutsideRef.current &&
          isPointerOutsideDialog(e, e.currentTarget)
        ) {
          e.currentTarget.close();
        }
        pressedOutsideRef.current = false;
      }}
      {...({ closedby: loading ? "none" : "any" } as Record<string, string>)}
      style={{ colorScheme: "light" }}
      className="bg-white text-gray-900 rounded-2xl shadow-2xl w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain p-0 border-0 text-left"
    >
      <div className="sticky top-0 bg-white flex items-center justify-between p-6 pb-4 border-b border-gray-100 rounded-t-2xl z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-50 text-red-600">
            <UserX size={20} />
          </div>
          <div>
            <h2 id={titleId} className="text-lg font-bold text-gray-900">
              Tandai Diberhentikan ({selectedMembers.length} Anggota)
            </h2>
            <p className="text-xs text-gray-500">
              Status anggota diubah menjadi Diberhentikan; riwayat iuran &amp; absensi tetap utuh.
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={onClose}
          aria-label="Tutup dialog"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {errorMsg && (
          <div
            role="alert"
            className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 text-sm text-red-700"
          >
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="shared-dismiss-reason"
              className="block text-sm font-medium text-gray-700"
            >
              Keterangan Pemberhentian {useDifferentReasons ? "(Default)" : "(Berlaku Semua)"}
            </label>
            <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useDifferentReasons}
                onChange={(e) => setUseDifferentReasons(e.target.checked)}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              Isi keterangan berbeda per anggota
            </label>
          </div>
          <div className="flex gap-2">
            <input
              id="shared-dismiss-reason"
              type="text"
              maxLength={300}
              value={sharedReason}
              onChange={(e) => setSharedReason(e.target.value)}
              placeholder="Contoh: Diberhentikan berdasarkan rapat evaluasi / SP3"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
            />
            {useDifferentReasons && (
              <button
                type="button"
                onClick={handleApplySharedToAll}
                className="px-3 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors whitespace-nowrap"
              >
                Terapkan ke Semua
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Daftar Anggota Terpilih
          </p>
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-xl">
            {selectedMembers.map((member) => (
              <div key={member.id} className="p-3 bg-white flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {member.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      NIM: {member.nim || "-"} · Divisi: {member.division || "-"} · Status saat ini: {member.status}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => onRemoveMember(member.id)}
                    aria-label={`Batalkan pilihan ${member.name}`}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Keluarkan dari daftar"
                  >
                    <X size={16} />
                  </button>
                </div>

                {useDifferentReasons && (
                  <input
                    type="text"
                    maxLength={300}
                    value={perMemberReasons[member.id] ?? sharedReason}
                    onChange={(e) =>
                      setPerMemberReasons((prev) => ({
                        ...prev,
                        [member.id]: e.target.value,
                      }))
                    }
                    placeholder={`Keterangan pemberhentian untuk ${member.name}...`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading || selectedMembers.length === 0}
            className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading
              ? "Memproses..."
              : `Tandai Diberhentikan (${selectedMembers.length})`}
          </button>
        </div>
      </form>
    </dialog>
  );
}
