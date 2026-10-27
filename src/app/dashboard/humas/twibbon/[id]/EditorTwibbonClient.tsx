"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type {
  TwibbonCampaignRow,
  TwibbonRevisionRow,
  TwibbonAuditLogRow,
} from '@/types/twibbon';
import type { PublicEvent, PublicEventResource } from '@/types/events';
import {
  normalizeEventTimestamps,
  formatEventDateWib,
} from '@/utils/eventDate';
import {
  normalizeCampaignSlug,
  validateAdminFrameHeader,
  analyzeFrameRgbaPixels,
} from '@/lib/twibbon/validation';
import {
  validateCaptionTemplates,
  renderParticipantCaption,
  extractCaptionTokens,
  detectSquareBracketPlaceholders,
  normalizeTokenKey,
  QUICK_CAPTION_TOKEN_PRESETS,
  DEFAULT_DIKLAT_2026_CAMPAIGN,
} from '@/lib/twibbon/caption';
import {
  createSampleDiklatFrameCanvas,
  createSampleParticipantSimulationCanvas,
  renderTwibbonComposite,
} from '@/lib/twibbon/renderer';
import { createInitialTransform } from '@/lib/twibbon/transform';
import {
  ArrowLeft,
  Save,
  Send,
  Archive,
  RotateCcw,
  Eye,
  Upload,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  MapPin,
  Lock,
  Sparkles,
  FileText,
  History,
  Link2,
  RefreshCw,
  Download,
  Plus,
  X,
} from 'lucide-react';

interface EditorTwibbonClientProps {
  initialCampaign: TwibbonCampaignRow | null;
  initialRevisions: TwibbonRevisionRow[];
  initialAuditLogs: TwibbonAuditLogRow[];
  events: PublicEvent[];
  initialDraftFrameSignedUrl: string | null;
  isNew?: boolean;
}

