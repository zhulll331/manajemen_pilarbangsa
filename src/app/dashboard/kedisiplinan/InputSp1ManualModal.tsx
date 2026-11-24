"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckSquare, Search, ShieldAlert, X } from "lucide-react";
import {
  DISCIPLINE_ELIGIBLE_STATUSES,
  getTodayWibDateString,
  getYesterdayWibDateString,
  normalizeWarningLevel,
  type DisciplineMemberInput,
} from "@/lib/members/discipline";

interface InputSp1ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: DisciplineMemberInput[];
  onSubmit: (payload: {
    items: { memberId: string; note?: string; alpaCount?: number }[];
    effectiveDate: string;
    quarterLabel: string;
  }) => Promise<void>;
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

export function InputSp1ManualModal({
  isOpen,
  onClose,
  members,
  onSubmit,
}: InputSp1ManualModalProps) {
  const todayDate = getTodayWibDateString();
  const yesterdayDate = getYesterdayWibDateString();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("Semua");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [effectiveDate, setEffectiveDate] = useState(yesterdayDate);
  const [quarterLabel, setQuarterLabel] = useState("Rekapan Absensi Kemarin");
  const [sharedNote, setSharedNote] = useState(
    "SP 1 — Alpa > 3 kali pada rekapan absensi triwulan"
  );
  const [submitting, setSubmitting] = useState(false);
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

  const eligibleMembers = useMemo(() => {
    const eligibleSet = new Set<string>(DISCIPLINE_ELIGIBLE_STATUSES);
    return members.filter(
      (m) =>
        eligibleSet.has(m.status) &&
        normalizeWarningLevel(m.warning_level) === "none"
    );
  }, [members]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return eligibleMembers.filter((m) => {
      if (categoryFilter !== "Semua" && m.status !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        (m.nim && m.nim.toLowerCase().includes(q)) ||
        (m.division && m.division.toLowerCase().includes(q))
      );
    });
  }, [eligibleMembers, searchQuery, categoryFilter]);

  if (!isOpen) return null;

  const selectedSet = new Set(selectedIds);

  const toggleId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      await onSubmit({
        items: selectedIds.map((id) => ({
          memberId: id,
          note: sharedNote.trim(),
          alpaCount: 0,
        })),
        effectiveDate,
        quarterLabel: quarterLabel.trim() || "Rekapan Absensi Kemarin",
      });
      setSelectedIds([]);
      setSearchQuery("");
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal menyimpan status SP 1."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(e) => {
        if (submitting) e.preventDefault();
      }}
      onClose={() => {
        if (!submitting) onClose();
      }}
      onPointerDown={(e) => {
        pressedOutsideRef.current = isPointerOutsideDialog(e, e.currentTarget);
      }}
      onPointerUp={(e) => {
        if (
          !submitting &&
          !("closedBy" in HTMLDialogElement.prototype) &&
          pressedOutsideRef.current &&
          isPointerOutsideDialog(e, e.currentTarget)
        ) {
          e.currentTarget.close();
        }
        pressedOutsideRef.current = false;
      }}
      {...({ closedby: submitting ? "none" : "any" } as Record<string, string>)}
      className="bg-white rounded-2xl shadow-2xl w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain p-0 border-0 text-left"
    >
      <div className="sticky top-0 bg-white flex items-center justify-between p-6 pb-4 border-b border-gray-100 rounded-t-2xl z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h2 id={titleId} className="text-lg font-bold text-gray-900">
              Tandai SP 1 Manual (Checklist)
            </h2>
            <p className="text-xs text-gray-500">
              Cocok untuk memasukkan daftar anggota/pengurus SP 1 dari rekapan kemarin.
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={submitting}
          onClick={onClose}
          aria-label="Tutup dialog"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleConfirm} className="p-6 space-y-4">
        {errorMsg && (
          <div
            role="alert"
            className="p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 text-sm text-red-700"
          >
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Tanggal Berlaku SP 1
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                required
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setEffectiveDate(yesterdayDate)}
                className={`px-2.5 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  effectiveDate === yesterdayDate
                    ? "bg-amber-50 border-amber-300 text-amber-800"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                Kemarin
              </button>
              <button
                type="button"
                onClick={() => setEffectiveDate(todayDate)}
                className={`px-2.5 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  effectiveDate === todayDate
                    ? "bg-amber-50 border-amber-300 text-amber-800"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                Hari Ini
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Alpa pada agenda setelah tanggal ini otomatis memicu kandidat SP 2.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Label Rekapan / Triwulan
            </label>
            <input
              type="text"
              maxLength={120}
              value={quarterLabel}
              onChange={(e) => setQuarterLabel(e.target.value)}
              placeholder="Contoh: Rekapan Triwulan Kemarin"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Catatan SP 1 (Berlaku untuk Anggota Terpilih)
          </label>
          <input
            type="text"
            maxLength={300}
            value={sharedNote}
            onChange={(e) => setSharedNote(e.target.value)}
            placeholder="Keterangan SP 1..."
            className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, NIM, atau divisi..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter kategori keanggotaan"
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 outline-none"
          >
            <option value="Semua">Semua Aktif</option>
            <option value="Aktif">Anggota Biasa (Aktif)</option>
            <option value="Pengurus Aktif">Pengurus Aktif</option>
          </select>
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto divide-y divide-gray-100">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">
              Tidak ada anggota/pengurus aktif belum SP 1 yang cocok.
            </div>
          ) : (
            filtered.map((m) => {
              const checked = selectedSet.has(m.id);
              return (
                <label
                  key={m.id}
                  className={`flex items-center justify-between gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                    checked ? "bg-amber-50/70" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleId(m.id)}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {m.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {m.nim || "-"} · {m.division || "-"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      m.status === "Pengurus Aktif"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {m.status}
                  </span>
                </label>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <span className="text-xs text-gray-500">
            {selectedIds.length} anggota dipilih
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || selectedIds.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              <CheckSquare size={16} />
              {submitting
                ? "Menyimpan..."
                : `Terbitkan SP 1 (${selectedIds.length})`}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
