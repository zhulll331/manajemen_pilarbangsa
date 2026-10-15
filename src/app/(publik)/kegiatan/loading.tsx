export default function KegiatanLoading() {
  return (
    <div className="space-y-12 py-4 animate-pulse w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Top Header Banner Skeleton */}
      <div className="bg-black/5 rounded-3xl p-10 md:p-16 text-center space-y-4 border border-gray-100">
        <div className="h-6 w-36 bg-gray-200 rounded-full mx-auto"></div>
        <div className="h-10 sm:h-14 w-3/4 max-w-2xl bg-gray-200 rounded-2xl mx-auto"></div>
        <div className="h-4 sm:h-5 w-1/2 max-w-lg bg-gray-100 rounded-lg mx-auto"></div>
      </div>

      {/* Tabs & Search Bar Skeleton */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="h-11 w-full md:w-72 bg-gray-100 rounded-xl"></div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="h-11 w-32 bg-gray-100 rounded-xl"></div>
          <div className="h-11 w-32 bg-gray-100 rounded-xl"></div>
        </div>
      </div>

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col">
            <div className="h-48 w-full bg-gray-100 rounded-2xl"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 w-24 bg-gray-100 rounded-full"></div>
              <div className="h-6 w-3/4 bg-gray-200 rounded-lg"></div>
              <div className="h-4 w-full bg-gray-100 rounded"></div>
              <div className="h-4 w-2/3 bg-gray-100 rounded"></div>
            </div>
            <div className="h-11 w-full bg-gray-100 rounded-xl mt-4"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
