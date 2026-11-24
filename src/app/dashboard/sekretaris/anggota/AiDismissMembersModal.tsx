"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  UserX,
  X,
} from "lucide-react";
import {
  normalizeTargetStatus,
  type AiMatchedDismissal,
  type AiUnmatchedDismissal,
  type BulkDismissItem,
  type MemberTargetStatus,
} from "@/lib/members/dismissal";
import type { MemberDismissOption } from "./BulkDismissMembersModal";

interface AiDismissMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberDismissOption[];
  aiConfigured: boolean;
  onParseWithAi: (rawText: string) => Promise<{
    success: boolean;
    provider?: string;
    model?: string;
    matched?: AiMatchedDismissal[];
    unmatched?: AiUnmatchedDismissal[];
    error?: string;
  }>;
  onConfirmApply: (items: BulkDismissItem[]) => Promise<void>;
}

interface PreviewRow {
  memberId: string;
  name: string;
  nim: string;
  division: string;
  currentStatus: string;
  targetStatus: MemberTargetStatus;
  reason: string;
  matchedFrom: string;
  selected: boolean;
}

const TARGET_STATUS_OPTIONS: MemberTargetStatus[] = [
  "Diberhentikan",
  "Alumni",
  "Cuti",
];

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

export function AiDismissMembersModal({
  isOpen,
  onClose,
  members,
  aiConfigured,
  onParseWithAi,
  onConfirmApply,
}: AiDismissMembersModalProps) {
  const [stage, setStage] = useState<"input" | "preview">("input");
  const [rawText, setRawText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [providerInfo, setProviderInfo] = useState("");
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [unmatchedRows, setUnmatchedRows] = useState<AiUnmatchedDismissal[]>([]);
  const [manualMatchTarget, setManualMatchTarget] = useState<Record<number, string>>({});

  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressedOutsideRef = useRef(false);
  const titleId = useId();
  const busy = analyzing || applying;

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

  const memberMap = new Map(members.map((m) => [m.id, m]));
  const eligibleManualMembers = members.filter(
    (m) => !previewRows.some((r) => r.memberId === m.id)
  );

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setErrorMsg("");
    try {
      const res = await onParseWithAi(rawText);
      if (!res.success || !res.matched) {
        setErrorMsg(res.error || "Gagal memproses teks daftar anggota.");
        return;
      }

      const mappedRows: PreviewRow[] = [];
      for (const m of res.matched) {
        const member = memberMap.get(m.member_id);
        if (!member) continue;
        mappedRows.push({
          memberId: member.id,
          name: member.name,
          nim: member.nim || "-",
          division: member.division || "-",
          currentStatus: member.status,
          targetStatus: normalizeTargetStatus(m.target_status),
          reason: m.reason,
          matchedFrom: m.matched_from,
          selected: true,
        });
      }

      setPreviewRows(mappedRows);
      setUnmatchedRows(res.unmatched || []);
      setManualMatchTarget({});
      setProviderInfo(
        res.provider ? `${res.provider} (${res.model || "otomatis"})` : "AI Organisasi"
      );
      setStage("preview");
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Terjadi kesalahan saat menganalisis daftar."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAssignUnmatched = (unmatchedIdx: number) => {
    const memberId = manualMatchTarget[unmatchedIdx];
    const unmatched = unmatchedRows[unmatchedIdx];
    if (!memberId || !unmatched) return;
    const member = memberMap.get(memberId);
    if (!member) return;

    setPreviewRows((prev) => [
      ...prev,
      {
        memberId: member.id,
        name: member.name,
        nim: member.nim || "-",
        division: member.division || "-",
        currentStatus: member.status,
        targetStatus: normalizeTargetStatus(unmatched.target_status),
        reason: unmatched.reason,
        matchedFrom: unmatched.raw_name,
        selected: true,
      },
    ]);
    setUnmatchedRows((prev) => prev.filter((_, idx) => idx !== unmatchedIdx));
  };

  const handleIgnoreUnmatched = (unmatchedIdx: number) => {
    setUnmatchedRows((prev) => prev.filter((_, idx) => idx !== unmatchedIdx));
  };

  const selectedRows = previewRows.filter((r) => r.selected);
  const selectedCount = selectedRows.length;

  const summaryBreakdown = [
    {
      label: "Diberhentikan",
      count: selectedRows.filter((r) => r.targetStatus === "Diberhentikan").length,
    },
    {
      label: "Alumni",
      count: selectedRows.filter((r) => r.targetStatus === "Alumni").length,
    },
    {
      label: "Cuti",
      count: selectedRows.filter((r) => r.targetStatus === "Cuti").length,
    },
  ]
    .filter((s) => s.count > 0)
    .map((s) => `${s.count} ${s.label}`)
    .join(", ");

  const handleApply = async () => {
    const items: BulkDismissItem[] = selectedRows.map((r) => ({
      memberId: r.memberId,
      reason: r.reason,
      targetStatus: r.targetStatus,
    }));
    if (items.length === 0) return;

    setApplying(true);
    setErrorMsg("");
    try {
      await onConfirmApply(items);
      setStage("input");
      setRawText("");
      setPreviewRows([]);
      setUnmatchedRows([]);
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal mengeksekusi pembaruan status massal."
      );
    } finally {
      setApplying(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(e) => {
        if (busy) e.preventDefault();
      }}
      onClose={() => {
        if (!busy) onClose();
      }}
      onPointerDown={(e) => {
        pressedOutsideRef.current = isPointerOutsideDialog(e, e.currentTarget);
      }}
      onPointerUp={(e) => {
        if (
          !busy &&
          !("closedBy" in HTMLDialogElement.prototype) &&
          pressedOutsideRef.current &&
          isPointerOutsideDialog(e, e.currentTarget)
        ) {
          e.currentTarget.close();
        }
        pressedOutsideRef.current = false;
      }}
      {...({ closedby: busy ? "none" : "any" } as Record<string, string>)}
      style={{ colorScheme: "light" }}
      className="bg-white text-gray-900 rounded-2xl shadow-2xl w-[calc(100%-2rem)] max-w-4xl max-h-[90vh] overflow-y-auto overscroll-contain p-0 border-0 text-left"
    >
      <div className="sticky top-0 bg-white flex items-center justify-between p-6 pb-4 border-b border-gray-100 rounded-t-2xl z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 id={titleId} className="text-lg font-bold text-gray-900">
              AI Pilah Status &amp; Pemberhentian Anggota
            </h2>
            <p className="text-xs text-gray-500">
              Tempel daftar anggota (Diberhentikan, Alumni, atau Cuti) — otomatis memilah &amp; menandai data yang tidak ditemukan.
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          aria-label="Tutup dialog"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-6 space-y-5">
        {!aiConfigured && (
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-800">
            <Sparkles size={16} className="shrink-0 mt-0.5 text-blue-600" />
            <span>
              API key AI eksternal tidak terdeteksi — sistem akan menggunakan{" "}
              <strong>Pencocokan Cerdas Lokal</strong> secara otomatis untuk memilah daftar Anda.
            </span>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 text-sm text-red-700"
          >
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {stage === "input" ? (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="ai-dismiss-paste"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Tempel Daftar Nama / NIM &amp; Status (Diberhentikan / Alumni / Cuti)
              </label>
              <textarea
                id="ai-dismiss-paste"
                rows={9}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={
                  "Contoh format sebaris:\n1. Intan Nur Aini (Sejarah) - diberhentikan\n2. Ahmad Ali Munazat - alumni\n\nAtau format per kelompok:\nDiberhentikan:\n1. EKA TYA SRI RAHAYU\nAlumni:\n1. Nurul Yakin"
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition resize-y font-sans"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Mendukung status campuran (Diberhentikan, Alumni, Cuti) &amp; otomatis melewati nama yang tidak terdaftar agar data valid tetap bisa diproses.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={busy || rawText.trim().length < 3}
                onClick={handleAnalyze}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-secondary)] transition-colors disabled:opacity-50"
              >
                <Sparkles size={16} />
                {analyzing ? "Sedang memilah..." : "Analisis Daftar Anggota"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={16} className="text-emerald-600" />
                Dipilah oleh {providerInfo} · {previewRows.length} data cocok,{" "}
                {unmatchedRows.length} tidak ditemukan / dilewati
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => setStage("input")}
                className="inline-flex items-center gap-1 font-semibold text-emerald-900 hover:underline"
              >
                <ArrowLeft size={14} />
                Edit Teks Input
              </button>
            </div>

            {previewRows.length > 0 ? (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-600 border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-3 w-10">Pilih</th>
                      <th className="py-2.5 px-3">Anggota</th>
                      <th className="py-2.5 px-3 w-40">Target Status</th>
                      <th className="py-2.5 px-3">Keterangan (Opsional)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {previewRows.map((row, idx) => (
                      <tr key={row.memberId} className="bg-white">
                        <td className="py-3 px-3 align-top">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            aria-label={`Pilih ${row.name}`}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setPreviewRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, selected: checked } : r))
                              );
                            }}
                            className="mt-1 rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                        </td>
                        <td className="py-3 px-3 align-top">
                          <p className="font-semibold text-gray-900">{row.name}</p>
                          <p className="text-xs text-gray-500">
                            {row.nim} · {row.division} · Status saat ini: {row.currentStatus}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            Dari: &quot;{row.matchedFrom}&quot;
                          </p>
                        </td>
                        <td className="py-3 px-3 align-top">
                          <select
                            value={row.targetStatus}
                            aria-label={`Target status ${row.name}`}
                            onChange={(e) => {
                              const nextStatus = normalizeTargetStatus(e.target.value);
                              setPreviewRows((prev) =>
                                prev.map((r, i) =>
                                  i === idx ? { ...r, targetStatus: nextStatus } : r
                                )
                              );
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold border outline-none ${
                              row.targetStatus === "Diberhentikan"
                                ? "bg-red-50 border-red-200 text-red-700"
                                : row.targetStatus === "Alumni"
                                ? "bg-gray-100 border-gray-300 text-gray-800"
                                : "bg-yellow-50 border-yellow-200 text-yellow-800"
                            }`}
                          >
                            {TARGET_STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st} className="bg-white text-gray-900">
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-3 align-top">
                          <input
                            type="text"
                            maxLength={300}
                            value={row.reason}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPreviewRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, reason: val } : r))
                              );
                            }}
                            placeholder={
                              row.targetStatus === "Diberhentikan"
                                ? "Alasan pemberhentian (opsional)..."
                                : "Catatan tambahan (opsional)..."
                            }
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500 border border-dashed border-gray-200 rounded-xl">
                Tidak ada nama yang cocok dengan database anggota. Anda dapat mencocokkan secara manual di bawah atau edit teks input.
              </div>
            )}

            {unmatchedRows.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-900">
                      Data Tidak Ditemukan / Dilewati ({unmatchedRows.length})
                    </p>
                    {selectedCount > 0 && (
                      <p className="text-xs text-amber-800 mt-0.5">
                        Anda tetap dapat langsung menekan tombol konfirmasi di bawah untuk memproses{" "}
                        <strong>{selectedCount} anggota yang ditemukan</strong>, atau abaikan/cocokkan manual item berikut.
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {unmatchedRows.map((item, idx) => {
                    const isNotFound = item.note.toLowerCase().includes("tidak ditemukan");
                    return (
                      <div
                        key={`${item.raw_name}-${idx}`}
                        className="p-3 bg-white border border-amber-100 rounded-lg flex flex-col lg:flex-row lg:items-center justify-between gap-2.5"
                      >
                        <div className="text-xs space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                isNotFound
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {isNotFound ? "Data Tidak Ditemukan" : "Dilewati"}
                            </span>
                            {item.target_status && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                                Target: {item.target_status}
                              </span>
                            )}
                            <p className="font-semibold text-gray-900 truncate">
                              {item.raw_name}
                            </p>
                          </div>
                          {item.reason && (
                            <p className="text-gray-600">Keterangan: {item.reason}</p>
                          )}
                          <p className="text-amber-700">{item.note}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                          {eligibleManualMembers.length > 0 && (
                            <>
                              <select
                                value={manualMatchTarget[idx] || ""}
                                onChange={(e) =>
                                  setManualMatchTarget((prev) => ({
                                    ...prev,
                                    [idx]: e.target.value,
                                  }))
                                }
                                aria-label={`Cocokkan manual ${item.raw_name}`}
                                className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white text-gray-900 max-w-[190px]"
                              >
                                <option value="">Pilih anggota...</option>
                                {eligibleManualMembers.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name} ({m.nim || "-"})
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                disabled={!manualMatchTarget[idx]}
                                onClick={() => handleAssignUnmatched(idx)}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 disabled:opacity-40"
                              >
                                Tambahkan
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => handleIgnoreUnmatched(idx)}
                            className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-100"
                          >
                            Abaikan
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                {summaryBreakdown ? (
                  <span>Ringkasan pilihan: <strong className="text-gray-800">{summaryBreakdown}</strong></span>
                ) : (
                  <span>Belum ada anggota dipilih.</span>
                )}
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={busy || selectedCount === 0}
                  onClick={handleApply}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <UserX size={16} />
                  {applying
                    ? "Menyimpan..."
                    : `Lanjutkan & Terapkan (${selectedCount} Anggota)`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
