'use client'

import React, { useState, useEffect } from 'react'
import { useUploadQueue, UploadJob } from '@/context/UploadQueueContext'
import { 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  X, 
  RotateCcw,
  FileText
} from 'lucide-react'

function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function UploadQueueWidget() {
  const { jobs, activeCount, clearFinishedJobs, retryJob, cancelJob } = useUploadQueue()
  const [isMinimized, setIsMinimized] = useState(false)
  const [autoDismissTimer, setAutoDismissTimer] = useState<NodeJS.Timeout | null>(null)

  // Otomatis bersihkan/tutup widget 8 detik setelah semua pekerjaan selesai tanpa error
  useEffect(() => {
    if (jobs.length > 0 && activeCount === 0) {
      const hasErrors = jobs.some(j => j.status === 'error')
      if (!hasErrors) {
        const timer = setTimeout(() => {
          clearFinishedJobs()
        }, 8000)
        return () => clearTimeout(timer)
      }
    }
  }, [jobs, activeCount, clearFinishedJobs])

  if (jobs.length === 0) return null

  const isAllDone = activeCount === 0 && jobs.every(j => j.status === 'done')
  const hasErrors = jobs.some(j => j.status === 'error')

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm sm:max-w-md w-full px-4 sm:px-0 transition-all duration-300 pointer-events-auto">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden text-gray-800 dark:text-gray-100 transition-all duration-200">
        
        {/* Header Widget */}
        <div 
          onClick={() => setIsMinimized(!isMinimized)}
          className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/80 dark:to-gray-900/80 cursor-pointer select-none border-b border-gray-200/60 dark:border-gray-800"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {activeCount > 0 ? (
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shrink-0">
                <UploadCloud size={18} className="animate-pulse" />
              </div>
            ) : isAllDone ? (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 size={18} />
              </div>
            ) : (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertCircle size={18} />
              </div>
            )}

            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-semibold truncate leading-tight">
                {activeCount > 0
                  ? `Mengunggah ${activeCount} Berkas...`
                  : isAllDone
                  ? 'Semua Berkas Terunggah'
                  : 'Proses Unggah Selesai'}
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                {activeCount > 0
                  ? 'Anda dapat melanjutkan aktivitas lain'
                  : `${jobs.filter(j => j.status === 'done').length} berhasil${hasErrors ? `, ${jobs.filter(j => j.status === 'error').length} gagal` : ''}`}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-200/60 dark:hover:bg-gray-800 transition"
              title={isMinimized ? 'Perluas' : 'Kecilkan'}
            >
              {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <button
              onClick={clearFinishedJobs}
              className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
              title="Tutup / Bersihkan"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body List (Visible when not minimized) */}
        {!isMinimized && (
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/60 p-1">
            {jobs.map((job) => (
              <div key={job.id} className="p-3 space-y-2 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition rounded-xl">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 mt-0.5 shrink-0">
                      <FileText size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate leading-snug">
                        {job.title || job.fileName}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {formatBytes(job.fileSize)}
                      </p>
                    </div>
                  </div>

                  {/* Status indicator / actions */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    {job.status === 'uploading' && (
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        {job.progress}%
                      </span>
                    )}
                    {job.status === 'pending' && (
                      <span className="flex items-center gap-1 text-[11px] text-amber-500 font-medium">
                        <Clock size={12} /> Menunggu
                      </span>
                    )}
                    {job.status === 'done' && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={12} /> Selesai
                      </span>
                    )}
                    {job.status === 'error' && (
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-red-500 font-semibold bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full" title={job.error}>
                          Gagal
                        </span>
                        <button
                          onClick={() => retryJob(job.id)}
                          className="p-1 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                          title="Coba lagi"
                        >
                          <RotateCcw size={13} />
                        </button>
                      </div>
                    )}
                    {job.status !== 'done' && (
                      <button
                        onClick={() => cancelJob(job.id)}
                        className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        title="Batal"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {job.status === 'uploading' && (
                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                )}
                {job.status === 'pending' && (
                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full w-1/3 rounded-full animate-pulse" />
                  </div>
                )}
                {job.status === 'error' && job.error && (
                  <p className="text-[10px] text-red-500 leading-tight truncate">
                    {job.error}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
