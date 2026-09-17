export default function ProfilLoading() {
  return (
    <div className="space-y-6 animate-pulse w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-gray-200 rounded-xl"></div>
        <div className="h-4 w-64 bg-gray-100 rounded-md"></div>
      </div>

      {/* Profile Card Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 pb-6 border-b border-gray-100">
          <div className="h-24 w-24 bg-gray-200 rounded-full shrink-0"></div>
          <div className="space-y-2.5 flex-1">
            <div className="h-6 w-48 bg-gray-200 rounded-lg"></div>
            <div className="h-4 w-36 bg-gray-100 rounded-md"></div>
            <div className="h-6 w-24 bg-blue-50 rounded-full"></div>
          </div>
        </div>

        {/* Form fields skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-11 w-full bg-gray-50 rounded-xl border border-gray-100"></div>
            </div>
          ))}
        </div>

        {/* Action Button Skeleton */}
        <div className="pt-4 flex justify-end">
          <div className="h-11 w-32 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}
