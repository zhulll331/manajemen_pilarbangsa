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
import type {
  AiMatchedDismissal,
  AiUnmatchedDismissal,
  BulkDismissItem,
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
  reason: string;
  matchedFrom: string;
  selected: boolean;
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
    (m) =>
      m.status !== "Diberhentikan" &&
      !previewRows.some((r) => r.memberId === m.id)
  );

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setErrorMsg("");
    try {
      const res = await onParseWithAi(rawText);
      if (!res.success || !res.matched) {
        setErrorMsg(res.error || "Gagal memproses teks dengan AI.");
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
          reason: m.reason,
          matchedFrom: m.matched_from,
          selected: true,
        });
      }

      setPreviewRows(mappedRows);
      setUnmatchedRows(res.unmatched || []);
      setManualMatchTarget({});
      setProviderInfo(
        res.provider ? `${res.provider} (${res.model || "gratis"})` : "AI Organisasi"
      );
      setStage("preview");
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Terjadi kesalahan saat menghubungi AI."
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
        reason: unmatched.reason,
        matchedFrom: unmatched.raw_name,
        selected: true,
      },
    ]);
    setUnmatchedRows((prev) => prev.filter((_, idx) => idx !== unmatchedIdx));
  };

  const selectedCount = previewRows.filter((r) => r.selected).length;

  const handleApply = async () => {
    const items: BulkDismissItem[] = previewRows
      .filter((r) => r.selected)
      .map((r) => ({ memberId: r.memberId, reason: r.reason }));
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
        err instanceof Error ? err.message : "Gagal mengeksekusi pemberhentian massal."
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
      className="bg-white rounded-2xl shadow-2xl w-[calc(100%-2rem)] max-w-3xl max-h-[90vh] overflow-y-auto overscroll-contain p-0 border-0 text-left"
    >
      <div className="sticky top-0 bg-white flex items-center justify-between p-6 pb-4 border-b border-gray-100 rounded-t-2xl z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 id={titleId} className="text-lg font-bold text-gray-900">
              AI Pilah Pemberhentian Anggota
            </h2>
            <p className="text-xs text-gray-500">
              Tempel daftar anggota dengan alasan berbeda tiap orang — AI mencocokkan otomatis.
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
          <div
            role="alert"
            className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-sm text-amber-800"
          >
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-600" />
            <span>
              Kunci API AI gratis (GEMINI_API_KEY / GROQ_API_KEY / OPENROUTER_API_KEY) belum
              terdeteksi di environment server. Silakan gunakan pemilihan kotak centang manual
              atau lengkapi API key terlebih dahulu.
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
                Tempel Daftar Nama / NIM &amp; Keterangan Pemberhentian
              </label>
              <textarea
                id="ai-dismiss-paste"
                rows={7}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={
                  "Contoh:\n1. Budi Santoso - Tidak hadir 4 rapat pleno tanpa izin\n2. Siti Aisyah (NIM 2024002) : Mengundurkan diri per surat resmi\n3. Andi Pratama - Pindah universitas"
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition resize-y"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Menggunakan failover AI gratis bawaan (Gemini → Groq → OpenRouter). Anda tetap
                dapat meninjau &amp; mengedit setiap keterangan sebelum dieksekusi.
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
                disabled={busy || !aiConfigured || rawText.trim().length < 3}
                onClick={handleAnalyze}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-secondary)] transition-colors disabled:opacity-50"
              >
                <Sparkles size={16} />
                {analyzing ? "AI sedang memilah..." : "Analisis dengan AI"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={16} className="text-emerald-600" />
                Hasil dipilah oleh {providerInfo} · {previewRows.length} cocok,{" "}
                {unmatchedRows.length} perlu perhatian
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
                      <th className="py-2.5 px-3">Keterangan Diberhentikan (Editable)</th>
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
                            {row.nim} · {row.division}
                          </p>
                          <p className="text-[11px] text-gray-400">Dari: &quot;{row.matchedFrom}&quot;</p>
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
                            placeholder="Opsional: masukkan alasan pemberhentian..."
                            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500 border border-dashed border-gray-200 rounded-xl">
                Tidak ada anggota yang berhasil dicocokkan langsung. Periksa daftar di bawah atau
                edit teks input.
              </div>
            )}

            {unmatchedRows.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                  Tidak Cocok / Sudah Berhenti ({unmatchedRows.length})
                </p>
                <div className="space-y-2.5">
                  {unmatchedRows.map((item, idx) => (
                    <div
                      key={`${item.raw_name}-${idx}`}
                      className="p-3 bg-white border border-amber-100 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="text-xs space-y-0.5">
                        <p className="font-semibold text-gray-900">{item.raw_name}</p>
                        {item.reason && (
                          <p className="text-gray-600">Alasan: {item.reason}</p>
                        )}
                        <p className="text-amber-700">{item.note}</p>
                      </div>
                      {eligibleManualMembers.length > 0 && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <select
                            value={manualMatchTarget[idx] || ""}
                            onChange={(e) =>
                              setManualMatchTarget((prev) => ({
                                ...prev,
                                [idx]: e.target.value,
                              }))
                            }
                            aria-label={`Cocokkan manual ${item.raw_name}`}
                            className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white max-w-[180px]"
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
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
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
                  : `Konfirmasi & Tandai Diberhentikan (${selectedCount})`}
              </button>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
