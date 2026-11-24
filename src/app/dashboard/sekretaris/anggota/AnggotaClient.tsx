"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Lock,
  Plus,
  Search,
  Sparkles,
  UserX,
  Users,
  X,
} from "lucide-react";
import { DataModal } from "@/components/DataModal";
import { DeleteConfirm } from "@/components/DeleteConfirm";
import { DataTable, type Column } from "@/components/DataTable";
import { ImportCSVModal } from "@/components/ImportCSVModal";
import type { BulkDismissItem } from "@/lib/members/dismissal";
import { AiDismissMembersModal } from "./AiDismissMembersModal";
import {
  BulkDismissMembersModal,
  type MemberDismissOption,
} from "./BulkDismissMembersModal";
import {
  berhentikanAnggotaMassal,
  editAnggota,
  hapusAnggota,
  importAnggotaBatch,
  parsePemberhentianAnggotaAI,
  tambahAnggota,
} from "./actions";

interface Member {
  id: string;
  name: string;
  nim: string;
  faculty: string;
  study_program: string;
  generation: string;
  phone: string;
  division: string;
  status: string;
  status_note?: string | null;
  status_updated_at?: string | null;
}

const divisions = ["Pendidikan", "Sosial", "Kewirausahaan", "Seni Budaya"];
const statuses = ["Aktif", "Pengurus Aktif", "Cuti", "Alumni", "Diberhentikan"];

