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
 * Jika bulan berjalan >= Juli, maka periode dimulai tahun ini (misal Juli 2026 -> Periode 2026/2027).
 * Jika bulan berjalan < Juli, maka periode dimulai tahun lalu (misal Maret 2026 -> Periode 2025/2026).
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
  const endYear = activeStartYear + 1; // +1 tahun ke depan untuk persiapan
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

/**
 * Memformat data matriks pembayaran iuran anggota per periode.
 */
export function formatMatrixData(dues: any[] = [], members: any[] = [], startYear: number) {
  const periodMonths = getPeriodMonths(startYear);

  const filteredDues = dues.filter(d => {
    return periodMonths.some(pm => pm.month === d.month && pm.year === d.year);
  });

  return members
    .map(member => {
      const memberDues = filteredDues.filter(d => d.member_id === member.id);

      const isActive = member.status === "Aktif" || member.status === "Pengurus Aktif" || !member.status;
      const hasTransactionsInPeriod = memberDues.length > 0;

      if (!isActive && !hasTransactionsInPeriod) {
        return null;
      }

      const matrixRow: any = {
        id: member.id,
        member_id: member.id,
        member: member.name,
        transactions: memberDues,
        totalTerkumpul: 0,
        tunggakan: 0,
      };

      const currentRealMonth = new Date().getMonth() + 1;
      const currentRealYear = new Date().getFullYear();

      for (const pm of periodMonths) {
        const payment = memberDues.find(
          d => d.month === pm.month && d.year === pm.year && d.status === "Lunas"
        );

        // Tunggakan dihitung jika bulan target berada di masa lalu atau bulan berjalan saat ini
        const isPastOrCurrent =
          pm.year < currentRealYear || (pm.year === currentRealYear && pm.month <= currentRealMonth);

        if (payment) {
          matrixRow[pm.key] = { status: "Lunas", amount: payment.amount };
          matrixRow.totalTerkumpul += payment.amount || 0;
        } else {
          matrixRow[pm.key] = { status: "Belum Lunas" };
          if (isPastOrCurrent) {
            matrixRow.tunggakan += 1;
          }
        }
      }

      return matrixRow;
    })
    .filter(Boolean);
}

/**
 * Menghitung jumlah anggota yang memiliki tunggakan / belum lunas iuran pada periode aktif.
 */
export function calculateUnpaidMembersCount(members: any[] = [], dues: any[] = [], startYear?: number): number {
  const activeYear = startYear ?? getActivePeriodStartYear();
  const matrixData = formatMatrixData(dues, members, activeYear);
  return matrixData.filter((row: any) => row.tunggakan > 0).length;
}

/**
 * Menghitung total transaksi dan saldo kas.
 */
export function aggregateFinancialData(transactions: any[] = [], dues: any[] = []) {
  let totalPemasukan = 0;
  let totalPengeluaran = 0;

  const monthlyMap: Record<string, { pemasukan: number; pengeluaran: number; year: number; month: string }> = {};

  // 1. Process Finance Transactions
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

  // 2. Process Paid Dues
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
    .map(([_, val]) => val);

  return { totalPemasukan, totalPengeluaran, saldoKas, monthlyData };
}
