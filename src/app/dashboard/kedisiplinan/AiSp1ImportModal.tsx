"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import {
  DISCIPLINE_ELIGIBLE_STATUSES,
  getTodayWibDateString,
  getYesterdayWibDateString,
  normalizeWarningLevel,
  type AiMatchedSp1,
  type AiUnmatchedSp1,
  type DisciplineMemberInput,
} from "@/lib/members/discipline";

interface AiSp1ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: DisciplineMemberInput[];
  aiConfigured: boolean;
  onParseWithAi: (rawText: string) => Promise<{
    success: boolean;
    provider?: string;
    model?: string;
    matched?: AiMatchedSp1[];
    unmatched?: AiUnmatchedSp1[];
    error?: string;
  }>;
  onConfirmApply: (payload: {
    items: { memberId: string; note?: string; alpaCount?: number }[];
    effectiveDate: string;
    quarterLabel: string;
  }) => Promise<void>;
}

interface PreviewRow {
  memberId: string;
  name: string;
  nim: string;
  division: string;
  status: string;
  note: string;
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

export function AiSp1ImportModal({
  isOpen,
  onClose,
  members,
  aiConfigured,
  onParseWithAi,
  onConfirmApply,
}: AiSp1ImportModalProps) {
  const todayDate = getTodayWibDateString();
  const yesterdayDate = getYesterdayWibDateString();

  const [stage, setStage] = useState<"input" | "preview">("input");
  const [rawText, setRawText] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(yesterdayDate);
  const [quarterLabel, setQuarterLabel] = useState("Rekapan Absensi Kemarin");
  const [analyzing, setAnalyzing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [providerInfo, setProviderInfo] = useState("");
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [unmatchedRows, setUnmatchedRows] = useState<AiUnmatchedSp1[]>([]);
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
  const eligibleSet = new Set<string>(DISCIPLINE_ELIGIBLE_STATUSES);
  const eligibleManualMembers = members.filter(
    (m) =>
      eligibleSet.has(m.status) &&
      normalizeWarningLevel(m.warning_level) === "none" &&
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
          status: member.status,
          note: m.note || "SP 1 — Hasil rekapan absensi",
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
        status: member.status,
        note: unmatched.note || "SP 1 — Hasil rekapan absensi",
        matchedFrom: unmatched.raw_name,
        selected: true,
      },
    ]);
    setUnmatchedRows((prev) => prev.filter((_, idx) => idx !== unmatchedIdx));
  };

  const selectedCount = previewRows.filter((r) => r.selected).length;

  const handleApply = async () => {
    const items = previewRows
      .filter((r) => r.selected)
      .map((r) => ({ memberId: r.memberId, note: r.note, alpaCount: 0 }));
    if (items.length === 0) return;

    setApplying(true);
    setErrorMsg("");
    try {
      await onConfirmApply({
        items,
        effectiveDate,
        quarterLabel: quarterLabel.trim() || "Rekapan Absensi Kemarin",
      });
      setStage("input");
      setRawText("");
      setPreviewRows([]);
      setUnmatchedRows([]);
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal menyimpan daftar SP 1."
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
      className="bg-white text-gray-900 rounded-2xl shadow-2xl w-[calc(100%-2rem)] max-w-3xl max-h-[90vh] overflow-y-auto overscroll-contain p-0 border-0 text-left"
    >
      <div className="sticky top-0 bg-white flex items-center justify-between p-6 pb-4 border-b border-gray-100 rounded-t-2xl z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 id={titleId} className="text-lg font-bold text-gray-900">
              AI Pilah Daftar SP 1
            </h2>
            <p className="text-xs text-gray-500">
              Tempel daftar anggota/pengurus SP 1 dari WhatsApp/notulensi rekapan kemarin.
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
              <strong>Pencocokan Cerdas Lokal</strong> secara otomatis untuk memilah daftar SP 1 Anda.
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
                htmlFor="ai-sp1-paste"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Tempel Daftar Nama / NIM yang Terkena SP 1
              </label>
              <textarea
                id="ai-sp1-paste"
                rows={7}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={
                  "Contoh:\nDaftar SP 1 hasil rekapan kemarin:\n1. Budi Santoso (alpa 4x)\n2. Siti Aisyah - alpa 5 kali di rapat divisi\n3. Andi Pratama"
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition resize-y"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Menggunakan AI gratis bawaan dengan fallback lokal otomatis. Anda bisa mengatur
                tanggal berlaku SP 1 dan tetap melanjutkan jika ada nama yang tidak terdaftar.
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
                {analyzing ? "Sedang memilah..." : "Analisis Daftar SP 1"}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tanggal Berlaku SP 1
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setEffectiveDate(yesterdayDate)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                      effectiveDate === yesterdayDate
                        ? "bg-amber-50 border-amber-300 text-amber-800"
                        : "bg-white border-gray-200 text-gray-600"
                    }`}
                  >
                    Kemarin
                  </button>
                  <button
                    type="button"
                    onClick={() => setEffectiveDate(todayDate)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                      effectiveDate === todayDate
                        ? "bg-amber-50 border-amber-300 text-amber-800"
                        : "bg-white border-gray-200 text-gray-600"
                    }`}
                  >
                    Hari Ini
                  </button>
                </div>
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
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none"
                />
              </div>
            </div>

            {previewRows.length > 0 ? (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-600 border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-3 w-10">Pilih</th>
                      <th className="py-2.5 px-3">Anggota / Pengurus</th>
                      <th className="py-2.5 px-3">Keterangan SP 1 (Editable)</th>
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
                                prev.map((r, i) =>
                                  i === idx ? { ...r, selected: checked } : r
                                )
                              );
                            }}
                            className="mt-1 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                          />
                        </td>
                        <td className="py-3 px-3 align-top">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900">{row.name}</p>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                              {row.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {row.nim} · {row.division}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            Dari: &quot;{row.matchedFrom}&quot;
                          </p>
                        </td>
                        <td className="py-3 px-3 align-top">
                          <input
                            type="text"
                            maxLength={300}
                            value={row.note}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPreviewRows((prev) =>
                                prev.map((r, i) =>
                                  i === idx ? { ...r, note: val } : r
                                )
                              );
                            }}
                            placeholder="Catatan SP 1..."
                            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500 border border-dashed border-gray-200 rounded-xl">
                Tidak ada nama yang otomatis cocok. Periksa daftar di bawah atau edit teks input.
              </div>
            )}

            {unmatchedRows.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-900">
                    Data Tidak Ditemukan / Dilewati ({unmatchedRows.length})
                  </p>
                  {selectedCount > 0 && (
                    <p className="text-xs text-amber-800 mt-0.5">
                      Anda tetap dapat melanjutkan penerbitan SP 1 untuk{" "}
                      <strong>{selectedCount} anggota yang ditemukan</strong>, atau abaikan/cocokkan manual item berikut.
                    </p>
                  )}
                </div>
                <div className="space-y-2.5">
                  {unmatchedRows.map((item, idx) => {
                    const isNotFound = item.note.toLowerCase().includes("tidak ditemukan");
                    return (
                      <div
                        key={`${item.raw_name}-${idx}`}
                        className="p-3 bg-white border border-amber-100 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="text-xs space-y-1">
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
                            <p className="font-semibold text-gray-900">{item.raw_name}</p>
                          </div>
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
                                className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white text-gray-900 max-w-[180px]"
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
                            onClick={() =>
                              setUnmatchedRows((prev) =>
                                prev.filter((_, i) => i !== idx)
                              )
                            }
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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                <ShieldAlert size={16} />
                {applying
                  ? "Menyimpan..."
                  : `Terbitkan SP 1 (${selectedCount})`}
              </button>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
