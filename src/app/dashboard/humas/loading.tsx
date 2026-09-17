export default function HumasLoading() {
  return (
    <div className="space-y-6 animate-pulse w-full">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-gray-200 rounded-xl"></div>
          <div className="h-4 w-80 bg-gray-100 rounded-md"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-28 bg-gray-200 rounded-xl"></div>
          <div className="h-10 w-36 bg-gray-200 rounded-xl"></div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-10 w-10 bg-blue-50 rounded-xl"></div>
            </div>
            <div className="h-8 w-20 bg-gray-300 rounded-lg"></div>
            <div className="h-3 w-40 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="h-6 w-44 bg-gray-200 rounded-md"></div>
          <div className="flex gap-2">
            <div className="h-9 w-48 bg-gray-100 rounded-lg"></div>
            <div className="h-9 w-24 bg-gray-100 rounded-lg"></div>
          </div>
        </div>

        {/* List items skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-gray-50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="h-14 w-14 bg-gray-200 rounded-xl shrink-0"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-3/5 bg-gray-200 rounded"></div>
                  <div className="h-3 w-2/5 bg-gray-100 rounded"></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-7 w-20 bg-gray-100 rounded-full"></div>
                <div className="h-8 w-8 bg-gray-100 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
