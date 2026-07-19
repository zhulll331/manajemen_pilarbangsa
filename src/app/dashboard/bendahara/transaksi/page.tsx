import { createClient } from "@/utils/supabase/server";
import TransaksiClient from "./TransaksiClient";

export default async function TransaksiPage() {
  const supabase = await createClient();

  const { data: transactions } = await supabase
    .from("finance_transactions")
    .select("*, programs(title)")
    .order("transaction_date", { ascending: false });

  const { data: programs } = await supabase
    .from("programs")
    .select("id, title")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Transaksi Keuangan</h1>
        <p className="text-gray-600 mt-1">Kelola data pemasukan dan pengeluaran organisasi.</p>
      </div>

      <TransaksiClient transactions={transactions || []} programs={programs || []} />
    </div>
  );
}
