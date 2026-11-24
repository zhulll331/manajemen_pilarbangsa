'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Archive,
  CalendarRange,
  CheckCircle2,
  Eye,
  History,
  Info,
  Lock,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { DataModal } from '@/components/DataModal';
import type {
  OrganizationPeriod,
  PeriodAuditLog,
  PeriodClosingSummary,
} from '@/lib/periods/types';
import { suggestNextPeriod } from '@/lib/periods/utils';
import {
  selectDashboardPeriodAction,
  transitionActivePeriodAction,
} from './actions';

interface PeriodeClientProps {
  periods: OrganizationPeriod[];
  activePeriod: OrganizationPeriod;
  selectedPeriod: OrganizationPeriod;
  schemaReady: boolean;
  closingSummary: PeriodClosingSummary | null;
  auditLogs: PeriodAuditLog[];
  actorRole: string;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function PeriodeClient({
  periods,
  activePeriod,
  selectedPeriod,
  schemaReady,
  closingSummary,
  auditLogs,
  actorRole,
}: PeriodeClientProps) {
  const router = useRouter();
  const suggested = suggestNextPeriod(activePeriod);

  const [showWizard, setShowWizard] = useState(false);
  const [newCode, setNewCode] = useState(suggested.code);
  const [newName, setNewName] = useState(suggested.name);
  const [cabinetName, setCabinetName] = useState('');
  const [theme, setTheme] = useState('');
  const [startYear, setStartYear] = useState(suggested.startYear);
  const [endYear, setEndYear] = useState(suggested.endYear);
  const [startDate, setStartDate] = useState(suggested.startDate);
  const [endDate, setEndDate] = useState(suggested.endDate);
  const [lockNotes, setLockNotes] = useState('');
  const [confirmCode, setConfirmCode] = useState('');

  const [carryMembers, setCarryMembers] = useState(true);
  const [carryHero, setCarryHero] = useState(true);
  const [carryMoments, setCarryMoments] = useState(true);
  const [carryVisiMisi, setCarryVisiMisi] = useState(true);
  const [carryStruktur, setCarryStruktur] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [wizardError, setWizardError] = useState('');
  const [bannerMsg, setBannerMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const expectedConfirm = `KUNCI ${activePeriod.code}`.toUpperCase();
  const canConfirmLock = confirmCode.trim().toUpperCase() === expectedConfirm;

  const handleOpenWizard = () => {
    const next = suggestNextPeriod(activePeriod);
    setNewCode(next.code);
    setNewName(next.name);
    setStartYear(next.startYear);
    setEndYear(next.endYear);
    setStartDate(next.startDate);
    setEndDate(next.endDate);
    setCabinetName('');
    setTheme('');
    setLockNotes('');
    setConfirmCode('');
    setWizardError('');
    setShowWizard(true);
  };

  const handleSwitchPeriod = async (periodId: string) => {
    setSwitchingId(periodId);
    const res = await selectDashboardPeriodAction(periodId);
    setSwitchingId(null);
    if (!res.success) {
      setBannerMsg({ type: 'error', text: res.error || 'Gagal mengganti tampilan periode.' });
      return;
    }
    router.refresh();
  };

  const handleTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setWizardError('');
    setBannerMsg(null);

    const res = await transitionActivePeriodAction({
      newCode,
      newName,
      cabinetName,
      theme,
      startYear: Number(startYear),
      endYear: Number(endYear),
      startDate,
      endDate,
      lockNotes,
      confirmCode,
      carryOver: {
        members: carryMembers,
        heroSlides: carryHero,
        momentPhotos: carryMoments,
        visiMisi: carryVisiMisi,
        strukturPimpinan: carryStruktur,
      },
    });

    setSubmitting(false);
    if (!res.success) {
      setWizardError(res.error || 'Gagal memproses pergantian periode.');
      return;
    }

    setShowWizard(false);
    setBannerMsg({
      type: 'success',
      text: `Periode ${activePeriod.code} telah dikunci permanen dan Periode ${res.newPeriodCode} kini aktif berjalan.`,
    });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-[var(--color-primary)] shrink-0">
            <History size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              Periode Kepengurusan
            </h1>
            <p className="text-sm text-gray-500">
              Kelola pergantian periode, penguncian arsip tahun sebelumnya, dan peninjauan data historis.
              Wewenang: Ketua &amp; Sekretaris (login sebagai <strong className="capitalize">{actorRole}</strong>).
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={!schemaReady}
          onClick={handleOpenWizard}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-secondary)] transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={16} />
          Mulai Pergantian Periode Baru
        </button>
      </div>

