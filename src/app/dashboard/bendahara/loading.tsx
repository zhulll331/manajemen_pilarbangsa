export default function BendaharaLoading() {
  return (
    <div className="space-y-6 animate-pulse w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-60 bg-gray-200 rounded-xl"></div>
          <div className="h-4 w-64 bg-gray-100 rounded-md"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-36 bg-gray-200 rounded-xl"></div>
          <div className="h-10 w-36 bg-gray-200 rounded-xl"></div>
        </div>
      </div>

      {/* Financial Stat Cards (Total Saldo, Pemasukan, Pengeluaran) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-10 w-10 bg-amber-50 rounded-xl"></div>
            </div>
            <div className="h-8 w-36 bg-gray-300 rounded-lg"></div>
            <div className="h-3 w-44 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>

      {/* Transactions & Chart area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="h-6 w-48 bg-gray-200 rounded"></div>
            <div className="h-8 w-28 bg-gray-100 rounded-lg"></div>
          </div>
          <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center">
            <div className="h-8 w-48 bg-gray-200 rounded-lg"></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="h-6 w-36 bg-gray-200 rounded pb-2"></div>
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="space-y-1.5">
                  <div className="h-4 w-28 bg-gray-200 rounded"></div>
                  <div className="h-3 w-20 bg-gray-100 rounded"></div>
                </div>
                <div className="h-5 w-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
