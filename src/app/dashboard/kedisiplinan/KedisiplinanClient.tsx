"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Download,
  History,
  Lock,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";
import type { OrganizationPeriod } from "@/lib/periods/types";
import {
  buildPeriodQuarters,
  evaluateAttendanceDiscipline,
  getDefaultQuarterKey,
  getTodayWibDateString,
  type DisciplineAgendaInput,
  type DisciplineAttendanceInput,
  type DisciplineMemberInput,
  type MemberDisciplineEvaluation,
  type PeriodQuarter,
} from "@/lib/members/discipline";
import {
  MEMBER_DIVISION_FILTERS,
  matchesDivisionFilter,
} from "@/lib/members/divisions";
import { InputSp1ManualModal } from "./InputSp1ManualModal";
import { AiSp1ImportModal } from "./AiSp1ImportModal";
import {
  cabutSp1,
  eksekusiSp2Massal,
  parseDaftarSp1AI,
  terbitkanSp1Massal,
} from "./actions";

export interface DisciplinaryLogRecord {
  id: string;
  member_id: string;
  action: "sp1_issued" | "sp1_revoked" | "sp2_dismissed";
  quarter_label: string | null;
  alpa_count: number;
  effective_date: string;
  source: "auto_recap" | "manual" | "ai_import";
  note: string | null;
  actor_name: string | null;
  actor_role: string | null;
  created_at: string;
}

type ActiveTab = "recap" | "sp1_monitor" | "logs";

type ConfirmModalState =
  | {
      kind: "sp1";
      items: { memberId: string; name: string; alpaCount: number }[];
    }
  | {
      kind: "sp2";
      items: { memberId: string; name: string; alpaCount: number }[];
    }
  | {
      kind: "revoke_sp1";
      memberId: string;
      name: string;
    };