      {!schemaReady && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-900 flex items-start gap-3"
        >
          <Info size={18} className="shrink-0 mt-0.5 text-amber-600" />
          <div>
            <p className="font-semibold">Skema Multi-Periode Belum Dijalankan di Database</p>
            <p className="text-xs mt-1 text-amber-800">
              Jalankan script SQL <code>supabase_tahap20_multi_period.sql</code> di Supabase SQL
              Editor agar seluruh tabel memiliki isolasi periode, lock permanen di level trigger
              PostgreSQL, serta fitur pergantian periode dapat digunakan.
            </p>
          </div>
        </div>
      )}

      {bannerMsg && (
        <div
          role={bannerMsg.type === 'error' ? 'alert' : 'status'}
          className={`p-4 rounded-2xl border text-sm flex items-center gap-2.5 ${
            bannerMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{bannerMsg.text}</span>
        </div>
      )}

      {/* Active Period Summary Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <Sparkles size={12} /> Periode Aktif Saat Ini
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <CalendarRange size={13} /> {activePeriod.start_date} s.d. {activePeriod.end_date}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {activePeriod.name} ({activePeriod.code})
            </h2>
            {(activePeriod.cabinet_name || activePeriod.theme) && (
              <p className="text-sm text-gray-600">
                {[activePeriod.cabinet_name, activePeriod.theme].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
              Saldo Kas Periode Aktif
            </p>
            <p className="text-2xl font-extrabold text-gray-900">
              {formatRupiah(closingSummary?.financialBalance || 0)}
            </p>
          </div>
        </div>

        {closingSummary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {[
              { label: 'Anggota Aktif/Cuti', val: closingSummary.counts.membersActive },
              { label: 'Diberhentikan', val: closingSummary.counts.membersDismissed },
              { label: 'Program Kerja', val: closingSummary.counts.programsTotal },
              { label: 'Agenda & Rapat', val: closingSummary.counts.agendasTotal },
              { label: 'Surat & Notulensi', val: closingSummary.counts.lettersTotal + closingSummary.counts.minutesTotal },
            ].map((stat) => (
              <div key={stat.label} className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">{stat.val}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Period List */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-gray-900">Daftar Semua Periode</h3>
            <p className="text-xs text-gray-500">
              Periode yang sudah diganti berstatus terkunci permanen sebagai arsip referensi organisasi.
            </p>
          </div>
        </div>

        <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
          {periods.map((period) => {
            const isCurrentlyViewed = period.id === selectedPeriod.id;
            const isLocked = period.status === 'locked';
            return (
              <div
                key={period.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCurrentlyViewed ? 'bg-blue-50/40' : 'bg-white'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900">{period.name}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                      {period.code}
                    </span>
                    {period.status === 'active' ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                        Aktif
                      </span>
                    ) : isLocked ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                        <Lock size={11} /> Terkunci Permanen
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                        Draft
                      </span>
                    )}
                    {isCurrentlyViewed && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
                        Sedang Dibuka
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Rentang: {period.start_date} s.d. {period.end_date}
                    {period.cabinet_name ? ` · ${period.cabinet_name}` : ''}
                    {period.lock_notes ? ` · Catatan tutup: ${period.lock_notes}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {schemaReady && (
                    <button
                      type="button"
                      disabled={isCurrentlyViewed || switchingId === period.id}
                      onClick={() => handleSwitchPeriod(period.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      {isLocked ? <Archive size={14} /> : <Eye size={14} />}
                      {isCurrentlyViewed
                        ? 'Sedang Dibuka'
                        : isLocked
                        ? 'Lihat Arsip Periode'
                        : 'Masuk Periode Aktif'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit History */}
      {auditLogs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-3">
          <h3 className="text-base font-bold text-gray-900">Riwayat Audit Pergantian Periode</h3>
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <span className="font-semibold text-gray-900">
                    {log.actor_name || log.actor_email || 'Pengurus'}
                  </span>{' '}
                  <span className="text-gray-500 capitalize">({log.actor_role || 'pengurus'})</span>{' '}
                  melakukan <strong className="text-gray-800">{log.action}</strong>
                  {typeof log.summary?.locked_period_code === 'string' &&
                    typeof log.summary?.new_period_code === 'string' && (
                      <span>
                        {' '}
                        dari <strong>{log.summary.locked_period_code}</strong> ke{' '}
                        <strong>{log.summary.new_period_code}</strong>
                      </span>
                    )}
                </div>
                <span className="text-gray-400">
                  {new Date(log.created_at).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wizard Modal */}
      <DataModal
        isOpen={showWizard}
        onClose={() => {
          if (!submitting) setShowWizard(false);
        }}
        title="Pergantian & Penguncian Periode Baru"
      >
        <form onSubmit={handleTransition} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <ShieldAlert size={18} className="shrink-0 mt-0.5 text-amber-700" />
            <div className="space-y-1">
              <p className="font-bold">Peringatan Penguncian Permanen</p>
              <p>
                Setelah dikonfirmasi, seluruh data <strong>Periode {activePeriod.code}</strong>{' '}
                (anggota, proker, keuangan, surat, kegiatan, berita, banner, foto momen) akan
                dikunci permanen menjadi mode baca dan tidak dapat diubah oleh pengurus periode baru.
              </p>
            </div>
          </div>

          {wizardError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2"
            >
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{wizardError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Kode Periode Baru
              </label>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="2027/2028"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nama Periode Baru
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Periode 2027/2028"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tahun Mulai
              </label>
              <input
                type="number"
                required
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tahun Berakhir
              </label>
              <input
                type="number"
                required
                value={endYear}
                onChange={(e) => setEndYear(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tanggal Berakhir
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nama Kabinet (Opsional)
              </label>
              <input
                type="text"
                value={cabinetName}
                onChange={(e) => setCabinetName(e.target.value)}
                placeholder="Misal: Kabinet Sinergi"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tema Periode (Opsional)
              </label>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="Tema kepengurusan..."
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Catatan Penutupan Periode {activePeriod.code} (Opsional)
            </label>
            <input
              type="text"
              value={lockNotes}
              onChange={(e) => setLockNotes(e.target.value)}
              placeholder="Misal: Ditutup usai LPJ Musyawarah Anggota"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
            <p className="text-xs font-semibold text-gray-700">
              Data Awal yang Dibawa (Carry-Over) ke Periode {newCode}:
            </p>
            <label className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={carryMembers}
                onChange={(e) => setCarryMembers(e.target.checked)}
                className="mt-0.5 rounded border-gray-300"
              />
              <span>
                Salin anggota berstatus Aktif / Pengurus Aktif / Cuti (anggota Diberhentikan &amp;
                Alumni tidak dibawa; saldo kas &amp; iuran mulai Rp 0)
              </span>
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={carryHero}
                onChange={(e) => setCarryHero(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>Salin Hero Banner aktif beranda sebagai template awal</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={carryMoments}
                onChange={(e) => setCarryMoments(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>Salin Foto Momen Pilar Bangsa aktif sebagai galeri awal</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={carryVisiMisi}
                onChange={(e) => setCarryVisiMisi(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>Salin Visi &amp; Misi organisasi</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={carryStruktur}
                onChange={(e) => setCarryStruktur(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>Salin susunan Tokoh &amp; Pemimpin lama</span>
            </label>
          </div>

          <div className="p-3.5 rounded-xl bg-red-50/80 border border-red-200 space-y-2">
            <label
              htmlFor="confirm-lock-period"
              className="block text-xs font-semibold text-red-900"
            >
              Ketik <code className="bg-white px-1.5 py-0.5 rounded border border-red-200">{expectedConfirm}</code> untuk mengunci permanen dan mengaktifkan periode baru:
            </label>
            <input
              id="confirm-lock-period"
              type="text"
              required
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              placeholder={expectedConfirm}
              className="w-full px-3 py-2 border border-red-300 rounded-xl text-sm font-mono bg-white"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setShowWizard(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || !canConfirmLock}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-40"
            >
              {submitting ? 'Memproses...' : 'Kunci Periode Lama & Aktifkan Baru'}
            </button>
          </div>
        </form>
      </DataModal>
    </div>
  );
}
