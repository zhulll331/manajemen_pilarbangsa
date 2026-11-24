import { getSelectedPeriodForDashboard } from "@/lib/periods/server";
import { createClient } from "@/utils/supabase/server";
import TransaksiClient from "./TransaksiClient";

export default async function TransaksiPage() {
  const supabase = await createClient();
  const { selectedPeriod, schemaReady } = await getSelectedPeriodForDashboard();
  const pid = schemaReady ? selectedPeriod.id : null;

  let qTx = supabase
    .from("finance_transactions")
    .select("*, programs(title)")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  let qPrograms = supabase
    .from("programs")
    .select("id, title")
    .order("created_at", { ascending: false });

  let qDues = supabase
    .from("dues")
    .select("id, amount, payment_date, month, year, members(name)")
    .eq("status", "Lunas")
    .not("payment_date", "is", null);

  if (pid) {
    qTx = qTx.eq("period_id", pid);
    qPrograms = qPrograms.eq("period_id", pid);
    qDues = qDues.eq("period_id", pid);
  }

  const [{ data: transactions }, { data: programs }, { data: paidDues }] = await Promise.all([
    qTx,
    qPrograms,
    qDues,
  ]);

  const totalIuranDiterima = (paidDues || []).reduce(
    (sum, d) => sum + (Number(d.amount) || 0),
    0
  );

  // Group dues berdasarkan bulan/tahun PEMBAYARAN (payment_date),
  // bukan berdasarkan periode iuran — agar semua iuran yang diinput bendahara
  // pada bulan yang sama direkap menjadi 1 baris transaksi.
  const duesByPaymentMonth: Record<string, {
    totalAmount: number;
    paymentYear: number;
    paymentMonth: number;
    representativeDate: string; // tanggal terakhir dalam batch untuk urutan
    count: number;
  }> = {};

  (paidDues || []).forEach((d: any) => {
    if (!d.payment_date) return;
    const date = new Date(d.payment_date);
    const payYear = date.getFullYear();
    const payMonth = date.getMonth() + 1; // 1-indexed
    const key = `${payYear}-${String(payMonth).padStart(2, "0")}`;

    if (!duesByPaymentMonth[key]) {
      duesByPaymentMonth[key] = {
        totalAmount: 0,
        paymentYear: payYear,
        paymentMonth: payMonth,
        representativeDate: d.payment_date,
        count: 0,
      };
    }
    duesByPaymentMonth[key].totalAmount += Number(d.amount) || 0;
    duesByPaymentMonth[key].count += 1;
    // Ambil tanggal terbaru dalam batch sebagai tanggal transaksi
    if (d.payment_date > duesByPaymentMonth[key].representativeDate) {
      duesByPaymentMonth[key].representativeDate = d.payment_date;
    }
  });

  // 1 baris per bulan input — deskripsi cukup "Iuran Anggota"
  const duesAsTransactions = Object.entries(duesByPaymentMonth).map(([key, g]) => ({
    id: `dues-month-${key}`,
    transaction_date: g.representativeDate,
    type: "Pemasukan",
    category: "Iuran",
    amount: g.totalAmount,
    description: "Iuran Anggota",
    responsible_person: "Bendahara",
    proof_url: null,
    programs: null,
    program_id: null,
    created_at: g.representativeDate,
    _isDues: true,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Transaksi Keuangan</h1>
        <p className="text-gray-600 mt-1">Kelola data pemasukan dan pengeluaran organisasi.</p>
      </div>

      <TransaksiClient
        transactions={transactions || []}
        programs={programs || []}
        totalIuranDiterima={totalIuranDiterima}
        duesTransactions={duesAsTransactions}
      />
    </div>
  );
}

