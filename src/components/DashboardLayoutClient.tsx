"use client";

import { useState, Suspense } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { UploadQueueProvider } from "@/context/UploadQueueContext";
import { UploadQueueWidget } from "./UploadQueueWidget";

function DashboardMainSkeleton() {
  return (
    <div className="space-y-6 animate-pulse w-full">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded-lg"></div>
          <div className="h-4 w-72 bg-gray-100 rounded-md"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-xl"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
              <div className="h-8 w-8 bg-gray-100 rounded-full"></div>
            </div>
            <div className="h-7 w-28 bg-gray-200 rounded"></div>
            <div className="h-3 w-36 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>

      {/* Content Area Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="h-6 w-36 bg-gray-200 rounded"></div>
          <div className="h-8 w-24 bg-gray-100 rounded-lg"></div>
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-100 rounded-xl"></div>
                <div className="space-y-1.5">
                  <div className="h-4 w-40 bg-gray-200 rounded"></div>
                  <div className="h-3 w-24 bg-gray-100 rounded"></div>
                </div>
              </div>
              <div className="h-6 w-16 bg-gray-100 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardLayoutClient({
  children,
  role,
  name,
}: {
  children: React.ReactNode;
  role: string;
  name: string;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <UploadQueueProvider>
      <div className="flex min-h-screen bg-[var(--color-background)] overflow-hidden">
        <Sidebar role={role} isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
          <Header 
            role={role} 
            name={name} 
            onMenuClick={() => setSidebarOpen(true)} 
          />
          <main className="flex-1 p-4 md:p-8">
            <Suspense fallback={<DashboardMainSkeleton />}>
              {children}
            </Suspense>
          </main>
        </div>
      </div>
      <UploadQueueWidget />
    </UploadQueueProvider>
  );
}