export default function KedisiplinanClient({
  period,
  isLocked,
  disciplineSchemaReady,
  aiConfigured,
  members,
  agendas,
  attendance,
  logs,
}: {
  period: OrganizationPeriod;
  isLocked: boolean;
  disciplineSchemaReady: boolean;
  aiConfigured: boolean;
  members: DisciplineMemberInput[];
  agendas: DisciplineAgendaInput[];
  attendance: DisciplineAttendanceInput[];
  logs: DisciplinaryLogRecord[];
}) {
  const router = useRouter();
  const quarters = useMemo(() => buildPeriodQuarters(period), [period]);
  const defaultQuarter = useMemo(() => getDefaultQuarterKey(quarters), [quarters]);

  const [activeTab, setActiveTab] = useState<ActiveTab>("recap");
  const [quarterSelection, setQuarterSelection] = useState<
    PeriodQuarter["key"] | "custom"
  >(defaultQuarter);
  const activeQuarterObj = useMemo(
    () => quarters.find((q) => q.key === quarterSelection) || quarters[0],
    [quarters, quarterSelection]
  );

  const [customStart, setCustomStart] = useState(period.start_date);
  const [customEnd, setCustomEnd] = useState(period.end_date);
  const [categoryFilter, setCategoryFilter] = useState<string>("Semua");
  const [divisionFilter, setDivisionFilter] = useState<string>("Semua");
  const [evalFilter, setEvalFilter] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [showManualSp1, setShowManualSp1] = useState(false);
  const [showAiSp1, setShowAiSp1] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmModalState | null>(null);
  const [confirmDate, setConfirmDate] = useState(getTodayWibDateString());
  const [confirmNote, setConfirmNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const effectiveRangeStart =
    quarterSelection === "custom" ? customStart : activeQuarterObj.startDate;
  const effectiveRangeEnd =
    quarterSelection === "custom" ? customEnd : activeQuarterObj.endDate;
  const effectiveWindowLabel =
    quarterSelection === "custom"
      ? `Rekap Kustom (${customStart} s/d ${customEnd})`
      : activeQuarterObj.label;

  const { rows, summary } = useMemo(
    () =>
      evaluateAttendanceDiscipline({
        members,
        agendas,
        attendance,
        rangeStart: effectiveRangeStart,
        rangeEnd: effectiveRangeEnd,
        includeDismissedSp2: true,
      }),
    [members, agendas, attendance, effectiveRangeStart, effectiveRangeEnd]
  );

  const divisions = ["Semua", ...MEMBER_DIVISION_FILTERS];

  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return rows.filter((row) => {
      if (categoryFilter !== "Semua" && row.status !== categoryFilter) {
        return false;
      }
      if (!matchesDivisionFilter(row.division, divisionFilter)) {
        return false;
      }
      if (evalFilter !== "Semua" && row.evalStatus !== evalFilter) {
        return false;
      }
      if (q) {
        return (
          row.name.toLowerCase().includes(q) ||
          row.nim.toLowerCase().includes(q) ||
          row.division.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rows, categoryFilter, divisionFilter, evalFilter, searchQuery]);

  const sp1MonitorRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return rows.filter((row) => {
      if (row.warningLevel !== "sp1" || row.status === "Diberhentikan") {
        return false;
      }
      if (categoryFilter !== "Semua" && row.status !== categoryFilter) {
        return false;
      }
      if (!matchesDivisionFilter(row.division, divisionFilter)) {
        return false;
      }
      if (q) {
        return (
          row.name.toLowerCase().includes(q) ||
          row.nim.toLowerCase().includes(q) ||
          row.division.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rows, categoryFilter, divisionFilter, searchQuery]);

  const memberLookup = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members]
  );

  const rowMap = useMemo(
    () => new Map(rows.map((r) => [r.memberId, r])),
    [rows]
  );

  const selectedEvaluations = useMemo(
    () =>
      selectedIds
        .map((id) => rowMap.get(id))
        .filter((r): r is MemberDisciplineEvaluation => Boolean(r)),
    [selectedIds, rowMap]
  );

  const selectedForSp1 = useMemo(
    () =>
      selectedEvaluations.filter(
        (r) => r.warningLevel === "none" && r.status !== "Diberhentikan"
      ),
    [selectedEvaluations]
  );

  const selectedForSp2 = useMemo(
    () =>
      selectedEvaluations.filter(
        (r) => r.warningLevel === "sp1" && r.status !== "Diberhentikan"
      ),
    [selectedEvaluations]
  );

  const readOnly = isLocked || !disciplineSchemaReady;

  const openConfirmSp1 = (
    items: { memberId: string; name: string; alpaCount: number }[]
  ) => {
    if (items.length === 0) return;
    setConfirmDate(getTodayWibDateString());
    setConfirmNote(
      `SP 1 — Melebihi 3 kali Alpa pada ${effectiveWindowLabel}`
    );
    setConfirmState({ kind: "sp1", items });
  };

  const openConfirmSp2 = (
    items: { memberId: string; name: string; alpaCount: number }[]
  ) => {
    if (items.length === 0) return;
    setConfirmDate(getTodayWibDateString());
    setConfirmNote("SP 2 — Alpa kembali setelah menerima SP 1");
    setConfirmState({ kind: "sp2", items });
  };

  const openRevokeSp1 = (row: MemberDisciplineEvaluation) => {
    setConfirmNote("");
    setConfirmState({
      kind: "revoke_sp1",
      memberId: row.memberId,
      name: row.name,
    });
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmState) return;
    setSubmitting(true);
    setBannerMsg(null);
    try {
      if (confirmState.kind === "sp1") {
        const res = await terbitkanSp1Massal({
          items: confirmState.items.map((item) => ({
            memberId: item.memberId,
            note: confirmNote,
            alpaCount: item.alpaCount,
          })),
          effectiveDate: confirmDate,
          quarterLabel: effectiveWindowLabel,
          source: "auto_recap",
        });
        setSelectedIds([]);
        setBannerMsg({
          type: "success",
          text: `${res.updatedCount} anggota/pengurus berhasil ditetapkan status SP 1.`,
        });
      } else if (confirmState.kind === "sp2") {
        const res = await eksekusiSp2Massal({
          items: confirmState.items.map((item) => ({
            memberId: item.memberId,
            note: confirmNote,
            alpaCount: item.alpaCount,
          })),
          effectiveDate: confirmDate,
          quarterLabel: effectiveWindowLabel,
          source: "auto_recap",
        });
        setSelectedIds([]);
        setBannerMsg({
          type: "success",
          text: `${res.updatedCount} anggota/pengurus dikenakan SP 2 dan diberhentikan otomatis.`,
        });
      } else {
        await cabutSp1({
          memberId: confirmState.memberId,
          reason: confirmNote,
        });
        setBannerMsg({
          type: "success",
          text: `Status SP 1 untuk ${confirmState.name} berhasil dicabut.`,
        });
      }
      setConfirmState(null);
      router.refresh();
    } catch (err) {
      setBannerMsg({
        type: "error",
        text:
          err instanceof Error ? err.message : "Gagal memproses tindakan SP.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportExcel = () => {
    const exportRows = filteredRows.map((row, idx) => ({
      No: idx + 1,
      Nama: row.name,
      NIM: row.nim,
      Kategori: row.status,
      Divisi: row.division,
      Hadir: row.hadirCount,
      Izin: row.izinCount,
      Sakit: row.sakitCount,
      "Alpa (Rentang Dipilih)": row.alpaInWindow,
      "Alpa Pasca SP 1": row.warningLevel === "sp1" ? row.alpaAfterSp1 : 0,
      "Status SP":
        row.evalStatus === "eligible_sp2"
          ? "SIAP SP 2 (Diberhentikan)"
          : row.evalStatus === "eligible_sp1"
          ? "KANDIDAT SP 1 (>3 Alpa)"
          : row.evalStatus === "active_sp1"
          ? "SP 1 AKTIF"
          : row.evalStatus === "dismissed_sp2"
          ? "DIBERHENTIKAN (SP 2)"
          : "Aman",
      "Tanggal SP 1": row.sp1IssuedAt || "-",
      "Catatan SP": row.sp2Note || row.sp1Note || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    ws["!cols"] = [
      { wch: 5 },
      { wch: 28 },
      { wch: 15 },
      { wch: 16 },
      { wch: 16 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 20 },
      { wch: 16 },
      { wch: 24 },
      { wch: 14 },
      { wch: 36 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Absensi & SP");
    XLSX.writeFile(
      wb,
      `Rekap_Absensi_SP_${period.code.replace("/", "-")}.xlsx`
    );
  };

  const toggleRowSelection = (memberId: string) => {
    setSelectedIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const selectableFilteredIds = filteredRows
    .filter((r) => r.status !== "Diberhentikan")
    .map((r) => r.memberId);

  const allFilteredSelected =
    selectableFilteredIds.length > 0 &&
    selectableFilteredIds.every((id) => selectedIds.includes(id));

  const renderEvalBadge = (row: MemberDisciplineEvaluation) => {
    switch (row.evalStatus) {
      case "eligible_sp2":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
            <AlertTriangle size={12} />
            Siap SP 2 (+{row.alpaAfterSp1} Alpa)
          </span>
        );
      case "eligible_sp1":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <ShieldAlert size={12} />
            Kandidat SP 1 ({row.alpaInWindow} Alpa)
          </span>
        );
      case "active_sp1":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
            SP 1 Aktif ({row.sp1IssuedAt || "-"})
          </span>
        );
      case "dismissed_sp2":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <UserX size={12} />
            Diberhentikan (SP 2)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
            <UserCheck size={12} />
            Aman
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-1 sm:mt-0">
            <ShieldAlert size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                Rekap Absensi 3 Bulanan &amp; Kedisiplinan SP
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {isLocked && <Lock size={12} />}
                Periode {period.code}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Aturan: Alpa &gt; 3 kali per triwulan = <strong>SP 1</strong>; Alpa 1 kali
              lagi setelah SP 1 = <strong>SP 2 (Diberhentikan)</strong>.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {!readOnly && (
            <>
              <button
                type="button"
                onClick={() => setShowManualSp1(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm font-medium hover:bg-amber-100 transition-colors"
              >
                <CheckSquare size={16} />
                Input SP 1 Manual
              </button>
              <button
                type="button"
                onClick={() => setShowAiSp1(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                <Sparkles size={16} />
                AI Pilah Daftar SP 1
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <Download size={16} />
            Ekspor Rekap Excel
          </button>
        </div>
      </div>

      {/* Schema Missing Alert */}
      {!disciplineSchemaReady && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3 text-sm"
        >
          <AlertTriangle size={20} className="shrink-0 mt-0.5 text-amber-600" />
          <div>
            <p className="font-semibold">
              Skema Database Tahap 21 Belum Dijalankan
            </p>
            <p className="text-xs text-amber-800 mt-0.5">
              Anda tetap dapat melihat hitungan rekap absensi, namun penyimpanan status SP 1 / SP 2
              menunggu Anda menjalankan file{" "}
              <code className="px-1.5 py-0.5 bg-amber-100 rounded font-mono">
                supabase_tahap21_sp_kedisiplinan.sql
              </code>{" "}
              di Supabase SQL Editor.
            </p>
          </div>
        </div>
      )}

      {/* Feedback Banner */}
      {bannerMsg && (
        <div
          role={bannerMsg.type === "error" ? "alert" : "status"}
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm ${
            bannerMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            {bannerMsg.type === "success" && (
              <CheckCircle2 size={17} className="shrink-0" />
            )}
            {bannerMsg.text}
          </span>
          <button
            type="button"
            onClick={() => setBannerMsg(null)}
            aria-label="Tutup pemberitahuan"
            className="p-1 rounded hover:bg-black/5"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => {
            setActiveTab("recap");
            setEvalFilter("eligible_sp2");
          }}
          className="text-left bg-white rounded-2xl p-5 border border-red-100 shadow-sm hover:border-red-300 transition-all"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
            Siap SP 2 / Berhentikan
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {summary.eligibleSp2}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            SP 1 aktif dengan +1 Alpa baru
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("recap");
            setEvalFilter("eligible_sp1");
          }}
          className="text-left bg-white rounded-2xl p-5 border border-amber-100 shadow-sm hover:border-amber-300 transition-all"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Kandidat SP 1 (&gt;3 Alpa)
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {summary.eligibleSp1}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Pada {effectiveWindowLabel}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sp1_monitor")}
          className="text-left bg-white rounded-2xl p-5 border border-yellow-100 shadow-sm hover:border-yellow-300 transition-all"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-yellow-700">
            Sedang SP 1 Aktif
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {summary.activeSp1}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Melekat sepanjang periode {period.code}
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("recap");
            setEvalFilter("dismissed_sp2");
          }}
          className="text-left bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:border-gray-300 transition-all"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Diberhentikan via SP 2
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {summary.dismissedSp2}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Total {summary.totalEvaluated} anggota/pengurus aktif dipantau
          </p>
        </button>
      </div>

      {/* Onboarding Helper Card when no SP1 yet or always in SP1 Monitor */}
      {!readOnly && activeTab === "sp1_monitor" && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-amber-900 text-sm sm:text-base">
              Punya Daftar SP 1 Hasil Rekapan Pengurus Kemarin?
            </h3>
            <p className="text-xs sm:text-sm text-amber-800">
              Masukkan sekaligus lewat <strong>Input SP 1 Manual</strong> (checklist) atau{" "}
              <strong>AI Pilah Daftar SP 1</strong> (cukup tempel daftar nama dari WA/notulensi),
              lalu atur tanggal berlaku kemarin agar Alpa berikutnya otomatis terdeteksi sebagai SP 2.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowManualSp1(true)}
              className="px-4 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition-colors"
            >
              Input Manual
            </button>
            <button
              type="button"
              onClick={() => setShowAiSp1(true)}
              className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors inline-flex items-center gap-1.5"
            >
              <Sparkles size={14} />
              Tempel &amp; Pilah AI
            </button>
          </div>
        </div>
      )}

      {/* Main Card with Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-wrap border-b border-gray-100 px-4 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("recap")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "recap"
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            Rekap Triwulan &amp; Deteksi Otomatis
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sp1_monitor")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors inline-flex items-center gap-2 ${
              activeTab === "sp1_monitor"
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            Pemantauan SP 1 Aktif
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800">
              {summary.activeSp1}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors inline-flex items-center gap-2 ${
              activeTab === "logs"
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <History size={15} />
            Riwayat Audit SP ({logs.length})
          </button>
        </div>

        {/* Filters */}
        {activeTab !== "logs" && (
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {activeTab === "recap" && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-gray-500 mb-1">
                    Jendela 3 Bulan
                  </label>
                  <select
                    value={quarterSelection}
                    onChange={(e) =>
                      setQuarterSelection(
                        e.target.value as PeriodQuarter["key"] | "custom"
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    {quarters.map((q) => (
                      <option key={q.key} value={q.key}>
                        {q.label}
                      </option>
                    ))}
                    <option value="custom">Rentang Tanggal Kustom...</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold uppercase text-gray-500 mb-1">
                  Kategori
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="Semua">Anggota &amp; Pengurus</option>
                  <option value="Aktif">Anggota Biasa (Aktif)</option>
                  <option value="Pengurus Aktif">Pengurus Aktif</option>
                  {activeTab === "recap" && (
                    <option value="Diberhentikan">Diberhentikan (SP 2)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-gray-500 mb-1">
                  Divisi
                </label>
                <select
                  value={divisionFilter}
                  onChange={(e) => setDivisionFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  {divisions.map((d) => (
                    <option key={d} value={d}>
                      {d === "Semua" ? "Semua Divisi" : d}
                    </option>
                  ))}
                </select>
              </div>

              {activeTab === "recap" && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-gray-500 mb-1">
                    Status SP
                  </label>
                  <select
                    value={evalFilter}
                    onChange={(e) => setEvalFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <option value="Semua">Semua Status</option>
                    <option value="eligible_sp2">Siap SP 2 (+1 Alpa)</option>
                    <option value="eligible_sp1">Kandidat SP 1 (&gt;3 Alpa)</option>
                    <option value="active_sp1">Sedang SP 1 Aktif</option>
                    <option value="normal">Aman (&le;3 Alpa)</option>
                    <option value="dismissed_sp2">Diberhentikan SP 2</option>
                  </select>
                </div>
              )}

              <div className={activeTab === "sp1_monitor" ? "lg:col-span-3" : ""}>
                <label className="block text-[11px] font-semibold uppercase text-gray-500 mb-1">
                  Pencarian
                </label>
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama atau NIM..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>
            </div>

            {activeTab === "recap" && quarterSelection === "custom" && (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Calendar size={15} />
                  <span>Rentang Tanggal:</span>
                </div>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
                />
                <span className="text-xs text-gray-400">s/d</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 1: Rekap Triwulan */}
        {activeTab === "recap" && (
          <div className="p-5 space-y-4">
            {!readOnly && selectedIds.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex flex-wrap items-center gap-3 text-sm text-amber-900">
                  <span className="font-semibold">
                    {selectedIds.length} data dipilih
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="text-xs text-gray-600 hover:underline"
                  >
                    Batalkan pilihan
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedForSp1.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        openConfirmSp1(
                          selectedForSp1.map((r) => ({
                            memberId: r.memberId,
                            name: r.name,
                            alpaCount: r.alpaInWindow,
                          }))
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700"
                    >
                      <ShieldAlert size={14} />
                      Terbitkan SP 1 ({selectedForSp1.length})
                    </button>
                  )}
                  {selectedForSp2.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        openConfirmSp2(
                          selectedForSp2.map((r) => ({
                            memberId: r.memberId,
                            name: r.name,
                            alpaCount: r.alpaAfterSp1,
                          }))
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
                    >
                      <UserX size={14} />
                      Eksekusi SP 2 / Berhentikan ({selectedForSp2.length})
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase text-gray-600 border-b border-gray-100">
                  <tr>
                    {!readOnly && (
                      <th className="py-3 px-3 w-10">
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          aria-label="Pilih semua baris"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(selectableFilteredIds);
                            } else {
                              setSelectedIds([]);
                            }
                          }}
                          className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                      </th>
                    )}
                    <th className="py-3 px-4">Anggota / Pengurus</th>
                    <th className="py-3 px-3">Kategori &amp; Divisi</th>
                    <th className="py-3 px-3 text-center">H / I / S</th>
                    <th className="py-3 px-3 text-center">Alpa (3 Bln)</th>
                    <th className="py-3 px-3 text-center">Alpa Pasca SP 1</th>
                    <th className="py-3 px-4">Status Kedisiplinan</th>
                    {!readOnly && <th className="py-3 px-4 text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={readOnly ? 6 : 8}
                        className="py-12 text-center text-gray-400"
                      >
                        Tidak ada data absensi anggota/pengurus sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => {
                      const checked = selectedIds.includes(row.memberId);
                      const isDisabledSelect = row.status === "Diberhentikan";
                      return (
                        <tr
                          key={row.memberId}
                          className={
                            row.evalStatus === "eligible_sp2"
                              ? "bg-red-50/40"
                              : row.evalStatus === "eligible_sp1"
                              ? "bg-amber-50/30"
                              : "bg-white hover:bg-gray-50/60"
                          }
                        >
                          {!readOnly && (
                            <td className="py-3 px-3 align-top">
                              <input
                                type="checkbox"
                                disabled={isDisabledSelect}
                                checked={checked}
                                aria-label={`Pilih ${row.name}`}
                                onChange={() => toggleRowSelection(row.memberId)}
                                className="mt-1 rounded border-gray-300 text-amber-600 focus:ring-amber-500 disabled:opacity-30"
                              />
                            </td>
                          )}
                          <td className="py-3 px-4 align-top">
                            <p className="font-semibold text-gray-900">
                              {row.name}
                            </p>
                            <p className="text-xs text-gray-400">{row.nim}</p>
                            {row.sp1Note && row.warningLevel === "sp1" && (
                              <p className="text-[11px] text-amber-700 mt-0.5 max-w-xs">
                                Ket SP 1: {row.sp1Note}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-3 align-top">
                            <span
                              className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                row.status === "Pengurus Aktif"
                                  ? "bg-purple-100 text-purple-700"
                                  : row.status === "Aktif"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {row.status}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {row.division}
                            </p>
                          </td>
                          <td className="py-3 px-3 text-center align-top font-mono text-xs">
                            <span className="text-emerald-700 font-semibold">
                              {row.hadirCount}
                            </span>{" "}
                            /{" "}
                            <span className="text-amber-700">
                              {row.izinCount}
                            </span>{" "}
                            /{" "}
                            <span className="text-orange-700">
                              {row.sakitCount}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center align-top">
                            <span
                              title={row.alpaAgendasInWindow
                                .map((a) => `${a.date}: ${a.title}`)
                                .join("\n")}
                              className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-lg text-xs font-bold ${
                                row.alpaInWindow > 3
                                  ? "bg-red-100 text-red-700"
                                  : row.alpaInWindow > 0
                                  ? "bg-gray-100 text-gray-800"
                                  : "text-gray-400"
                              }`}
                            >
                              {row.alpaInWindow}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center align-top">
                            {row.warningLevel === "sp1" ? (
                              <span
                                title={row.alpaAgendasAfterSp1
                                  .map((a) => `${a.date}: ${a.title}`)
                                  .join("\n")}
                                className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-lg text-xs font-bold ${
                                  row.alpaAfterSp1 >= 1
                                    ? "bg-red-600 text-white"
                                    : "bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                {row.alpaAfterSp1}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 align-top">
                            {renderEvalBadge(row)}
                          </td>
                          {!readOnly && (
                            <td className="py-3 px-4 text-right align-top">
                              {row.warningLevel === "none" &&
                                row.status !== "Diberhentikan" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openConfirmSp1([
                                        {
                                          memberId: row.memberId,
                                          name: row.name,
                                          alpaCount: row.alpaInWindow,
                                        },
                                      ])
                                    }
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                      row.evalStatus === "eligible_sp1"
                                        ? "bg-amber-600 text-white hover:bg-amber-700"
                                        : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                                    }`}
                                  >
                                    Terbitkan SP 1
                                  </button>
                                )}
                              {row.warningLevel === "sp1" &&
                                row.status !== "Diberhentikan" && (
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openConfirmSp2([
                                          {
                                            memberId: row.memberId,
                                            name: row.name,
                                            alpaCount: row.alpaAfterSp1,
                                          },
                                        ])
                                      }
                                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                        row.evalStatus === "eligible_sp2"
                                          ? "bg-red-600 text-white hover:bg-red-700"
                                          : "border border-red-200 text-red-700 hover:bg-red-50"
                                      }`}
                                    >
                                      Eksekusi SP 2
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openRevokeSp1(row)}
                                      title="Cabut SP 1"
                                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100"
                                    >
                                      <RotateCcw size={13} />
                                    </button>
                                  </div>
                                )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Pemantauan SP 1 Aktif */}
        {activeTab === "sp1_monitor" && (
          <div className="p-5">
            {sp1MonitorRows.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                Belum ada anggota atau pengurus yang berstatus SP 1 aktif pada periode{" "}
                {period.code}.
              </div>
            ) : (
              <div className="space-y-3">
                {sp1MonitorRows.map((row) => (
                  <div
                    key={row.memberId}
                    className={`p-4 rounded-xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                      row.evalStatus === "eligible_sp2"
                        ? "bg-red-50 border-red-300"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900">{row.name}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          {row.status} · {row.division}
                        </span>
                        {renderEvalBadge(row)}
                      </div>
                      <p className="text-xs text-gray-600">
                        Berlaku SP 1 sejak{" "}
                        <strong>{row.sp1IssuedAt || "-"}</strong> ·{" "}
                        {row.sp1Note || "Tanpa catatan tambahan"}
                      </p>
                      {row.alpaAgendasAfterSp1.length > 0 && (
                        <div className="text-xs text-red-700 font-medium pt-1">
                          Alpa pasca SP 1:{" "}
                          {row.alpaAgendasAfterSp1
                            .map((a) => `${a.title} (${a.date})`)
                            .join(", ")}
                        </div>
                      )}
                    </div>

                    {!readOnly && (
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => openRevokeSp1(row)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-xs font-medium hover:bg-gray-50"
                        >
                          <RotateCcw size={14} />
                          Cabut SP 1
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            openConfirmSp2([
                              {
                                memberId: row.memberId,
                                name: row.name,
                                alpaCount: row.alpaAfterSp1,
                              },
                            ])
                          }
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                            row.evalStatus === "eligible_sp2"
                              ? "bg-red-600 text-white hover:bg-red-700 shadow-xs"
                              : "bg-red-50 border border-red-200 text-red-700 hover:bg-red-100"
                          }`}
                        >
                          <UserX size={14} />
                          Eksekusi SP 2 (Berhentikan)
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Riwayat Audit */}
        {activeTab === "logs" && (
          <div className="p-5">
            {logs.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                Belum ada riwayat penerbitan/pencabutan SP pada periode ini.
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-600 border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-4">Tanggal Berlaku</th>
                      <th className="py-3 px-4">Anggota / Pengurus</th>
                      <th className="py-3 px-4">Tindakan</th>
                      <th className="py-3 px-4">Rekapan / Sumber</th>
                      <th className="py-3 px-4">Catatan</th>
                      <th className="py-3 px-4">Eksekutor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map((log) => {
                      const m = memberLookup.get(log.member_id);
                      return (
                        <tr key={log.id} className="bg-white">
                          <td className="py-3 px-4 whitespace-nowrap text-xs font-medium text-gray-700">
                            {log.effective_date}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-gray-900">
                              {m?.name || "Anggota"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {m?.division || "-"}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                log.action === "sp2_dismissed"
                                  ? "bg-red-100 text-red-700"
                                  : log.action === "sp1_revoked"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {log.action === "sp2_dismissed"
                                ? "SP 2 / Diberhentikan"
                                : log.action === "sp1_revoked"
                                ? "SP 1 Dicabut"
                                : "SP 1 Diterbitkan"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs">
                            <p className="text-gray-700">
                              {log.quarter_label || "-"}
                            </p>
                            <p className="text-gray-400">
                              {log.source === "ai_import"
                                ? "AI Pilah Daftar"
                                : log.source === "auto_recap"
                                ? "Rekap Otomatis"
                                : "Input Manual"}
                              {log.alpa_count > 0 ? ` · ${log.alpa_count}x Alpa` : ""}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-600 max-w-xs">
                            {log.note || "-"}
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-500">
                            {log.actor_name || "-"} ({log.actor_role || "-"})
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Action Modal */}
      {confirmState && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {confirmState.kind === "sp1"
                  ? `Terbitkan SP 1 (${confirmState.items.length} Orang)`
                  : confirmState.kind === "sp2"
                  ? `Eksekusi SP 2 / Berhentikan (${confirmState.items.length} Orang)`
                  : `Cabut Status SP 1 — ${confirmState.name}`}
              </h3>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setConfirmState(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmSubmit} className="p-6 space-y-4">
              {confirmState.kind !== "revoke_sp1" && (
                <div className="bg-gray-50 rounded-xl p-3 max-h-36 overflow-y-auto text-xs space-y-1 border border-gray-100">
                  {confirmState.items.map((item) => (
                    <div
                      key={item.memberId}
                      className="flex items-center justify-between"
                    >
                      <span className="font-semibold text-gray-800">
                        {item.name}
                      </span>
                      <span className="text-gray-500">
                        {item.alpaCount}x Alpa tercatat
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {confirmState.kind === "sp2" && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                  Tindakan ini akan mengubah status keanggotaan menjadi{" "}
                  <strong>Diberhentikan</strong> sekaligus menandai SP 2 secara
                  tercatat pada audit log.
                </div>
              )}

              {confirmState.kind !== "revoke_sp1" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tanggal Berlaku
                  </label>
                  <input
                    type="date"
                    required
                    value={confirmDate}
                    onChange={(e) => setConfirmDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {confirmState.kind === "revoke_sp1"
                    ? "Alasan Pencabutan SP 1 (Wajib)"
                    : "Catatan / Keterangan"}
                </label>
                <input
                  type="text"
                  required={confirmState.kind === "revoke_sp1"}
                  maxLength={300}
                  value={confirmNote}
                  onChange={(e) => setConfirmNote(e.target.value)}
                  placeholder={
                    confirmState.kind === "revoke_sp1"
                      ? "Mis. Koreksi absensi / hasil keputusan rapat pengurus"
                      : "Keterangan SP..."
                  }
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setConfirmState(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 ${
                    confirmState.kind === "sp2"
                      ? "bg-red-600 hover:bg-red-700"
                      : confirmState.kind === "revoke_sp1"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-amber-600 hover:bg-amber-700"
                  }`}
                >
                  {submitting
                    ? "Memproses..."
                    : confirmState.kind === "sp2"
                    ? "Konfirmasi Eksekusi SP 2"
                    : confirmState.kind === "revoke_sp1"
                    ? "Ya, Cabut SP 1"
                    : "Konfirmasi Terbitkan SP 1"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual SP 1 Onboarding Modal */}
      <InputSp1ManualModal
        isOpen={showManualSp1}
        onClose={() => setShowManualSp1(false)}
        members={members}
        onSubmit={async (payload) => {
          const res = await terbitkanSp1Massal({
            ...payload,
            source: "manual",
          });
          setBannerMsg({
            type: "success",
            text: `${res.updatedCount} anggota/pengurus berhasil ditandai berstatus SP 1.`,
          });
          router.refresh();
        }}
      />

      {/* AI SP 1 Onboarding Modal */}
      <AiSp1ImportModal
        isOpen={showAiSp1}
        onClose={() => setShowAiSp1(false)}
        members={members}
        aiConfigured={aiConfigured}
        onParseWithAi={parseDaftarSp1AI}
        onConfirmApply={async (payload) => {
          const res = await terbitkanSp1Massal({
            ...payload,
            source: "ai_import",
          });
          setBannerMsg({
            type: "success",
            text: `${res.updatedCount} anggota/pengurus dari daftar AI berhasil ditandai berstatus SP 1.`,
          });
          router.refresh();
        }}
      />
    </div>
  );
}
