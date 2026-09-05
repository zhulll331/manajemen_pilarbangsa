'use client'

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react'
import { uploadFileToDrive } from '@/utils/driveClientUpload'
import { updateRecordFileUrl } from '@/app/actions/updateFileUrl'

export type UploadStatus = 'pending' | 'uploading' | 'done' | 'error'

export interface UploadJob {
  id: string
  title: string
  fileName: string
  fileSize: number
  progress: number
  status: UploadStatus
  error?: string
  resultUrl?: string
  recordId?: string
  tableName?: string
  fieldName?: string
  append?: boolean
  folderName?: string
  parentFolderName?: string
  folderId?: string
  createdAt: number
}

export interface EnqueueUploadOptions {
  file: File
  title?: string
  recordId?: string
  tableName?: string
  fieldName?: string
  folderName?: string
  parentFolderName?: string
  folderId?: string
  append?: boolean
  additionalFields?: Record<string, any>
  onSuccess?: (url: string) => void
  onError?: (err: Error) => void
}

interface UploadQueueContextType {
  jobs: UploadJob[]
  activeCount: number
  enqueueUpload: (options: EnqueueUploadOptions) => string
  getJobByRecordId: (recordId: string, fieldName?: string) => UploadJob | undefined
  isUploading: (recordId: string, fieldName?: string) => boolean
  clearFinishedJobs: () => void
  retryJob: (jobId: string) => void
  cancelJob: (jobId: string) => void
}

const UploadQueueContext = createContext<UploadQueueContextType | null>(null)

