export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

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
