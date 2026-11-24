export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export const MONTHS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" }
];

export const PERIOD_START_MONTH = 7; // Bulan awal periode kepengurusan (7 = Juli)
export const BASE_START_YEAR = 2025; // Tahun aplikasi mulai digunakan
export const CURRENT_YEAR = new Date().getFullYear();

/**
 * Menghitung tahun mulai dari periode kepengurusan aktif saat ini.
 */
export function getActivePeriodStartYear(): number {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  return currentMonth >= PERIOD_START_MONTH ? currentYear : currentYear - 1;
}

/**
 * Menghasilkan opsi daftar tahun periode untuk dropdown filter.
 */
export function generatePeriodOptions(): number[] {
  const activeStartYear = getActivePeriodStartYear();
  const endYear = activeStartYear + 1;
  const years: number[] = [];
  for (let y = BASE_START_YEAR; y <= endYear; y++) {
    years.push(y);
  }
  return years;
}

/**
 * Menghasilkan daftar 12 bulan untuk satu periode kepengurusan (dari Juli s.d. Juni tahun berikutnya).
 */
export function getPeriodMonths(startYear: number) {
  const months = [];
  let currentMonth = PERIOD_START_MONTH;
  let currentYear = startYear;

  for (let i = 0; i < 12; i++) {
    months.push({
      month: currentMonth,
      year: currentYear,
      label: MONTHS.find(m => m.value === currentMonth)?.label || "",
      key: `period_${currentYear}_${currentMonth}`
    });

    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }
  return months;
}

export interface FinanceMemberRow {
  id: string;
  name: string;
  status?: string | null;
}

export interface FinanceDueRow {
  member_id?: string | null;
  month?: number;
  year?: number;
  amount?: number | null;
  status?: string | null;
  payment_date?: string | null;
}

export interface FinanceTransactionRow {
  type?: string | null;
  amount?: number | null;
  transaction_date?: string | null;
}

export interface DuesMatrixCell {
  status: "Lunas" | "Belum Lunas";
  amount?: number;
}

export interface DuesMatrixRow {
  id: string;
  member_id: string;
  member: string;
  memberStatus: string;
  transactions: FinanceDueRow[];
  totalTerkumpul: number;
  tunggakan: number;
  cells: Record<string, DuesMatrixCell>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [periodKey: string]: any;
}

/**
 * Memformat data matriks pembayaran iuran anggota per periode.
 * Anggota berstatus Diberhentikan/Alumni/Cuti tetap tampil bila punya riwayat bayar,
 * namun tidak lagi dihitung sebagai penunggak iuran baru.
 */
export function formatMatrixData(
  dues: FinanceDueRow[] = [],
  members: FinanceMemberRow[] = [],
  startYear: number
): DuesMatrixRow[] {
  const periodMonths = getPeriodMonths(startYear);

  const filteredDues = dues.filter(d => {
    return periodMonths.some(pm => pm.month === d.month && pm.year === d.year);
  });

  const rows: DuesMatrixRow[] = [];

  for (const member of members) {
    const memberDues = filteredDues.filter(d => d.member_id === member.id);
    const status = member.status || "Aktif";
    const isActiveMember = status === "Aktif" || status === "Pengurus Aktif";
    const hasTransactionsInPeriod = memberDues.length > 0;

    if (!isActiveMember && !hasTransactionsInPeriod) {
      continue;
    }

    const matrixRow: DuesMatrixRow = {
      id: member.id,
      member_id: member.id,
      member: member.name,
      memberStatus: status,
      transactions: memberDues,
      totalTerkumpul: 0,
      tunggakan: 0,
      cells: {},
    };

    const currentRealMonth = new Date().getMonth() + 1;
    const currentRealYear = new Date().getFullYear();

    for (const pm of periodMonths) {
      const payment = memberDues.find(
        d => d.month === pm.month && d.year === pm.year && d.status === "Lunas"
      );

      const isPastOrCurrent =
        pm.year < currentRealYear || (pm.year === currentRealYear && pm.month <= currentRealMonth);

      if (payment) {
        const cell: DuesMatrixCell = { status: "Lunas", amount: payment.amount || 0 };
        matrixRow[pm.key] = cell;
        matrixRow.cells[pm.key] = cell;
        matrixRow.totalTerkumpul += Number(payment.amount) || 0;
      } else {
        const cell: DuesMatrixCell = { status: "Belum Lunas" };
        matrixRow[pm.key] = cell;
        matrixRow.cells[pm.key] = cell;
        if (isPastOrCurrent && isActiveMember) {
          matrixRow.tunggakan += 1;
        }
      }
    }

    rows.push(matrixRow);
  }

  return rows;
}

/**
 * Menghitung jumlah anggota yang memiliki tunggakan / belum lunas iuran pada periode aktif.
 */
export function calculateUnpaidMembersCount(
  members: FinanceMemberRow[] = [],
  dues: FinanceDueRow[] = [],
  startYear?: number
): number {
  const activeYear = startYear ?? getActivePeriodStartYear();
  const matrixData = formatMatrixData(dues, members, activeYear);
  return matrixData.filter(row => row.tunggakan > 0).length;
}

/**
 * Menghitung total transaksi dan saldo kas.
 */
export function aggregateFinancialData(
  transactions: FinanceTransactionRow[] = [],
  dues: FinanceDueRow[] = []
) {
  let totalPemasukan = 0;
  let totalPengeluaran = 0;

  const monthlyMap: Record<string, { pemasukan: number; pengeluaran: number; year: number; month: string }> = {};

  transactions.forEach((t) => {
    const amount = Number(t.amount) || 0;
    if (t.type === "Pemasukan") totalPemasukan += amount;
    else totalPengeluaran += amount;

    if (t.transaction_date) {
      const date = new Date(t.transaction_date);
      const year = date.getFullYear();
      const monthIdx = date.getMonth();
      const monthName = MONTH_NAMES[monthIdx];
      const monthKey = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;

      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { pemasukan: 0, pengeluaran: 0, year, month: monthName };

      if (t.type === "Pemasukan") monthlyMap[monthKey].pemasukan += amount;
      else monthlyMap[monthKey].pengeluaran += amount;
    }
  });

  dues.forEach((d) => {
    if (d.status === "Lunas" && d.payment_date) {
      const amount = Number(d.amount) || 0;
      totalPemasukan += amount;

      const date = new Date(d.payment_date);
      const year = date.getFullYear();
      const monthIdx = date.getMonth();
      const monthName = MONTH_NAMES[monthIdx];
      const monthKey = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;

      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { pemasukan: 0, pengeluaran: 0, year, month: monthName };

      monthlyMap[monthKey].pemasukan += amount;
    }
  });

  const saldoKas = totalPemasukan - totalPengeluaran;

  const monthlyData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, val]) => val);

  return { totalPemasukan, totalPengeluaran, saldoKas, monthlyData };
}