export function UploadQueueProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<UploadJob[]>([])
  const jobOptionsRef = useRef<Map<string, EnqueueUploadOptions>>(new Map())
  const processingRef = useRef<Set<string>>(new Set())

  // Deteksi jika masih ada upload aktif untuk mencegah penutupan tab tidak sengaja
  useEffect(() => {
    const hasActive = jobs.some(j => j.status === 'pending' || j.status === 'uploading')
    if (!hasActive) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'Upload berkas sedang berlangsung di latar belakang. Jika ditutup, berkas tidak akan tersimpan.'
      return e.returnValue
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [jobs])

  // Queue runner worker
  const processNextJobs = useCallback(async () => {
    // Maksimal 2 proses upload sekaligus untuk menjaga kestabilan bandwidth & Google Drive
    const MAX_CONCURRENT = 2
    if (processingRef.current.size >= MAX_CONCURRENT) return

    setJobs((prevJobs) => {
      const pendingJobs = prevJobs.filter(
        j => j.status === 'pending' && !processingRef.current.has(j.id)
      )

      const slotsAvailable = MAX_CONCURRENT - processingRef.current.size
      const jobsToStart = pendingJobs.slice(0, slotsAvailable)

      jobsToStart.forEach(job => {
        processingRef.current.add(job.id)
        // Jalankan worker secara async
        runUploadJob(job.id)
      })

      if (jobsToStart.length === 0) return prevJobs

      return prevJobs.map(j => {
        if (jobsToStart.some(s => s.id === j.id)) {
          return { ...j, status: 'uploading' as UploadStatus }
        }
        return j
      })
    })
  }, [])

  useEffect(() => {
    processNextJobs()
  }, [jobs, processNextJobs])

  const runUploadJob = async (jobId: string) => {
    const options = jobOptionsRef.current.get(jobId)
    if (!options) {
      processingRef.current.delete(jobId)
      return
    }

    try {
      let folderId = options.folderId

      // 1. Buat / Dapatkan folder Google Drive jika belum ada folderId
      if (!folderId && options.folderName) {
        const folderRes = await fetch('/api/drive/create-folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            folderName: options.folderName,
            parentFolderName: options.parentFolderName || 'Umum',
          }),
        })
        const folderData = await folderRes.json()
        if (folderData.folderId) {
          folderId = folderData.folderId
        }
      }

      // 2. Upload file ke Google Drive dengan pelacak progres
      const uploadRes = await uploadFileToDrive(
        options.file,
        folderId,
        (percent) => {
          setJobs(prev =>
            prev.map(j => j.id === jobId ? { ...j, progress: percent } : j)
          )
        }
      )

      const finalUrl = uploadRes.url

      // 3. Update data di database jika terhubung ke record tertentu
      if (options.recordId && options.tableName && options.fieldName) {
        await updateRecordFileUrl({
          table: options.tableName,
          id: options.recordId,
          field: options.fieldName,
          url: finalUrl,
          append: options.append,
          additionalFields: options.additionalFields,
        })
      }

      // 4. Update status job menjadi 'done'
      setJobs(prev =>
        prev.map(j =>
          j.id === jobId
            ? { ...j, status: 'done', progress: 100, resultUrl: finalUrl }
            : j
        )
      )

      // Broadcast event kustom agar komponen UI yang menampilkan data bisa auto-refresh
      window.dispatchEvent(
        new CustomEvent('upload-queue-finished', {
          detail: {
            jobId,
            recordId: options.recordId,
            tableName: options.tableName,
            fieldName: options.fieldName,
            url: finalUrl,
          },
        })
      )

      if (options.onSuccess) {
        options.onSuccess(finalUrl)
      }
    } catch (err: any) {
      console.error('Background upload error:', err)
      const errorMsg = err?.message || 'Gagal mengunggah berkas'
      setJobs(prev =>
        prev.map(j =>
          j.id === jobId
            ? { ...j, status: 'error', error: errorMsg }
            : j
        )
      )
      if (options.onError) {
        options.onError(err)
      }
    } finally {
      processingRef.current.delete(jobId)
      // Jalankan job berikutnya jika ada
      processNextJobs()
    }
  }

  const enqueueUpload = useCallback((options: EnqueueUploadOptions): string => {
    const id = 'job_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
    jobOptionsRef.current.set(id, options)

    const newJob: UploadJob = {
      id,
      title: options.title || options.file.name,
      fileName: options.file.name,
      fileSize: options.file.size,
      progress: 0,
      status: 'pending',
      recordId: options.recordId,
      tableName: options.tableName,
      fieldName: options.fieldName,
      append: options.append,
      folderName: options.folderName,
      parentFolderName: options.parentFolderName,
      folderId: options.folderId,
      createdAt: Date.now(),
    }

    setJobs(prev => [...prev, newJob])
    return id
  }, [])

  const getJobByRecordId = useCallback((recordId: string, fieldName?: string): UploadJob | undefined => {
    return jobs
      .slice()
      .reverse()
      .find(j => j.recordId === recordId && (!fieldName || j.fieldName === fieldName))
  }, [jobs])

  const isUploading = useCallback((recordId: string, fieldName?: string): boolean => {
    const job = getJobByRecordId(recordId, fieldName)
    return !!job && (job.status === 'pending' || job.status === 'uploading')
  }, [getJobByRecordId])

  const clearFinishedJobs = useCallback(() => {
    setJobs(prev => {
      const remaining = prev.filter(j => j.status === 'pending' || j.status === 'uploading')
      // Bersihkan options ref untuk job yang dihapus
      const remainingIds = new Set(remaining.map(r => r.id))
      for (const key of jobOptionsRef.current.keys()) {
        if (!remainingIds.has(key)) {
          jobOptionsRef.current.delete(key)
        }
      }
      return remaining
    })
  }, [])

  const retryJob = useCallback((jobId: string) => {
    setJobs(prev =>
      prev.map(j =>
        j.id === jobId
          ? { ...j, status: 'pending', progress: 0, error: undefined }
          : j
      )
    )
  }, [])

  const cancelJob = useCallback((jobId: string) => {
    processingRef.current.delete(jobId)
    jobOptionsRef.current.delete(jobId)
    setJobs(prev => prev.filter(j => j.id !== jobId))
  }, [])

  const activeCount = jobs.filter(j => j.status === 'pending' || j.status === 'uploading').length

  return (
    <UploadQueueContext.Provider
      value={{
        jobs,
        activeCount,
        enqueueUpload,
        getJobByRecordId,
        isUploading,
        clearFinishedJobs,
        retryJob,
        cancelJob,
      }}
    >
      {children}
    </UploadQueueContext.Provider>
  )
}

export function useUploadQueue() {
  const context = useContext(UploadQueueContext)
  if (!context) {
    throw new Error('useUploadQueue must be used within an UploadQueueProvider')
  }
  return context
}
