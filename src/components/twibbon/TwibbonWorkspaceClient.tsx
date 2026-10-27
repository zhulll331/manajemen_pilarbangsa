"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import type { TwibbonPublicCampaignDetail, TwibbonTransformState } from '@/types/twibbon';
import {
  TWIBBON_LOGICAL_HEIGHT,
  TWIBBON_LOGICAL_WIDTH,
  TWIBBON_MAX_ZOOM,
  TWIBBON_MIN_ZOOM,
  createInitialTransform,
  cssDeltaToLogicalDelta,
  panTransform,
  rotateTransform90,
  zoomTransform,
} from '@/lib/twibbon/transform';
import {
  extractCaptionTokens,
  renderParticipantCaption,
} from '@/lib/twibbon/caption';
import { formatEventScheduleRangeWib } from '@/utils/eventDate';
import {
  type NormalizedParticipantPhoto,
  createSampleDiklatFrameCanvas,
  decodeAndNormalizeParticipantPhoto,
  exportTwibbonPngBlob,
  loadOriginCleanFrameImage,
  renderTwibbonComposite,
} from '@/lib/twibbon/renderer';
import {
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  RefreshCw,
  Download,
  Share2,
  Copy,
  Check,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Calendar,
  MapPin,
  ShieldCheck,
  ExternalLink,
  Image as ImageIcon,
  Edit3,
  Archive,
  Eye,
  X,
  Info,
} from 'lucide-react';

interface Props {
  campaign: TwibbonPublicCampaignDetail;
  isPreviewMode?: boolean;
}

const PAN_STEP_LOGICAL = 36; // Langkah tombol arah dalam ruang koordinat 1080x1080

