export default function SekretarisLoading() {
  return (
    <div className="space-y-6 animate-pulse w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-60 bg-gray-200 rounded-xl"></div>
          <div className="h-4 w-72 bg-gray-100 rounded-md"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-32 bg-gray-200 rounded-xl"></div>
          <div className="h-10 w-32 bg-gray-200 rounded-xl"></div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
              <div className="h-9 w-9 bg-emerald-50 rounded-xl"></div>
            </div>
            <div className="h-7 w-16 bg-gray-300 rounded-lg"></div>
            <div className="h-3 w-28 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="h-6 w-40 bg-gray-200 rounded-md"></div>
          <div className="flex gap-2">
            <div className="h-9 w-52 bg-gray-100 rounded-lg"></div>
            <div className="h-9 w-24 bg-gray-100 rounded-lg"></div>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                <div className="h-3 w-1/4 bg-gray-100 rounded"></div>
              </div>
              <div className="h-6 w-24 bg-gray-100 rounded-full"></div>
              <div className="h-8 w-16 bg-gray-100 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
