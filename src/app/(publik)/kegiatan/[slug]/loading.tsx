export default function KegiatanDetailLoading() {
  return (
    <div className="space-y-8 py-6 animate-pulse w-full max-w-4xl mx-auto px-4 sm:px-6">
      {/* Breadcrumb Skeleton */}
      <div className="h-4 w-48 bg-gray-200 rounded"></div>

      {/* Hero Banner Skeleton */}
      <div className="h-64 sm:h-80 w-full bg-gray-200 rounded-3xl"></div>

      {/* Title & Metadata Skeleton */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
          <div className="h-6 w-28 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-10 w-3/4 bg-gray-200 rounded-xl"></div>
        <div className="h-5 w-full bg-gray-100 rounded"></div>
        <div className="h-5 w-2/3 bg-gray-100 rounded"></div>
      </div>

      {/* Content items Skeleton */}
      <div className="space-y-4 pt-6">
        <div className="h-8 w-40 bg-gray-200 rounded"></div>
        <div className="h-24 w-full bg-gray-100 rounded-2xl"></div>
        <div className="h-32 w-full bg-gray-100 rounded-2xl"></div>
      </div>
    </div>
  );
}