export default function TwibbonWorkspaceClient({ campaign, isPreviewMode = false }: Props) {
  const isArchived = campaign.state === 'archived' || !campaign.can_generate;

  // Frame state
  const [frameSource, setFrameSource] = useState<CanvasImageSource | null>(null);
  const [frameLoading, setFrameLoading] = useState<boolean>(true);
  const [frameError, setFrameError] = useState<string | null>(null);

  // Participant photo state (in-memory only, never persisted to storage/network)
  const [photoData, setPhotoData] = useState<NormalizedParticipantPhoto | null>(null);
  const [isDecodingPhoto, setIsDecodingPhoto] = useState<boolean>(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoWarning, setPhotoWarning] = useState<string | null>(null);

  // Transform state in logical 1080x1080 coordinates
  const [transform, setTransform] = useState<TwibbonTransformState>(createInitialTransform);

  // Step & Export state ('edit' | 'result')
  const [step, setStep] = useState<'edit' | 'result'>('edit');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultObjectUrl, setResultObjectUrl] = useState<string | null>(null);
  const [hasDownloadedOnce, setHasDownloadedOnce] = useState<boolean>(false);
  const [downloadHintMessage, setDownloadHintMessage] = useState<string | null>(null);
  const [showImageFallbackModal, setShowImageFallbackModal] = useState<boolean>(false);
  const [canShareFiles, setCanShareFiles] = useState<boolean>(false);

  // Local caption personalization state (never sent to backend/URL)
  const captionTokens = useMemo(
    () => extractCaptionTokens(campaign.caption_template),
    [campaign.caption_template]
  );
  const [tokenValues, setTokenValues] = useState<Record<string, string>>({});
  const [captionCopied, setCaptionCopied] = useState<boolean>(false);
  const [captionCopyFallbackMessage, setCaptionCopyFallbackMessage] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const captionTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const activePhotoRef = useRef<NormalizedParticipantPhoto | null>(null);
  const activeResultUrlRef = useRef<string | null>(null);

  // Pointer & Pinch gesture tracking refs
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchInitialDistanceRef = useRef<number | null>(null);
  const pinchInitialZoomRef = useRef<number>(1);

  // Detect Web Share Level 2 file sharing capability
  useEffect(() => {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.canShare === 'function') {
        const testFile = new File([new Uint8Array([0])], 'twibbon.png', { type: 'image/png' });
        setCanShareFiles(navigator.canShare({ files: [testFile] }));
      }
    } catch {
      setCanShareFiles(false);
    }
  }, []);

  // Cleanup memory on unmount (T32)
  useEffect(() => {
    return () => {
      if (activePhotoRef.current) {
        activePhotoRef.current.dispose();
        activePhotoRef.current = null;
      }
      if (activeResultUrlRef.current) {
        URL.revokeObjectURL(activeResultUrlRef.current);
        activeResultUrlRef.current = null;
      }
    };
  }, []);

  // Load frame asset (supports synthetic builtin frame or remote URL with CORS check)
  const loadFrame = useCallback(async () => {
    setFrameLoading(true);
    setFrameError(null);

    try {
      if (
        !campaign.frame?.url ||
        campaign.frame.url === 'builtin:diklat-kepemimpinan-2026' ||
        campaign.frame.url.startsWith('builtin:')
      ) {
        const sampleCanvas = createSampleDiklatFrameCanvas();
        setFrameSource(sampleCanvas);
        setFrameLoading(false);
        return;
      }

      const img = await loadOriginCleanFrameImage(campaign.frame.url);
      setFrameSource(img);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Bingkai belum berhasil dimuat. Coba lagi.';
      setFrameError(msg);
      setFrameSource(null);
    } finally {
      setFrameLoading(false);
    }
  }, [campaign.frame?.url]);

  useEffect(() => {
    loadFrame();
  }, [loadFrame]);

  // Draw unified composite on preview canvas whenever photo, frame, or transform changes
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Preview dirender pada resolusi tajam 720x720 dengan model koordinat logis 1080x1080 yang sama
    const previewSize = 720;
    if (canvas.width !== previewSize || canvas.height !== previewSize) {
      canvas.width = previewSize;
      canvas.height = previewSize;
    }

    renderTwibbonComposite({
      ctx,
      photo: photoData ? photoData.canvas : null,
      photoWidth: photoData ? photoData.width : 0,
      photoHeight: photoData ? photoData.height : 0,
      frame: frameSource,
      transform,
      targetWidth: previewSize,
      targetHeight: previewSize,
    });
  }, [photoData, frameSource, transform, step]);

  // Open file picker without clearing existing photo (T10: cancel preserves old photo & transform)
  const handleTriggerFilePicker = () => {
    if (isArchived || isDecodingPhoto) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input value so picking the same file again triggers onChange
    e.target.value = '';

    // Jika pengguna membatalkan file picker, pertahankan foto dan transformasi sebelumnya tanpa pesan error (PRD 20, T10)
    if (!file) {
      return;
    }

    setIsDecodingPhoto(true);
    setPhotoError(null);
    setExportError(null);

    const decoded = await decodeAndNormalizeParticipantPhoto(file);

    setIsDecodingPhoto(false);

    if (!decoded.ok) {
      setPhotoError(
        decoded.validation.errorMessage ||
          'Foto belum bisa dibuka. Gunakan JPG, PNG, atau WebP.'
      );
      return;
    }

    // Bebaskan buffer foto sebelumnya (T32)
    if (activePhotoRef.current) {
      activePhotoRef.current.dispose();
    }
    activePhotoRef.current = decoded.data;
    setPhotoData(decoded.data);
    setPhotoWarning(decoded.data.warningMessage || null);
    setTransform(createInitialTransform());
    setStep('edit');
    setHasDownloadedOnce(false);
    setDownloadHintMessage(null);
  };

  // Transform control handlers
  const handlePanByLogical = useCallback(
    (dx: number, dy: number) => {
      if (!photoData) return;
      setTransform((prev) => panTransform(prev, dx, dy, photoData.width, photoData.height));
    },
    [photoData]
  );

  const handleZoomChange = useCallback(
    (nextZoom: number) => {
      if (!photoData) return;
      setTransform((prev) => zoomTransform(prev, nextZoom, photoData.width, photoData.height));
    },
    [photoData]
  );

  const handleRotate = useCallback(
    (dir: 'cw' | 'ccw') => {
      if (!photoData) return;
      setTransform((prev) => rotateTransform90(prev, dir, photoData.width, photoData.height));
    },
    [photoData]
  );

  const handleResetTransform = useCallback(() => {
    setTransform(createInitialTransform());
  }, []);

  // Pointer drag & two-finger pinch handlers on the editor surface
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!photoData || step !== 'edit') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      pinchInitialDistanceRef.current = Math.max(10, dist);
      pinchInitialZoomRef.current = transform.zoom;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!photoData || step !== 'edit') return;
    const prevPt = activePointersRef.current.get(e.pointerId);
    if (!prevPt) return;

    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const rect = e.currentTarget.getBoundingClientRect();

    if (activePointersRef.current.size === 1) {
      const deltaCssX = e.clientX - prevPt.x;
      const deltaCssY = e.clientY - prevPt.y;
      const { dx, dy } = cssDeltaToLogicalDelta(
        deltaCssX,
        deltaCssY,
        rect.width,
        rect.height,
        TWIBBON_LOGICAL_WIDTH,
        TWIBBON_LOGICAL_HEIGHT
      );
      handlePanByLogical(dx, dy);
    } else if (activePointersRef.current.size === 2 && pinchInitialDistanceRef.current) {
      const pts = Array.from(activePointersRef.current.values());
      const currentDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const scaleFactor = currentDist / pinchInitialDistanceRef.current;
      handleZoomChange(pinchInitialZoomRef.current * scaleFactor);
    }
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size < 2) {
      pinchInitialDistanceRef.current = null;
    }
  };

  // Keyboard accessibility on editor surface (PRD 8.3 & 18)
  const handleCanvasKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (!photoData || step !== 'edit') return;
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        handlePanByLogical(-PAN_STEP_LOGICAL, 0);
        break;
      case 'ArrowRight':
        e.preventDefault();
        handlePanByLogical(PAN_STEP_LOGICAL, 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        handlePanByLogical(0, -PAN_STEP_LOGICAL);
        break;
      case 'ArrowDown':
        e.preventDefault();
        handlePanByLogical(0, PAN_STEP_LOGICAL);
        break;
      case '+':
      case '=':
        e.preventDefault();
        handleZoomChange(transform.zoom + 0.15);
        break;
      case '-':
      case '_':
        e.preventDefault();
        handleZoomChange(transform.zoom - 0.15);
        break;
      default:
        break;
    }
  };

  // Generate 1080x1080 PNG Blob locally
  const handleGenerateTwibbon = async () => {
    if (!photoData || !frameSource || isExporting || frameError) return;

    setIsExporting(true);
    setExportError(null);
    setDownloadHintMessage(null);

    try {
      const blob = await exportTwibbonPngBlob({
        photo: photoData.canvas,
        photoWidth: photoData.width,
        photoHeight: photoData.height,
        frame: frameSource,
        transform,
      });

      const nextUrl = URL.createObjectURL(blob);
      if (activeResultUrlRef.current) {
        URL.revokeObjectURL(activeResultUrlRef.current);
      }
      activeResultUrlRef.current = nextUrl;

      setResultBlob(blob);
      setResultObjectUrl(nextUrl);
      setHasDownloadedOnce(false);
      setStep('result');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Twibbon belum berhasil dibuat. Coba lagi.';
      setExportError(msg);
    } finally {
      setIsExporting(false);
    }
  };

  // Trigger download reusing existing Blob (F10)
  const handleDownloadPng = () => {
    if (!resultObjectUrl || !resultBlob) return;

    const cleanSlug = (campaign.slug || 'pilar-bangsa').replace(/[^a-z0-9-_]/gi, '-');
    const fileName = `twibbon-${cleanSlug}-1080x1080.png`;

    try {
      const a = document.createElement('a');
      a.href = resultObjectUrl;
      a.download = fileName;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setHasDownloadedOnce(true);
      // Sesuai PRD Bagian 8.4: Jangan menulis "Sudah tersimpan di galeri"
      setDownloadHintMessage(
        'Unduhan dimulai. Jika belum terlihat, cek folder Unduhan atau buka pratinjau gambar.'
      );
    } catch {
      setShowImageFallbackModal(true);
      setDownloadHintMessage(
        'Buka pratinjau gambar, lalu gunakan pilihan simpan di browsermu.'
      );
    }
  };

  // Native file share from pre-built Blob (F13, T17)
  const handleSharePhotoFile = async () => {
    if (!resultBlob) return;
    const cleanSlug = (campaign.slug || 'pilar-bangsa').replace(/[^a-z0-9-_]/gi, '-');
    const file = new File([resultBlob], `twibbon-${cleanSlug}.png`, { type: 'image/png' });

    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: campaign.title,
        });
      }
    } catch (err: unknown) {
      // Membatalkan share sheet adalah pembatalan normal; hasil dan kontrol unduh tetap tersedia (PRD 11.7 & 20)
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
    }
  };

  // Computed local caption (PRD 11)
  const renderedCaption = useMemo(() => {
    return renderParticipantCaption({
      captionDefault: campaign.caption_default,
      captionTemplate: campaign.caption_template,
      values: tokenValues,
    });
  }, [campaign.caption_default, campaign.caption_template, tokenValues]);

  // Copy caption with fallback selection (F12, T17)
  const handleCopyCaption = async () => {
    setCaptionCopyFallbackMessage(null);
    const textToCopy = renderedCaption.text;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        setCaptionCopied(true);
        setTimeout(() => setCaptionCopied(false), 2500);
        return;
      }
    } catch {
      // Lanjut ke fallback seleksi manual
    }

    if (captionTextareaRef.current) {
      captionTextareaRef.current.focus();
      captionTextareaRef.current.select();
    }
    setCaptionCopyFallbackMessage(
      'Salin otomatis belum tersedia. Tekan dan tahan teks untuk menyalin.'
    );
  };

  // Copy campaign public link (PRD 11.2)
  const handleCopyCampaignLink = async () => {
    const publicUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/twibbon/${campaign.slug}`
        : `https://www.pilarbangsa.my.id/twibbon/${campaign.slug}`;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(publicUrl);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2500);
      }
    } catch {
      // ignore
    }
  };

  const getWhatsAppShareLink = () => {
    const publicUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/twibbon/${campaign.slug}`
        : `https://www.pilarbangsa.my.id/twibbon/${campaign.slug}`;
    const text = `Yuk pasang Twibbon resmi "${campaign.title}" UKM Pilar Bangsa di sini: ${publicUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return (
    <div
      className="space-y-6 sm:space-y-8"
      data-private="true"
      data-sentry-mask="true"
      data-rrweb-mask="true"
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="sr-only"
        aria-label="Pilih foto dari perangkat"
      />

      {/* Preview Mode Banner for Admin */}
      {isPreviewMode && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
          <div className="flex items-center gap-2">
            <Eye size={18} className="text-amber-700 shrink-0" />
            <span>
              Mode Pratinjau Pengelola (Privat • No-Store). Pengunjung umum hanya melihat versi Terbit terakhir.
            </span>
          </div>
          <Link
            href={`/dashboard/humas/twibbon/${campaign.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-900 text-white text-xs font-bold hover:bg-amber-800 transition-colors"
          >
            <Edit3 size={13} />
            <span>Kembali ke Editor Admin</span>
          </Link>
        </div>
      )}

      {/* Live region for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isDecodingPhoto && 'Memproses foto di perangkatmu...'}
        {isExporting && 'Menyiapkan twibbon…'}
        {step === 'result' && 'Twibbon 1080 kali 1080 piksel siap diunduh.'}
        {downloadHintMessage}
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
        {/* LEFT COLUMN: Canvas Preview / Editor / Result Image */}
        <div className="lg:col-span-6 xl:col-span-6 space-y-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-4 sm:p-6 space-y-4">
            {/* Step Progress Pill Header */}
            {!isArchived && (
              <div className="flex items-center justify-between gap-2 text-xs font-bold">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span
                    className={`px-2.5 py-1 rounded-full ${
                      !photoData
                        ? 'bg-[#E31837] text-white'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    1. Pilih Foto
                  </span>
                  <span className="text-gray-300">→</span>
                  <span
                    className={`px-2.5 py-1 rounded-full ${
                      photoData && step === 'edit'
                        ? 'bg-[#E31837] text-white'
                        : step === 'result'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    2. Sesuaikan
                  </span>
                  <span className="text-gray-300">→</span>
                  <span
                    className={`px-2.5 py-1 rounded-full ${
                      step === 'result'
                        ? 'bg-[#E31837] text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    3. Unduh & Bagikan
                  </span>
                </div>

                <span className="text-[11px] font-mono text-gray-400 shrink-0">1080 × 1080</span>
              </div>
            )}

            {/* Surface Area: Result Image OR Interactive Canvas */}
            <div className="relative w-full aspect-square max-w-[520px] mx-auto rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-inner select-none">
              {step === 'result' && resultObjectUrl ? (
                <img
                  src={resultObjectUrl}
                  alt={`Hasil ${campaign.title}`}
                  className="w-full h-full object-contain bg-white"
                  data-private="true"
                />
              ) : (
                <canvas
                  ref={previewCanvasRef}
                  tabIndex={photoData && !isArchived ? 0 : -1}
                  aria-label="Area pengaturan posisi foto di belakang bingkai Twibbon. Gunakan geser atau tombol panah untuk mengatur posisi."
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUpOrCancel}
                  onPointerCancel={handlePointerUpOrCancel}
                  onKeyDown={handleCanvasKeyDown}
                  style={{
                    // Pembatasan touch-action hanya berlaku pada permukaan editor saat ada foto aktif (PRD 8.3)
                    touchAction: photoData && step === 'edit' && !isArchived ? 'none' : 'pan-y',
                  }}
                  className={`w-full h-full block bg-white focus:outline-none focus:ring-4 focus:ring-[#E31837]/40 ${
                    photoData && step === 'edit' && !isArchived
                      ? 'cursor-grab active:cursor-grabbing'
                      : 'cursor-default'
                  }`}
                />
              )}

              {/* Loading Overlay for Frame or Photo Decode */}
              {(frameLoading || isDecodingPhoto || isExporting) && (
                <div className="absolute inset-0 bg-black/55 backdrop-blur-xs flex flex-col items-center justify-center text-white p-6 text-center space-y-3">
                  <RefreshCw size={32} className="animate-spin text-[#FFD700]" />
                  <p className="text-sm sm:text-base font-bold">
                    {isExporting
                      ? 'Menyiapkan twibbon…'
                      : isDecodingPhoto
                      ? 'Membuka foto di perangkatmu…'
                      : 'Memuat bingkai resmi…'}
                  </p>
                </div>
              )}

              {/* Empty Photo Prompt Overlay (when not archived and no photo chosen yet) */}
              {!isArchived && !photoData && !frameLoading && !frameError && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex flex-col items-center justify-end p-5 sm:p-6 text-center">
                  <div className="bg-black/65 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 text-white max-w-xs space-y-2">
                    <p className="text-xs sm:text-sm font-semibold">
                      Pilih foto terbaikmu untuk ditempatkan di balik bingkai resmi ini.
                    </p>
                    <button
                      type="button"
                      onClick={handleTriggerFilePicker}
                      className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#E31837] hover:bg-red-700 text-white font-extrabold text-xs sm:text-sm shadow-lg transition-all"
                    >
                      <Upload size={16} />
                      <span>Pilih Foto</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Frame Load Failure Overlay (PRD 20, T19) */}
              {frameError && (
                <div className="absolute inset-0 bg-gray-900/90 flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
                  <AlertCircle size={36} className="text-red-400" />
                  <div className="space-y-1 max-w-xs">
                    <p className="font-bold text-base">Bingkai belum berhasil dimuat. Coba lagi.</p>
                    <p className="text-xs text-gray-300">{frameError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={loadFrame}
                    className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-gray-900 font-bold text-xs sm:text-sm hover:bg-gray-100 transition-colors"
                  >
                    <RefreshCw size={15} />
                    <span>Coba Lagi</span>
                  </button>
                </div>
              )}
            </div>

            {/* Alerts: Photo Error, Low Quality Warning, Export Error */}
            {photoError && (
              <div
                role="alert"
                className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-2.5 text-xs sm:text-sm font-medium"
              >
                <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">{photoError}</div>
                <button
                  type="button"
                  onClick={() => setPhotoError(null)}
                  className="text-red-500 hover:text-red-700 font-bold px-1"
                  aria-label="Tutup pesan kesalahan"
                >
                  ✕
                </button>
              </div>
            )}

            {photoWarning && step === 'edit' && (
              <div
                role="status"
                className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5 text-xs sm:text-sm font-medium"
              >
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">{photoWarning}</div>
              </div>
            )}

            {exportError && (
              <div
                role="alert"
                className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-2.5 text-xs sm:text-sm font-medium"
              >
                <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">{exportError}</div>
              </div>
            )}

            {/* EDITOR CONTROLS (Visible when photo is selected and in 'edit' step) */}
            {!isArchived && photoData && step === 'edit' && (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  Geser foto dengan jari/mouse, cubit untuk zoom, atau gunakan tombol di bawah ini:
                </p>

                {/* Zoom Slider & +/- Buttons (Touch targets >= 44x44) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                    <label htmlFor="twibbon-zoom-slider">Perbesar / Zoom Foto</label>
                    <span className="font-mono text-[#E31837]">{transform.zoom.toFixed(2)}×</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleZoomChange(transform.zoom - 0.15)}
                      disabled={transform.zoom <= TWIBBON_MIN_ZOOM}
                      aria-label="Perkecil foto"
                      className="min-w-[44px] min-h-[44px] rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center justify-center disabled:opacity-40 transition-colors"
                    >
                      <ZoomOut size={18} />
                    </button>

                    <input
                      id="twibbon-zoom-slider"
                      type="range"
                      min={TWIBBON_MIN_ZOOM}
                      max={TWIBBON_MAX_ZOOM}
                      step={0.02}
                      value={transform.zoom}
                      onChange={(e) => handleZoomChange( parseFloat(e.target.value) )}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#E31837]"
                    />

                    <button
                      type="button"
                      onClick={() => handleZoomChange(transform.zoom + 0.15)}
                      disabled={transform.zoom >= TWIBBON_MAX_ZOOM}
                      aria-label="Perbesar foto"
                      className="min-w-[44px] min-h-[44px] rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center justify-center disabled:opacity-40 transition-colors"
                    >
                      <ZoomIn size={18} />
                    </button>
                  </div>
                </div>

                {/* Directional Pad & Rotation 90° Controls */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 items-center">
                  {/* Rotate Left / Right */}
                  <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                    <button
                      type="button"
                      onClick={() => handleRotate('ccw')}
                      className="flex-1 min-h-[44px] px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      title="Putar Kiri 90 Derajat"
                    >
                      <RotateCcw size={16} />
                      <span>Putar Kiri</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRotate('cw')}
                      className="flex-1 min-h-[44px] px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      title="Putar Kanan 90 Derajat"
                    >
                      <RotateCw size={16} />
                      <span>Putar Kanan</span>
                    </button>
                  </div>

                  {/* Directional Nudge Buttons (Alternative to drag) */}
                  <div className="flex items-center justify-center gap-1.5 col-span-2 sm:col-span-1">
                    <button
                      type="button"
                      onClick={() => handlePanByLogical(-PAN_STEP_LOGICAL, 0)}
                      aria-label="Geser foto ke kiri"
                      className="min-w-[44px] min-h-[44px] rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center justify-center transition-colors"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePanByLogical(0, -PAN_STEP_LOGICAL)}
                      aria-label="Geser foto ke atas"
                      className="min-w-[44px] min-h-[44px] rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center justify-center transition-colors"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePanByLogical(0, PAN_STEP_LOGICAL)}
                      aria-label="Geser foto ke bawah"
                      className="min-w-[44px] min-h-[44px] rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center justify-center transition-colors"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePanByLogical(PAN_STEP_LOGICAL, 0)}
                      aria-label="Geser foto ke kanan"
                      className="min-w-[44px] min-h-[44px] rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center justify-center transition-colors"
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>

                  {/* Reset & Change Photo */}
                  <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                    <button
                      type="button"
                      onClick={handleResetTransform}
                      className="flex-1 min-h-[44px] px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RefreshCw size={15} />
                      <span>Atur Ulang</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleTriggerFilePicker}
                      className="flex-1 min-h-[44px] px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Upload size={15} />
                      <span>Ganti Foto</span>
                    </button>
                  </div>
                </div>

                {/* Primary Step 2 CTA: Buat Twibbon */}
                <button
                  type="button"
                  onClick={handleGenerateTwibbon}
                  disabled={isExporting || !!frameError || frameLoading}
                  className="w-full min-h-[50px] inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#E31837] hover:bg-red-700 text-white font-extrabold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Menyiapkan twibbon…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>Buat Twibbon (1080 × 1080)</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* RESULT ACTIONS (Visible in 'result' step - PRD 8.4) */}
            {!isArchived && step === 'result' && resultObjectUrl && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleDownloadPng}
                    className="w-full min-h-[50px] inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#008000] hover:bg-green-700 text-white font-extrabold text-sm sm:text-base shadow-lg transition-all"
                  >
                    <Download size={18} />
                    <span>{hasDownloadedOnce ? 'Unduh Lagi (PNG)' : 'Unduh PNG'}</span>
                  </button>

                  {canShareFiles ? (
                    <button
                      type="button"
                      onClick={handleSharePhotoFile}
                      className="w-full min-h-[50px] inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#E31837] hover:bg-red-700 text-white font-extrabold text-sm sm:text-base shadow-md transition-all"
                    >
                      <Share2 size={18} />
                      <span>Bagikan Foto</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowImageFallbackModal(true)}
                      className="w-full min-h-[50px] inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold text-xs sm:text-sm transition-all"
                    >
                      <ImageIcon size={17} />
                      <span>Buka Pratinjau Gambar</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('edit')}
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-colors"
                  >
                    <Edit3 size={15} />
                    <span>Edit Lagi Posisi Foto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowImageFallbackModal(true)}
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    <Eye size={15} />
                    <span>Bantuan Simpan Gambar</span>
                  </button>
                </div>

                {downloadHintMessage && (
                  <div
                    role="status"
                    className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-medium space-y-1"
                  >
                    <p>{downloadHintMessage}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Privacy Guarantee Card (PRD 16) */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-start gap-3 text-xs text-gray-600 leading-relaxed">
            <ShieldCheck size={18} className="text-[#008000] shrink-0 mt-0.5" />
            <div>
              <strong className="text-gray-900 font-bold">Privasi Terlindungi:</strong> Foto diproses di perangkatmu dan tidak diunggah oleh fitur ini. Setelah disimpan, kamu bisa membagikannya sendiri. Memuat ulang (refresh) halaman akan menghapus foto dari sesi ini.
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Campaign Info, 3-Step Guide, Caption Personalization, Share & Event Link */}
        <div className="lg:col-span-6 xl:col-span-6 space-y-6">
          {/* Header & Event Metadata Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              {isArchived ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200 uppercase tracking-wider">
                  <Archive size={13} /> Kampanye Diarsipkan
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-[#E31837] border border-red-100 uppercase tracking-wider">
                  <Sparkles size={13} /> Twibbon Resmi UKM Pilar Bangsa
                </span>
              )}
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                {campaign.title}
              </h1>
              {campaign.description && (
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  {campaign.description}
                </p>
              )}
            </div>

            {/* Event Date & Location */}
            {campaign.event && (campaign.event.starts_at || campaign.event.location) && (
              <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-gray-100 text-xs sm:text-sm text-gray-700">
                {campaign.event.starts_at && (
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-red-50 text-[#E31837]">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        Tanggal Kegiatan
                      </div>
                      <div className="font-bold text-gray-900">
                        {formatEventScheduleRangeWib(
                          campaign.event.starts_at,
                          campaign.event.ends_at
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {campaign.event.location && (
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-green-50 text-[#008000]">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        Lokasi
                      </div>
                      <div className="font-bold text-gray-900">{campaign.event.location}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Archived State Notice OR Primary Step 1 CTA */}
            {isArchived ? (
              <div className="p-4 rounded-2xl bg-gray-100 border border-gray-200 text-gray-700 text-sm font-semibold flex items-center gap-2.5">
                <Archive size={18} className="text-gray-500 shrink-0" />
                <span>Kampanye ini sudah diarsipkan. Pembuatan twibbon baru telah ditutup.</span>
              </div>
            ) : (
              !photoData && (
                <div className="pt-2 space-y-3">
                  <button
                    type="button"
                    onClick={handleTriggerFilePicker}
                    disabled={frameLoading || !!frameError}
                    className="w-full min-h-[50px] inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-[#E31837] hover:bg-red-700 text-white font-extrabold text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    <Upload size={20} />
                    <span>Pilih Foto dari Perangkat</span>
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    Mendukung foto JPG, PNG, atau WebP (maks. 15 MiB).
                  </p>
                </div>
              )
            )}
          </div>

          {/* Caption Personalization & Copy Card (PRD 11) */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-5">
            <div className="space-y-1">
              <h2 className="text-lg font-extrabold text-gray-900">
                Caption Resmi & Personalisasi Opsional
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                {captionTokens.length > 0
                  ? `Isi ${captionTokens.map((t) => t.label.toLowerCase()).join(', ')} jika ingin menyertakannya di caption. Kosongkan jika ingin memakai caption umum.`
                  : 'Salin teks caption resmi di bawah ini untuk dibagikan bersama foto Twibbon Anda.'}
              </p>
            </div>

            {captionTokens.length > 0 && (
              <div
                className={`grid grid-cols-1 ${
                  captionTokens.length === 1 ? 'sm:grid-cols-1' : 'sm:grid-cols-2'
                } gap-3`}
              >
                {captionTokens.map((tokenMeta) => (
                  <div key={tokenMeta.key}>
                    <label
                      htmlFor={`twibbon-input-${tokenMeta.key}`}
                      className="block text-xs font-bold text-gray-700 mb-1"
                    >
                      {tokenMeta.label}{' '}
                      <span className="text-gray-400 font-normal">(Opsional)</span>
                    </label>
                    <input
                      id={`twibbon-input-${tokenMeta.key}`}
                      type="text"
                      maxLength={tokenMeta.maxLength}
                      value={tokenValues[tokenMeta.key] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTokenValues((prev) => ({
                          ...prev,
                          [tokenMeta.key]: val,
                        }));
                      }}
                      placeholder={tokenMeta.placeholder}
                      autoComplete="off"
                      data-private="true"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#E31837] focus:ring-2 focus:ring-red-100 outline-none"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="twibbon-caption-output" className="font-bold text-gray-700">
                  Teks Caption Siap Salin (
                  {renderedCaption.variant === 'personal' ? 'Varian Personal' : 'Varian Umum'})
                </label>
                <span className="text-gray-400 font-mono">
                  {renderedCaption.text.length}/2000
                </span>
              </div>

              <textarea
                id="twibbon-caption-output"
                ref={captionTextareaRef}
                readOnly
                rows={5}
                value={renderedCaption.text}
                onClick={(e) => e.currentTarget.select()}
                data-private="true"
                className="w-full p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-800 text-xs sm:text-sm font-sans leading-relaxed resize-y focus:outline-none focus:border-[#E31837]"
              />

              <button
                type="button"
                onClick={handleCopyCaption}
                className={`w-full min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-xs ${
                  captionCopied
                    ? 'bg-[#008000] text-white'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                }`}
              >
                {captionCopied ? <Check size={16} /> : <Copy size={16} />}
                <span>{captionCopied ? 'Caption Berhasil Disalin!' : 'Salin Caption'}</span>
              </button>

              {captionCopyFallbackMessage && (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5 font-medium">
                  {captionCopyFallbackMessage}
                </p>
              )}

              <p className="text-[11px] text-gray-500 leading-relaxed">
                Petunjuk posting: Unduh PNG twibbon terlebih dahulu, salin caption di atas, lalu buka Instagram/WhatsApp dan tempelkan caption saat memposting foto.
              </p>
            </div>
          </div>

          {/* Share Campaign Link & Related Event Info Card (PRD 6 & 11) */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-gray-900">
                Bagikan Link Kampanye Twibbon
              </h3>
              <p className="text-xs text-gray-500">
                Ajak rekan peserta lain membuat twibbon melalui tautan halaman ini (tidak membagikan foto pribadimu).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopyCampaignLink}
                className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800 text-xs font-bold transition-colors"
              >
                {linkCopied ? <Check size={15} className="text-[#008000]" /> : <Copy size={15} />}
                <span>{linkCopied ? 'Link Kampanye Disalin!' : 'Salin Link Twibbon'}</span>
              </button>

              <a
                href={getWhatsAppShareLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#008000] hover:bg-green-700 text-white text-xs font-bold transition-colors"
              >
                <Share2 size={15} />
                <span>Bagikan Link ke WA</span>
              </a>
            </div>

            {campaign.event && (
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-blue-950 space-y-1 leading-relaxed">
                  <div className="font-bold flex items-center gap-1.5 text-blue-900">
                    <Info size={14} className="shrink-0" />
                    <span>Informasi Pendaftaran & Bukti Posting</span>
                  </div>
                  <p>
                    Mengunduh twibbon di halaman ini tidak otomatis mendaftarkanmu sebagai peserta. Silakan buka halaman kegiatan resmi untuk mengisi formulir pendaftaran, mengunggah bukti, dan bergabung ke grup WhatsApp peserta.
                  </p>
                </div>

                <Link
                  href={campaign.event.url}
                  className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border-2 border-[#E31837] text-[#E31837] hover:bg-red-50 font-extrabold text-xs sm:text-sm transition-colors"
                >
                  <span>Lihat Info dan Pendaftaran Kegiatan</span>
                  <ExternalLink size={15} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fallback Image Save Modal for Restricted Browsers / In-App Webviews (PRD 8.4, 18, 20, T18) */}
      {showImageFallbackModal && resultObjectUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau Gambar Twibbon untuk Simpan Manual"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[92vh]">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-extrabold text-gray-900 text-base sm:text-lg">
                Pratinjau Gambar (1080 × 1080 PNG)
              </h3>
              <button
                type="button"
                onClick={() => setShowImageFallbackModal(false)}
                className="min-w-[40px] min-h-[40px] rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center"
                aria-label="Tutup pratinjau"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Buka pratinjau gambar, lalu gunakan pilihan simpan di browsermu (pada HP: <strong>tekan dan tahan gambar di bawah</strong> lalu pilih <strong>Simpan Gambar / Download Image</strong>, atau buka halaman ini di Chrome/Safari jika kamu sedang memakai browser dalam aplikasi Instagram/WhatsApp).
            </p>

            <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
              <img
                src={resultObjectUrl}
                alt="Pratinjau Twibbon 1080x1080"
                className="w-full h-auto block"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <a
                href={resultObjectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold"
              >
                <ExternalLink size={14} />
                <span>Buka Gambar di Tab Baru</span>
              </a>
              <button
                type="button"
                onClick={() => setShowImageFallbackModal(false)}
                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