export default function AnggotaClient({
  members,
  isLocked = false,
  periodCode,
  aiConfigured = true,
}: {
  members: Member[];
  isLocked?: boolean;
  periodCode?: string;
  aiConfigured?: boolean;
}) {
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showBulkDismiss, setShowBulkDismiss] = useState(false);
  const [showAiDismiss, setShowAiDismiss] = useState(false);

  const [editData, setEditData] = useState<Member | null>(null);
  const [modalStatus, setModalStatus] = useState("Aktif");
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [divisionFilter, setDivisionFilter] = useState("Semua");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bannerMsg, setBannerMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return members.filter((m) => {
      const matchesQuery =
        !q ||
        m.name.toLowerCase().includes(q) ||
        (m.nim && m.nim.toLowerCase().includes(q));
      const matchesStatus = statusFilter === "Semua" || m.status === statusFilter;
      const matchesDivision =
        divisionFilter === "Semua" || m.division === divisionFilter;
      return matchesQuery && matchesStatus && matchesDivision;
    });
  }, [members, searchQuery, statusFilter, divisionFilter]);

  const dismissibleFilteredIds = useMemo(
    () => filteredMembers.filter((m) => m.status !== "Diberhentikan").map((m) => m.id),
    [filteredMembers]
  );

  const selectedMembers: MemberDismissOption[] = useMemo(() => {
    const idSet = new Set(selectedIds);
    return members
      .filter((m) => idSet.has(m.id) && m.status !== "Diberhentikan")
      .map((m) => ({
        id: m.id,
        name: m.name,
        nim: m.nim,
        division: m.division,
        status: m.status,
      }));
  }, [members, selectedIds]);

  const memberOptionsForAi: MemberDismissOption[] = useMemo(
    () =>
      members.map((m) => ({
        id: m.id,
        name: m.name,
        nim: m.nim,
        division: m.division,
        status: m.status,
      })),
    [members]
  );

  const columns: Column<Member>[] = [
    {
      key: "name",
      label: "Nama",
      render: (m) => (
        <div>
          <span className="font-medium text-gray-900">{m.name}</span>
          {m.status === "Diberhentikan" && m.status_note && (
            <p className="text-xs text-red-600/80 mt-0.5 max-w-xs line-clamp-2" title={m.status_note}>
              Ket: {m.status_note}
            </p>
          )}
        </div>
      ),
    },
    { key: "nim", label: "NIM" },
    { key: "faculty", label: "Fakultas" },
    { key: "study_program", label: "Prodi" },
    { key: "generation", label: "Angkatan" },
    { key: "division", label: "Divisi" },
    {
      key: "status",
      label: "Status",
      render: (m) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
            m.status === "Pengurus Aktif"
              ? "bg-purple-100 text-purple-700"
              : m.status === "Aktif"
              ? "bg-green-100 text-green-700"
              : m.status === "Cuti"
              ? "bg-yellow-100 text-yellow-700"
              : m.status === "Diberhentikan"
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {m.status}
        </span>
      ),
    },
  ];

  const openCreateModal = () => {
    setEditData(null);
    setModalStatus("Aktif");
    setShowModal(true);
  };

  const openEditModal = (m: Member) => {
    setEditData(m);
    setModalStatus(m.status || "Aktif");
    setShowModal(true);
  };

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setBannerMsg(null);
    try {
      if (editData) {
        formData.append("id", editData.id);
        await editAnggota(editData.id, formData);
        setBannerMsg({ type: "success", text: `Data ${editData.name} berhasil diperbarui.` });
      } else {
        await tambahAnggota(formData);
        setBannerMsg({ type: "success", text: "Anggota baru berhasil ditambahkan." });
      }
      setShowModal(false);
      setEditData(null);
    } catch (e) {
      setBannerMsg({
        type: "error",
        text: "Gagal menyimpan data: " + (e as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    setBannerMsg(null);
    try {
      await hapusAnggota(deleteTarget.id);
      setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
      setBannerMsg({ type: "success", text: `Data ${deleteTarget.name} telah dihapus permanen.` });
      setShowDelete(false);
      setDeleteTarget(null);
    } catch (e) {
      setBannerMsg({
        type: "error",
        text: "Gagal menghapus: " + (e as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDismiss = async (items: BulkDismissItem[]) => {
    const res = await berhentikanAnggotaMassal(items);
    const dismissedSet = new Set(items.map((i) => i.memberId));
    setSelectedIds((prev) => prev.filter((id) => !dismissedSet.has(id)));
    setShowBulkDismiss(false);
    setShowAiDismiss(false);
    setBannerMsg({
      type: "success",
      text: `${res.updatedCount} anggota berhasil ditandai berstatus Diberhentikan.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 text-[var(--color-primary)] shrink-0 mt-1 sm:mt-0">
            <Users size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Data Anggota</h1>
              {periodCode && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {isLocked && <Lock size={12} />}
                  Periode {periodCode}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 line-clamp-2 sm:line-clamp-none">
              Kelola data anggota UKM Pilar Bangsa
            </p>
          </div>
        </div>

        {!isLocked && (
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setShowAiDismiss(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm font-medium hover:bg-amber-100 transition-colors shadow-xs"
            >
              <Sparkles size={16} />
              AI Pilah Pemberhentian
            </button>
            <button
              type="button"
              onClick={() => setShowImport(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-xs"
            >
              Import CSV
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--color-secondary)] transition-colors shadow-xs"
            >
              <Plus size={18} />
              Tambah Anggota
            </button>
          </div>
        )}
      </div>

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
            {bannerMsg.type === "success" && <CheckCircle2 size={17} className="shrink-0" />}
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

      {/* Search & Filters + Table */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Cari nama anggota atau NIM..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter status anggota"
            className="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <option value="Semua">Semua Status</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            aria-label="Filter divisi anggota"
            className="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <option value="Semua">Semua Divisi</option>
            {divisions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Bulk Action Bar */}
        {!isLocked && selectedMembers.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
            <div className="flex flex-wrap items-center gap-3 text-sm text-red-900">
              <span className="font-semibold">
                {selectedMembers.length} anggota dipilih
              </span>
              {dismissibleFilteredIds.length > selectedMembers.length && (
                <button
                  type="button"
                  onClick={() => setSelectedIds(dismissibleFilteredIds)}
                  className="text-xs font-medium text-red-700 underline hover:text-red-900"
                >
                  Pilih semua ({dismissibleFilteredIds.length}) hasil filter
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-xs font-medium text-gray-600 hover:text-gray-900"
              >
                Batalkan pilihan
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowBulkDismiss(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-xs sm:text-sm font-semibold hover:bg-red-700 transition-colors"
            >
              <UserX size={16} />
              Tandai Diberhentikan
            </button>
          </div>
        )}

        <DataTable
          pagination
          pageSize={10}
          columns={columns}
          data={filteredMembers}
          selectable={!isLocked}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          isRowSelectable={(m) => m.status !== "Diberhentikan"}
          onEdit={isLocked ? undefined : openEditModal}
          onDelete={
            isLocked
              ? undefined
              : (m) => {
                  setDeleteTarget(m);
                  setShowDelete(true);
                }
          }
          emptyMessage="Belum ada data anggota yang sesuai."
        />
      </div>

      {/* Modal Form */}
      <DataModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditData(null);
        }}
        title={editData ? "Edit Anggota" : "Tambah Anggota Baru"}
      >
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input
              name="name"
              defaultValue={editData?.name}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIM</label>
              <input
                name="nim"
                defaultValue={editData?.nim}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Angkatan</label>
              <input
                name="generation"
                defaultValue={editData?.generation}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fakultas</label>
              <input
                name="faculty"
                defaultValue={editData?.faculty}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Program Studi
              </label>
              <input
                name="study_program"
                defaultValue={editData?.study_program}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
            <input
              name="phone"
              defaultValue={editData?.phone}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Divisi</label>
              <input
                list="divisions"
                name="division"
                defaultValue={editData?.division || ""}
                placeholder="Pilih atau ketik divisi..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition bg-white"
              />
              <datalist id="divisions">
                {divisions.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={modalStatus}
                onChange={(e) => setModalStatus(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition bg-white"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {modalStatus === "Diberhentikan" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keterangan Pemberhentian
              </label>
              <input
                name="status_note"
                maxLength={300}
                defaultValue={editData?.status_note || ""}
                placeholder="Alasan pemberhentian anggota..."
                className="w-full px-4 py-2.5 border border-red-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setEditData(null);
              }}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-secondary)] transition-colors disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : editData ? "Simpan Perubahan" : "Tambah Anggota"}
            </button>
          </div>
        </form>
      </DataModal>

      {/* Delete Confirm */}
      <DeleteConfirm
        isOpen={showDelete}
        onClose={() => {
          setShowDelete(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        loading={loading}
        message={`Apakah Anda yakin ingin menghapus permanen ${deleteTarget?.name}? Untuk anggota yang keluar/dipecat, disarankan menggunakan status "Diberhentikan" agar histori organisasi tetap tersimpan.`}
      />

      {/* Import CSV Modal */}
      <ImportCSVModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={async (data) => {
          await importAnggotaBatch(data as Record<string, unknown>[]);
        }}
        templateHeaders={[
          "Nama",
          "NIM",
          "Fakultas",
          "Prodi",
          "Angkatan",
          "Telepon",
          "Divisi",
          "Status",
        ]}
        title="Import Data Anggota"
      />

      {/* Bulk Dismiss Modal */}
      <BulkDismissMembersModal
        isOpen={showBulkDismiss}
        onClose={() => setShowBulkDismiss(false)}
        selectedMembers={selectedMembers}
        onRemoveMember={(id) =>
          setSelectedIds((prev) => prev.filter((existing) => existing !== id))
        }
        onConfirm={handleConfirmDismiss}
      />

      {/* AI Dismissal Parser Modal */}
      <AiDismissMembersModal
        isOpen={showAiDismiss}
        onClose={() => setShowAiDismiss(false)}
        members={memberOptionsForAi}
        aiConfigured={aiConfigured}
        onParseWithAi={parsePemberhentianAnggotaAI}
        onConfirmApply={handleConfirmDismiss}
      />
    </div>
  );
}