export default function EditorTwibbonClient({
  initialCampaign,
  initialRevisions,
  initialAuditLogs,
  events,
  initialDraftFrameSignedUrl,
  isNew = false,
}: EditorTwibbonClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [campaign, setCampaign] = useState<TwibbonCampaignRow | null>(initialCampaign);
  const [revisions, setRevisions] = useState<TwibbonRevisionRow[]>(initialRevisions);
  const [auditLogs] = useState<TwibbonAuditLogRow[]>(initialAuditLogs);

  // Form states
  const [title, setTitle] = useState<string>(
    initialCampaign?.draft_payload?.title || ''
  );
  const [slug, setSlug] = useState<string>(initialCampaign?.slug || '');
  const [slugTouched, setSlugTouched] = useState<boolean>(Boolean(initialCampaign?.slug));
  const [description, setDescription] = useState<string>(
    initialCampaign?.draft_payload?.description || ''
  );
  const [relatedEventId, setRelatedEventId] = useState<string>(
    initialCampaign?.event_id || initialCampaign?.draft_payload?.related_event_id || ''
  );
  const [captionDefault, setCaptionDefault] = useState<string>(
    initialCampaign?.draft_payload?.caption_default || ''
  );
  const [captionTemplate, setCaptionTemplate] = useState<string>(
    initialCampaign?.draft_payload?.caption_template || ''
  );

  // Preview frame & simulation states
  const [framePreviewUrl, setFramePreviewUrl] = useState<string | null>(
    initialDraftFrameSignedUrl
  );
  const [frameTransparencyPercent, setFrameTransparencyPercent] = useState<number | null>(
    null
  );
  const [frameWarning, setFrameWarning] = useState<string | null>(null);
  const [showSamplePhotoSim, setShowSamplePhotoSim] = useState<boolean>(false);

  // Caption flexible token management & dual-variant preview simulation
  const [customTokenInput, setCustomTokenInput] = useState<string>('');
  const [simValues, setSimValues] = useState<Record<string, string>>({
    nama: 'Budi Santoso',
    fakultas: 'Fakultas Teknik',
    prodi: 'Teknik Informatika',
    asal_sekolah: 'SMAN 1 Banyuwangi',
    kelas: 'XII MIPA 1',
  });
  const captionTemplateTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Event resource integration state
  const [eventTwibbonResource, setEventTwibbonResource] =
    useState<PublicEventResource | null>(null);
  const [isUpdatingEventResource, setIsUpdatingEventResource] = useState<boolean>(false);

  // Action states
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingAsset, setIsUploadingAsset] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isArchiving, setIsArchiving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const adminPreviewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedEvent = useMemo(() => {
    if (!relatedEventId) return null;
    const found = events.find((e) => e.id === relatedEventId) || null;
    return found ? normalizeEventTimestamps(found) : null;
  }, [events, relatedEventId]);

  // Auto-generate slug from title if not touched and not locked
  useEffect(() => {
    if (!slugTouched && !campaign?.slug_locked && title.trim()) {
      setSlug(normalizeCampaignSlug(title));
    }
  }, [title, slugTouched, campaign?.slug_locked]);

  // Load linked event's Twibbon resource item when relatedEventId changes
  useEffect(() => {
    if (!relatedEventId) {
      setEventTwibbonResource(null);
      return;
    }

    let cancelled = false;
    const loadResource = async () => {
      const { data } = await supabase
        .from('public_event_resources')
        .select('*')
        .eq('event_id', relatedEventId)
        .eq('item_type', 'link')
        .order('sort_order', { ascending: true });

      if (cancelled || !data) return;
      const twibbonRes = (data as PublicEventResource[]).find(
        (r) =>
          r.title.toLowerCase().includes('twibbon') ||
          (r.url && r.url.toLowerCase().includes('twibbon')) ||
          (r.url && r.url.toLowerCase().includes('twb.nz'))
      );
      setEventTwibbonResource(twibbonRes || null);
    };

    loadResource();
    return () => {
      cancelled = true;
    };
  }, [relatedEventId, supabase]);

  // Render Admin Checkerboard / Simulation Canvas
  useEffect(() => {
    const canvas = adminPreviewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 540;
    canvas.height = 540;

    // Draw checkerboard background (Admin-only transparency inspection per PRD 12.2)
    const tileSize = 18;
    for (let y = 0; y < 540; y += tileSize) {
      for (let x = 0; x < 540; x += tileSize) {
        const isDark = ((x / tileSize) + (y / tileSize)) % 2 === 1;
        ctx.fillStyle = isDark ? '#E5E7EB' : '#FFFFFF';
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }

    const drawOverlay = (frameSource: CanvasImageSource) => {
      if (showSamplePhotoSim) {
        const simPhoto = createSampleParticipantSimulationCanvas();
        const offscreen = document.createElement('canvas');
        offscreen.width = 1080;
        offscreen.height = 1080;
        const offCtx = offscreen.getContext('2d');
        if (offCtx) {
          renderTwibbonComposite({
            ctx: offCtx,
            photo: simPhoto,
            photoWidth: simPhoto.width,
            photoHeight: simPhoto.height,
            frame: frameSource,
            transform: createInitialTransform(),
            targetWidth: 1080,
            targetHeight: 1080,
          });
          ctx.drawImage(offscreen, 0, 0, 540, 540);
          return;
        }
      }
      ctx.drawImage(frameSource, 0, 0, 540, 540);
    };

    if (!framePreviewUrl) {
      ctx.fillStyle = 'rgba(17, 24, 39, 0.72)';
      ctx.fillRect(40, 220, 460, 100);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Belum ada file PNG 1080×1080 diunggah', 270, 265);
      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#D1D5DB';
      ctx.fillText('Unggah PNG transparan atau muat bingkai contoh resmi di bawah', 270, 292);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      drawOverlay(img);
    };
    img.src = framePreviewUrl;
  }, [framePreviewUrl, showSamplePhotoSim]);

  // Caption live validation, active tokens, bracket converter & dual preview
  const activeCaptionTokens = useMemo(
    () => extractCaptionTokens(captionTemplate),
    [captionTemplate]
  );

  const bracketSuggestions = useMemo(
    () => detectSquareBracketPlaceholders(captionTemplate),
    [captionTemplate]
  );

  const captionValidation = useMemo(() => {
    return validateCaptionTemplates(captionDefault, captionTemplate || '');
  }, [captionDefault, captionTemplate]);

  const effectiveSimValues = useMemo(() => {
    const merged: Record<string, string> = {};
    for (const tokenMeta of activeCaptionTokens) {
      merged[tokenMeta.key] = simValues[tokenMeta.key] ?? tokenMeta.sampleValue;
    }
    return merged;
  }, [activeCaptionTokens, simValues]);

  const previewPersonalOutput = useMemo(() => {
    return renderParticipantCaption({
      captionDefault,
      captionTemplate: captionTemplate || '',
      values: effectiveSimValues,
    });
  }, [captionDefault, captionTemplate, effectiveSimValues]);

  const previewDefaultOutput = useMemo(() => {
    return renderParticipantCaption({
      captionDefault,
      captionTemplate: captionTemplate || '',
      values: {},
    });
  }, [captionDefault, captionTemplate]);

  // Insert a {{token}} at cursor position (or end of captionTemplate)
  const handleInsertToken = (rawKey: string) => {
    const key = normalizeTokenKey(rawKey);
    if (!key) {
      setErrorMessage(
        'Nama variabel hanya boleh berisi huruf, angka, spasi, atau garis bawah (contoh: nama, fakultas, asal_sekolah).'
      );
      return;
    }
    setErrorMessage(null);
    const tokenText = `{{${key}}}`;
    const textarea = captionTemplateTextareaRef.current;

    if (textarea) {
      const start = textarea.selectionStart ?? captionTemplate.length;
      const end = textarea.selectionEnd ?? captionTemplate.length;
      const nextValue =
        captionTemplate.slice(0, start) + tokenText + captionTemplate.slice(end);
      setCaptionTemplate(nextValue);

      requestAnimationFrame(() => {
        textarea.focus();
        const cursor = start + tokenText.length;
        textarea.setSelectionRange(cursor, cursor);
      });
    } else {
      setCaptionTemplate((prev) => (prev ? `${prev} ${tokenText}` : tokenText));
    }
  };

  // Remove all occurrences of a specific {{token}} from captionTemplate
  const handleRemoveToken = (tokenKey: string) => {
    setCaptionTemplate((prev) => {
      const next = prev.replace(/\{\{([^{}]*)\}\}/g, (fullMatch, rawInside: string) => {
        if (normalizeTokenKey(rawInside) === tokenKey) {
          return '';
        }
        return fullMatch;
      });
      return next.replace(/ {2,}/g, ' ');
    });
  };

  // Convert a square bracket placeholder like [nama fakultas] into {{fakultas}}
  const handleConvertBracketToToken = (rawBracket: string, suggestedKey: string) => {
    setCaptionTemplate((prev) => prev.split(rawBracket).join(`{{${suggestedKey}}}`));
  };

  // Fill with Diklat 2026 preset
  const handleFillDiklatPreset = () => {
    setTitle(DEFAULT_DIKLAT_2026_CAMPAIGN.title);
    if (!campaign?.slug_locked) {
      setSlug(DEFAULT_DIKLAT_2026_CAMPAIGN.slug);
      setSlugTouched(true);
    }
    setDescription(DEFAULT_DIKLAT_2026_CAMPAIGN.description);
    setCaptionDefault(DEFAULT_DIKLAT_2026_CAMPAIGN.caption_default);
    setCaptionTemplate(DEFAULT_DIKLAT_2026_CAMPAIGN.caption_template);

    const diklatEv = events.find(
      (e) =>
        e.slug === 'pendaftaran-diklat-kepemimpinan-periode-20262027' ||
        e.title.toLowerCase().includes('diklat kepemimpinan')
    );
    if (diklatEv) {
      setRelatedEventId(diklatEv.id);
    }
    setSuccessMessage('Template Diklat Kepemimpinan 2026 berhasil diterapkan ke formulir.');
  };

  // Save Draft (POST if new, PATCH if existing)
  const handleSaveDraft = async (): Promise<TwibbonCampaignRow | null> => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      if (!campaign) {
        const res = await fetch('/api/admin/twibbon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            slug,
            description: description || '',
            event_id: relatedEventId || null,
            caption_default: captionDefault,
            caption_template: captionTemplate || '',
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error?.message || 'Gagal membuat draft kampanye.');
        }
        const created: TwibbonCampaignRow = json.campaign || json.data;
        setCampaign(created);
        setSuccessMessage('Draft kampanye berhasil dibuat.');
        router.replace(`/dashboard/humas/twibbon/${created.id}`);
        return created;
      } else {
        const res = await fetch(`/api/admin/twibbon/${campaign.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            expected_version: campaign.edit_version,
            title,
            slug: campaign.slug_locked ? undefined : slug,
            description: description || '',
            event_id: relatedEventId || null,
            caption_default: captionDefault,
            caption_template: captionTemplate || '',
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error?.message || 'Gagal menyimpan perubahan draft.');
        }
        const updated: TwibbonCampaignRow = json.campaign || json.data;
        setCampaign(updated);
        setSuccessMessage(`Draft kampanye berhasil disimpan (v${updated.edit_version}).`);
        return updated;
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan draft kampanye.');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // Client + Server Frame PNG Upload
  const uploadFrameFile = async (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setFrameWarning(null);
    setIsUploadingAsset(true);

    try {
      // 1. Ensure campaign row exists first
      let targetCampaign = campaign;
      if (!targetCampaign) {
        targetCampaign = await handleSaveDraft();
        if (!targetCampaign) {
          setIsUploadingAsset(false);
          return;
        }
      }

      // 2. Frontend Header Validation (1080x1080, <=5 MiB, static PNG)
      const arrayBuffer = await file.arrayBuffer();
      const headerValidation = validateAdminFrameHeader(
        new Uint8Array(arrayBuffer),
        file.size
      );
      if (!headerValidation.valid) {
        throw new Error(
          headerValidation.errorMessage ||
            'File bingkai tidak memenuhi syarat PNG 1080×1080.'
        );
      }

      // 3. Frontend RGBA Transparency Validation on 1080x1080 canvas
      const objectUrl = URL.createObjectURL(file);
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.onload = () => resolve(el);
          el.onerror = () => reject(new Error('Gagal mendekode PNG di browser.'));
          el.src = objectUrl;
        });

        const checkCanvas = document.createElement('canvas');
        checkCanvas.width = 1080;
        checkCanvas.height = 1080;
        const checkCtx = checkCanvas.getContext('2d');
        if (!checkCtx) {
          throw new Error('Gagal menginisialisasi canvas pemeriksa transparansi.');
        }
        checkCtx.drawImage(img, 0, 0, 1080, 1080);
        const imageData = checkCtx.getImageData(0, 0, 1080, 1080);
        const alphaCheck = analyzeFrameRgbaPixels(imageData.data, 1080, 1080);
        if (!alphaCheck.valid) {
          throw new Error(alphaCheck.errorMessage || 'Bingkai PNG harus memiliki area transparan.');
        }

        if (typeof alphaCheck.transparentRatio === 'number') {
          setFrameTransparencyPercent(
            Math.round(alphaCheck.transparentRatio * 1000) / 10
          );
        }
        if (alphaCheck.warningMessage) {
          setFrameWarning(alphaCheck.warningMessage);
        }
      } finally {
        URL.revokeObjectURL(objectUrl);
      }

      // 4. Upload to Backend Route Handler (/api/admin/twibbon/[id]/assets)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', 'frame');
      formData.append('expected_version', String(targetCampaign.edit_version));

      const res = await fetch(`/api/admin/twibbon/${targetCampaign.id}/assets`, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Gagal mengunggah bingkai ke server.');
      }

      const uploadedAsset = json.asset || json.data?.asset;
      const nextEditVersion = Number(json.edit_version || targetCampaign.edit_version + 1);
      setCampaign((prev) =>
        prev
          ? {
              ...prev,
              edit_version: nextEditVersion,
              draft_payload: {
                ...prev.draft_payload,
                frame_asset_id: uploadedAsset?.id || prev.draft_payload.frame_asset_id,
              },
            }
          : prev
      );
      if (json.signed_preview_url || json.data?.signed_preview_url) {
        setFramePreviewUrl(json.signed_preview_url || json.data?.signed_preview_url);
      }
      if (json.warning_message || json.data?.warning) {
        setFrameWarning(json.warning_message || json.data?.warning);
      }
      setSuccessMessage(
        'Bingkai PNG 1080×1080 berhasil divalidasi (frontend & server) dan disimpan ke penyimpanan draft privat.'
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengunggah bingkai PNG.');
    } finally {
      setIsUploadingAsset(false);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await uploadFrameFile(file);
  };

  // Generate & Upload Sample Official 1080x1080 Transparent PNG Frame
  const handleUseSampleOfficialFrame = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const sampleCanvas = createSampleDiklatFrameCanvas();
      const blob = await new Promise<Blob>((resolve, reject) => {
        sampleCanvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Gagal mengekspor bingkai contoh.'));
        }, 'image/png');
      });
      const sampleFile = new File(
        [blob],
        'bingkai-resmi-diklat-pilar-bangsa-1080x1080.png',
        { type: 'image/png' }
      );
      await uploadFrameFile(sampleFile);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat bingkai contoh.');
    }
  };

  const handleDownloadSampleOfficialFrame = async () => {
    const sampleCanvas = createSampleDiklatFrameCanvas();
    const dataUrl = sampleCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'bingkai-resmi-diklat-pilar-bangsa-1080x1080.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Atomic Publish
  const handlePublish = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const saved = await handleSaveDraft();
    if (!saved) return;

    setIsPublishing(true);
    try {
      const res = await fetch(`/api/admin/twibbon/${saved.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expected_version: saved.edit_version,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Gagal memublikasikan kampanye.');
      }

      // Reload latest campaign & revisions from Supabase
      const [freshCamp, freshRevs] = await Promise.all([
        supabase.from('twibbon_campaigns').select('*').eq('id', saved.id).maybeSingle(),
        supabase
          .from('twibbon_revisions')
          .select('*')
          .eq('campaign_id', saved.id)
          .order('revision_number', { ascending: false }),
      ]);

      if (freshCamp.data) {
        setCampaign(freshCamp.data as TwibbonCampaignRow);
      }
      if (freshRevs.data) {
        setRevisions(freshRevs.data as TwibbonRevisionRow[]);
      }

      const revNum = json.result?.revision_number || (freshRevs.data?.[0] as any)?.revision_number || 1;
      setSuccessMessage(
        `Kampanye "${saved.draft_payload.title}" berhasil dipublikasikan secara atomik (Revisi #${revNum})! URL publik /twibbon/${saved.slug} kini aktif.`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memublikasikan kampanye.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Archive / Restore
  const handleToggleArchive = async (action: 'archive' | 'restore') => {
    if (!campaign) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsArchiving(true);

    try {
      const res = await fetch(`/api/admin/twibbon/${campaign.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          expected_version: campaign.edit_version,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Gagal mengubah status arsip kampanye.');
      }

      const updated: TwibbonCampaignRow = json.campaign || json.data;
      setCampaign(updated);
      setSuccessMessage(
        action === 'archive'
          ? 'Kampanye berhasil diarsipkan.'
          : 'Kampanye berhasil dipulihkan ke status Published.'
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengubah status arsip.');
    } finally {
      setIsArchiving(false);
    }
  };

  // Switch Kegiatan Resource Card URL (Controlled Action per Decision A4 & PRD Section 6)
  const handleSwitchEventResourceUrl = async (targetMode: 'internal' | 'fallback_twbnz') => {
    if (!eventTwibbonResource || !campaign) return;

    if (targetMode === 'internal' && campaign.state !== 'published') {
      setErrorMessage(
        'Kampanye Twibbon harus berstatus Published terlebih dahulu sebelum kartu Twibbon di halaman Kegiatan diarahkan ke sini.'
      );
      return;
    }

    setIsUpdatingEventResource(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const nextUrl =
      targetMode === 'internal'
        ? `https://www.pilarbangsa.my.id/twibbon/${campaign.slug}`
        : 'https://twb.nz/diklatukmpilarbangsa2026';

    try {
      const { data, error } = await supabase
        .from('public_event_resources')
        .update({ url: nextUrl })
        .eq('id', eventTwibbonResource.id)
        .select('*')
        .single();

      if (error) throw error;
      setEventTwibbonResource(data as PublicEventResource);
      setSuccessMessage(
        targetMode === 'internal'
          ? `Kartu "${eventTwibbonResource.title}" di halaman Kegiatan berhasil diarahkan ke ${nextUrl}.`
          : `Kartu "${eventTwibbonResource.title}" berhasil dikembalikan ke tautan cadangan ${nextUrl}.`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memperbarui tautan kartu di halaman Kegiatan.');
    } finally {
      setIsUpdatingEventResource(false);
    }
  };

  const handleCopyPublicUrl = async () => {
    const publicUrl = `https://www.pilarbangsa.my.id/twibbon/${slug || 'diklat-kepemimpinan-2026'}`;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      // ignore
    }
  };

  const isInternalLinkActiveOnEvent =
    eventTwibbonResource?.url ===
    `https://www.pilarbangsa.my.id/twibbon/${campaign?.slug || slug}`;

  return (
    <div className="space-y-8">
      {/* Top Action Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/humas/twibbon"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft size={14} />
              <span>Daftar Kampanye Twibbon</span>
            </Link>
            <span className="text-gray-300">•</span>
            {campaign ? (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  campaign.state === 'published'
                    ? 'bg-green-50 text-[#008000] border border-green-200'
                    : campaign.state === 'archived'
                    ? 'bg-gray-100 text-gray-700 border border-gray-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                Status: {campaign.state.toUpperCase()} (v{campaign.edit_version})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Kampanye Baru
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
            {isNew && !campaign
              ? 'Buat Kampanye Twibbon Baru'
              : title || 'Editor Kampanye Twibbon'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!campaign && (
            <button
              type="button"
              onClick={handleFillDiklatPreset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-colors"
            >
              <Sparkles size={15} />
              <span>Isi Template Diklat 2026</span>
            </button>
          )}

          {campaign && (
            <Link
              href={`/dashboard/humas/twibbon/${campaign.id}/preview`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-colors"
            >
              <Eye size={15} />
              <span>Pratinjau Privat Draft</span>
            </Link>
          )}

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-colors disabled:opacity-50"
          >
            {isSaving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
            <span>Simpan Draft</span>
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing || isSaving}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#008000] hover:bg-green-700 text-white text-xs font-extrabold shadow-md transition-all disabled:opacity-50"
          >
            {isPublishing ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
            <span>
              {campaign?.state === 'published'
                ? 'Terbitkan Revisi Baru'
                : 'Publikasikan Kampanye'}
            </span>
          </button>

          {campaign && campaign.state === 'published' && (
            <button
              type="button"
              onClick={() => handleToggleArchive('archive')}
              disabled={isArchiving}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold transition-colors"
            >
              <Archive size={15} />
              <span>Arsipkan</span>
            </button>
          )}

          {campaign && campaign.state === 'archived' && (
            <button
              type="button"
              onClick={() => handleToggleArchive('restore')}
              disabled={isArchiving}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors"
            >
              <RotateCcw size={15} />
              <span>Pulihkan ke Published</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
          <AlertCircle size={20} className="shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1 text-sm font-medium">{errorMessage}</div>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700">
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-[#008000] flex items-start gap-3">
          <CheckCircle2 size={20} className="shrink-0 text-[#008000] mt-0.5" />
          <div className="flex-1 text-sm font-medium">{successMessage}</div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-600 hover:text-green-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Metadata & Caption Templates (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Identitas & Kegiatan Terkait */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
            <h2 className="text-base sm:text-lg font-extrabold text-gray-900 border-b border-gray-100 pb-3">
              1. Identitas Kampanye & Kegiatan Terkait
            </h2>

            {/* Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="twibbon-title"
                  className="text-xs font-bold text-gray-700 uppercase tracking-wider"
                >
                  Judul Kampanye <span className="text-[#E31837]">*</span>
                </label>
                <span className="text-[11px] text-gray-400">{title.length}/120 karakter</span>
              </div>
              <input
                id="twibbon-title"
                type="text"
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Twibbon Diklat Kepemimpinan UKM Pilar Bangsa 2026"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#E31837] focus:ring-2 focus:ring-red-100 outline-none text-sm font-medium"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="twibbon-slug"
                  className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <span>Slug URL</span>
                  {campaign?.slug_locked && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-semibold">
                      <Lock size={10} /> Terkunci Setelah Publikasi Pertama
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={handleCopyPublicUrl}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#E31837] hover:underline"
                >
                  {copiedUrl ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedUrl ? 'URL Disalin!' : 'Salin URL Kampanye'}</span>
                </button>
              </div>
              <div className="flex items-center rounded-2xl border border-gray-200 overflow-hidden bg-gray-50">
                <span className="px-3.5 py-3 text-xs font-mono text-gray-500 border-r border-gray-200 select-none">
                  pilarbangsa.my.id/twibbon/
                </span>
                <input
                  id="twibbon-slug"
                  type="text"
                  maxLength={80}
                  disabled={Boolean(campaign?.slug_locked)}
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(normalizeCampaignSlug(e.target.value));
                  }}
                  placeholder="diklat-kepemimpinan-2026"
                  className="flex-1 px-3.5 py-3 bg-white text-sm font-mono text-gray-900 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="twibbon-desc"
                  className="text-xs font-bold text-gray-700 uppercase tracking-wider"
                >
                  Deskripsi Singkat (Opsional)
                </label>
                <span className="text-[11px] text-gray-400">{description.length}/500</span>
              </div>
              <textarea
                id="twibbon-desc"
                rows={2}
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Penjelasan satu kalimat untuk membantu peserta memahami fungsi bingkai twibbon ini."
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#E31837] focus:ring-2 focus:ring-red-100 outline-none text-sm"
              />
            </div>

            {/* Related Event (Relational Sync per PRD 12.1) */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <label
                htmlFor="twibbon-event"
                className="text-xs font-bold text-gray-700 uppercase tracking-wider block"
              >
                Kegiatan Terkait (Sinkron Otomatis Tanggal & Lokasi)
              </label>
              <select
                id="twibbon-event"
                value={relatedEventId}
                onChange={(e) => setRelatedEventId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm font-medium focus:border-[#E31837] outline-none"
              >
                <option value="">-- Tidak dihubungkan ke kegiatan tertentu --</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.publish_status.toUpperCase()})
                  </option>
                ))}
              </select>

              {selectedEvent && (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
                  <div className="font-bold text-gray-800 flex items-center justify-between">
                    <span>Data Relasional dari Kegiatan:</span>
                    <Link
                      href={`/kegiatan/${selectedEvent.slug}`}
                      target="_blank"
                      className="text-[#E31837] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Lihat Halaman Kegiatan</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-4 text-gray-600">
                    {selectedEvent.starts_at && (
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={13} className="text-[#E31837]" />
                        {formatEventDateWib(selectedEvent.starts_at, {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                    {selectedEvent.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={13} className="text-[#008000]" />
                        {selectedEvent.location}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Controlled Switch for "Twibbon Diklat" Card on Kegiatan Page */}
              {eventTwibbonResource && (
                <div className="p-4 rounded-2xl bg-red-50/60 border border-red-100 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                        <Link2 size={14} className="text-[#E31837]" />
                        <span>Integrasi Kartu &ldquo;{eventTwibbonResource.title}&rdquo; di Halaman Kegiatan</span>
                      </div>
                      <p className="text-[11px] text-gray-600">
                        Tautan saat ini:{' '}
                        <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200">
                          {eventTwibbonResource.url}
                        </code>
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isInternalLinkActiveOnEvent
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isInternalLinkActiveOnEvent ? 'Menggunakan Twibbon Internal' : 'Masih Tautan Eksternal'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={
                        isUpdatingEventResource ||
                        campaign?.state !== 'published' ||
                        isInternalLinkActiveOnEvent
                      }
                      onClick={() => handleSwitchEventResourceUrl('internal')}
                      className="px-3.5 py-2 rounded-xl bg-[#E31837] hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-40"
                    >
                      Arahkan Kartu Kegiatan ke /twibbon/{campaign?.slug || slug}
                    </button>

                    <button
                      type="button"
                      disabled={
                        isUpdatingEventResource ||
                        eventTwibbonResource.url === 'https://twb.nz/diklatukmpilarbangsa2026'
                      }
                      onClick={() => handleSwitchEventResourceUrl('fallback_twbnz')}
                      className="px-3.5 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors disabled:opacity-40"
                    >
                      Rollback ke Cadangan (twb.nz)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Template Caption (Umum & Personal) */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <h2 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <FileText size={18} className="text-[#E31837]" />
                <span>2. Template Caption Resmi & Variabel Fleksibel</span>
              </h2>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                Fleksibel untuk Mahasiswa, Siswa, & Umum
              </span>
            </div>

            {!captionValidation.valid && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800 space-y-1">
                {captionValidation.errors.map((err, idx) => (
                  <div key={idx}>• {err}</div>
                ))}
              </div>
            )}

            {/* Caption Default (Umum) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="caption-default"
                  className="text-xs font-bold text-gray-700 uppercase tracking-wider"
                >
                  Template Caption Umum (`caption_default`) <span className="text-[#E31837]">*</span>
                </label>
                <span className="text-[11px] text-gray-400">
                  {captionDefault.length}/2000 karakter
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                Digunakan saat peserta tidak mengisi kolom data diri (atau jika kampanye tidak memakai variabel personal). Tidak boleh mengandung token{' '}
                <code>{'{{...}}'}</code>.
              </p>
              <textarea
                id="caption-default"
                rows={6}
                maxLength={2000}
                value={captionDefault}
                onChange={(e) => setCaptionDefault(e.target.value)}
                placeholder="Tulis caption resmi versi umum tanpa token..."
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#E31837] focus:ring-2 focus:ring-red-100 outline-none text-xs sm:text-sm font-sans leading-relaxed"
              />
            </div>

            {/* Caption Personal (caption_template) + Interactive Variable Manager */}
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="caption-template"
                  className="text-xs font-bold text-gray-700 uppercase tracking-wider"
                >
                  Template Caption Personal (`caption_template`)
                </label>
                <span className="text-[11px] text-gray-400">
                  {captionTemplate.length}/2000 karakter
                </span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Tambahkan atau kurangi variabel menggunakan tanda <code>{'{{nama_variabel}}'}</code> sesuai peserta kegiatan (misal: mahasiswa memakai{' '}
                <code>{'{{nama}}'}</code>, <code>{'{{fakultas}}'}</code>, <code>{'{{prodi}}'}</code>; siswa sekolah memakai{' '}
                <code>{'{{nama}}'}</code>, <code>{'{{asal_sekolah}}'}</code>, <code>{'{{kelas}}'}</code>). Kolom input di halaman peserta akan menyesuaikan otomatis!
              </p>

              {/* Interactive Variable / Token Manager Box */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3.5">
                {/* 1. Active Variables in Template (with Remove button) */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                    <span>
                      Variabel Aktif di Halaman Peserta ({activeCaptionTokens.length})
                    </span>
                    {activeCaptionTokens.length > 0 && (
                      <span className="text-[10px] font-normal text-gray-500">
                        Klik variabel untuk menyisipkan lagi, atau klik ✕ untuk menghapus
                      </span>
                    )}
                  </div>

                  {activeCaptionTokens.length === 0 ? (
                    <div className="text-xs text-gray-500 bg-white border border-dashed border-gray-300 rounded-xl p-2.5">
                      Belum ada variabel <code>{'{{...}}'}</code> di dalam teks. Klik tombol preset di bawah untuk menambahkan variabel.
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      {activeCaptionTokens.map((tokenMeta) => (
                        <div
                          key={tokenMeta.key}
                          className="inline-flex items-center rounded-xl bg-white border border-red-200 shadow-2xs overflow-hidden text-xs"
                        >
                          <button
                            type="button"
                            onClick={() => handleInsertToken(tokenMeta.key)}
                            className="px-2.5 py-1.5 font-mono font-bold text-[#E31837] hover:bg-red-50 transition-colors flex items-center gap-1.5"
                            title={`Sisipkan {{${tokenMeta.key}}} pada posisi kursor`}
                          >
                            <span>{`{{${tokenMeta.key}}}`}</span>
                            <span className="font-sans font-medium text-[11px] text-gray-500">
                              ({tokenMeta.label})
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveToken(tokenMeta.key)}
                            className="px-2 py-1.5 text-gray-400 hover:text-red-700 hover:bg-red-100 border-l border-red-100 transition-colors"
                            title={`Hapus semua variabel {{${tokenMeta.key}}} dari template`}
                            aria-label={`Hapus variabel ${tokenMeta.key}`}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Quick-Add Variable Presets (Mahasiswa & Siswa) */}
                <div className="space-y-1.5 pt-2 border-t border-gray-200/70">
                  <div className="text-[11px] font-bold text-gray-600">
                    Tambah Cepat Variabel (Klik untuk menyisipkan ke posisi kursor):
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {QUICK_CAPTION_TOKEN_PRESETS.map((preset) => {
                      const isActive = activeCaptionTokens.some((t) => t.key === preset.key);
                      return (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() => handleInsertToken(preset.key)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            isActive
                              ? 'bg-red-50/80 text-[#E31837] border-red-200 hover:bg-red-100'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          <Plus size={12} />
                          <span className="font-mono">{`{{${preset.key}}}`}</span>
                          <span className="text-[10px] font-normal text-gray-500">
                            {preset.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Custom Variable Creator */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-gray-200/70">
                  <input
                    type="text"
                    value={customTokenInput}
                    onChange={(e) => setCustomTokenInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (customTokenInput.trim()) {
                          handleInsertToken(customTokenInput);
                          setCustomTokenInput('');
                        }
                      }
                    }}
                    placeholder="Buat variabel kustom lain (misal: nama_fakultas, angkatan, hobi)..."
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs focus:border-[#E31837] outline-none"
                  />
                  <button
                    type="button"
                    disabled={!customTokenInput.trim()}
                    onClick={() => {
                      if (customTokenInput.trim()) {
                        handleInsertToken(customTokenInput);
                        setCustomTokenInput('');
                      }
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-colors disabled:opacity-40 shrink-0"
                  >
                    <Plus size={14} />
                    <span>Tambah & Sisipkan Variabel</span>
                  </button>
                </div>
              </div>

              {/* Helper Banner if Square Brackets like [nama fakultas] are detected */}
              {bracketSuggestions.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
                  <div className="text-xs font-bold flex items-center gap-1.5 text-amber-900">
                    <Sparkles size={14} className="text-amber-600 shrink-0" />
                    <span>
                      Terdeteksi tanda kurung siku <code>[...]</code> pada teks Anda — ubah menjadi variabel otomatis dengan 1 klik:
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {bracketSuggestions.map((item) => (
                      <button
                        key={item.rawBracket}
                        type="button"
                        onClick={() =>
                          handleConvertBracketToToken(
                            item.rawBracket,
                            item.suggestedTokenKey
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold shadow-2xs transition-colors"
                      >
                        <span>Ubah</span>
                        <code className="bg-amber-100 px-1 rounded">{item.rawBracket}</code>
                        <span>→</span>
                        <code className="text-[#E31837] font-mono font-extrabold">
                          {`{{${item.suggestedTokenKey}}}`}
                        </code>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <textarea
                id="caption-template"
                ref={captionTemplateTextareaRef}
                rows={7}
                maxLength={2000}
                value={captionTemplate}
                onChange={(e) => setCaptionTemplate(e.target.value)}
                placeholder="Contoh: Halo! Aku {{nama}}, dari fakultas {{fakultas}}, prodi {{prodi}}..."
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#E31837] focus:ring-2 focus:ring-red-100 outline-none text-xs sm:text-sm font-sans leading-relaxed"
              />
            </div>

            {/* Dual-Scenario Live Caption Preview (PRD 12.2) */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-extrabold text-gray-800 uppercase tracking-wider block">
                  Simulasi Pratinjau Caption (2 Skenario)
                </span>
                {activeCaptionTokens.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {activeCaptionTokens.map((tokenMeta) => (
                      <div key={tokenMeta.key} className="space-y-0.5">
                        <label className="text-[10px] font-bold text-gray-500 block">
                          Simulasi {tokenMeta.label} (<code>{`{{${tokenMeta.key}}}`}</code>)
                        </label>
                        <input
                          type="text"
                          value={effectiveSimValues[tokenMeta.key] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSimValues((prev) => ({
                              ...prev,
                              [tokenMeta.key]: val,
                            }));
                          }}
                          placeholder={tokenMeta.placeholder}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white border border-gray-200 space-y-1.5">
                  <div className="text-[11px] font-bold text-emerald-700">
                    Skenario A: Semua Variabel Terisi ({previewPersonalOutput.variant})
                  </div>
                  <div className="text-xs text-gray-700 whitespace-pre-wrap max-h-44 overflow-y-auto leading-relaxed">
                    {previewPersonalOutput.text || '(Kosong)'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-gray-200 space-y-1.5">
                  <div className="text-[11px] font-bold text-gray-600">
                    Skenario B: Variabel Dikosongkan Peserta ({previewDefaultOutput.variant})
                  </div>
                  <div className="text-xs text-gray-700 whitespace-pre-wrap max-h-44 overflow-y-auto leading-relaxed">
                    {previewDefaultOutput.text || '(Kosong)'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: PNG Frame Uploader, Checkerboard Preview, Revisions & Audit Log (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 3: Bingkai PNG 1080x1080 & Checkerboard Admin */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-gray-900">
                  3. Bingkai PNG Transparan (1080×1080)
                </h2>
                <p className="text-xs text-gray-500">
                  Wajib PNG statis, tepat 1080×1080 px, maks 5 MiB, memiliki area transparan.
                </p>
              </div>
            </div>

            {/* Checkerboard Canvas Preview (Admin-Only per PRD 12.2) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-700">
                  Pratinjau Area Transparan (Checkerboard Admin)
                </span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-[#E31837]">
                  <input
                    type="checkbox"
                    checked={showSamplePhotoSim}
                    onChange={(e) => setShowSamplePhotoSim(e.target.checked)}
                    className="rounded border-gray-300 text-[#E31837] focus:ring-[#E31837]"
                  />
                  <span>Simulasikan Foto Peserta</span>
                </label>
              </div>

              <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shadow-inner">
                <canvas
                  ref={adminPreviewCanvasRef}
                  className="w-full h-full object-contain block"
                />
              </div>

              {frameTransparencyPercent !== null && (
                <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl flex items-center justify-between">
                  <span>Area Transparan Terdeteksi:</span>
                  <span>{frameTransparencyPercent}% piksel kanvas</span>
                </div>
              )}

              {frameWarning && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-start gap-2">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-600" />
                  <span>{frameWarning}</span>
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div className="space-y-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <button
                type="button"
                disabled={isUploadingAsset}
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#E31837] hover:bg-red-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUploadingAsset ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                <span>
                  {campaign?.draft_payload?.frame_asset_id
                    ? 'Ganti File Bingkai PNG 1080×1080'
                    : 'Unggah File Bingkai PNG 1080×1080'}
                </span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isUploadingAsset}
                  onClick={handleUseSampleOfficialFrame}
                  className="py-2.5 px-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={14} className="text-[#E31837]" />
                  <span>Gunakan Bingkai Contoh Resmi</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSampleOfficialFrame}
                  className="py-2.5 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download size={14} />
                  <span>Unduh Sampel PNG 1080×1080</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 4: Riwayat Revisi Immutable & Audit Log */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <History size={18} className="text-[#E31837]" />
              <h2 className="text-base font-extrabold text-gray-900">
                Riwayat Revisi Publik & Audit Log
              </h2>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Revisi Immutable ({revisions.length})
              </div>
              {revisions.length === 0 ? (
                <p className="text-xs text-gray-400">
                  Belum ada revisi yang dipublikasikan.
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {revisions.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-gray-900">
                          Revisi #{rev.revision_number}
                        </span>
                        <span className="text-gray-500 ml-2">{rev.title}</span>
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {new Date(rev.published_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Log Audit Terbaru ({auditLogs.length})
              </div>
              {auditLogs.length === 0 ? (
                <p className="text-xs text-gray-400">Belum ada aktivitas tercatat.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2 rounded-xl bg-gray-50 border border-gray-100 text-[11px] flex items-center justify-between"
                    >
                      <span className="font-mono font-bold text-gray-700">
                        {log.action}
                      </span>
                      <span className="text-gray-400">
                        {new Date(log.created_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
