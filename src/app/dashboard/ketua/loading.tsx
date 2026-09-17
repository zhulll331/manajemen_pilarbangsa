export default function KetuaLoading() {
  return (
    <div className="space-y-6 animate-pulse w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-gray-200 rounded-xl"></div>
          <div className="h-4 w-80 bg-gray-100 rounded-md"></div>
        </div>
        <div className="h-10 w-36 bg-gray-200 rounded-xl"></div>
      </div>

      {/* High-level KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-9 w-9 bg-purple-50 rounded-xl"></div>
            </div>
            <div className="h-7 w-20 bg-gray-300 rounded-lg"></div>
            <div className="h-3 w-32 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>

      {/* Two-column overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="h-6 w-44 bg-gray-200 rounded pb-2 border-b border-gray-100"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-xl space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                <div className="h-3 w-1/2 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="h-6 w-40 bg-gray-200 rounded pb-2 border-b border-gray-100"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-xl space-y-2">
                <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                <div className="h-3 w-1/3 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
