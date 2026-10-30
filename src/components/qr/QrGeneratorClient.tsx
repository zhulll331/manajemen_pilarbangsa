"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  encodeQrMatrix,
  buildDirectQrPayload,
} from '@/lib/qr/encoder';
import {
  QR_LOGO_PRESETS,
  QrLogoPresetId,
} from '@/lib/qr/logos';
import {
  DEFAULT_QR_DESIGN,
  QR_COLOR_PRESETS,
  QrDesignOptions,
  QrDotStyle,
  QrEyeFrameStyle,
  QrEyeBallStyle,
  QrFrameStyle,
  QrLogoShape,
  renderQrToCanvas,
  renderQrToSvgString,
} from '@/lib/qr/renderer';
import {
  QrCode,
  Link as LinkIcon,
  MessageCircle,
  MapPin,
  Mail,
  Wifi,
  Download,
  Copy,
  Check,
  Sparkles,
  Upload,
  Palette,
  Shapes,
  Image as ImageIcon,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Type,
} from 'lucide-react';

type ContentMode = 'url' | 'whatsapp' | 'gmaps' | 'email' | 'wifi';

const QUICK_LINK_PRESETS = [
  {
    label: 'Web Pilar Bangsa',
    mode: 'url' as ContentMode,
    url: 'https://www.pilarbangsa.my.id',
    logoId: 'pilar' as QrLogoPresetId,
    frameText: 'PILAR BANGSA DIGITAL OFFICE',
  },
  {
    label: 'Pendaftaran Diklat 2026',
    mode: 'url' as ContentMode,
    url: 'https://www.pilarbangsa.my.id/kegiatan/pendaftaran-diklat-kepemimpinan-periode-20262027',
    logoId: 'pilar' as QrLogoPresetId,
    frameText: 'SCAN DAFTAR DIKLAT 2026',
  },
  {
    label: 'Twibbon Diklat 2026',
    mode: 'url' as ContentMode,
    url: 'https://www.pilarbangsa.my.id/twibbon/diklat-kepemimpinan-2026',
    logoId: 'maskot_ai' as QrLogoPresetId,
    frameText: 'PASANG TWIBBON RESMI',
  },
  {
    label: 'Maps Sekretariat UKM',
    mode: 'url' as ContentMode,
    url: 'https://maps.app.goo.gl/Kqw7VtiUXvSuqFFS6',
    logoId: 'gmaps' as QrLogoPresetId,
    frameText: 'LOKASI SEKRETARIAT UKM',
  },
  {
    label: 'Instagram UKM',
    mode: 'url' as ContentMode,
    url: 'https://www.instagram.com/ukmpilarbangsa',
    logoId: 'instagram' as QrLogoPresetId,
    frameText: '@UKMPILARBANGSA',
  },
  {
    label: 'WhatsApp Sekre',
    mode: 'whatsapp' as ContentMode,
    waPhone: '085607851580',
    waMessage: 'Halo Kak, saya ingin bertanya seputar kegiatan UKM Pilar Bangsa.',
    logoId: 'whatsapp' as QrLogoPresetId,
    frameText: 'HUBUNGI WHATSAPP KAMI',
  },
];

const FRAME_TEXT_SUGGESTIONS = [
  'SCAN ME',
  'SCAN UNTUK DAFTAR',
  'BUKA GOOGLE MAPS',
  'HUBUNGI WHATSAPP',
  'TWIBBON PILAR BANGSA',
  'BUKA LINK RESMI',
];

export default function QrGeneratorClient() {
  // 1. State Konten Tujuan (100% Direct Scan)
  const [mode, setMode] = useState<ContentMode>('url');
  const [urlInput, setUrlInput] = useState('https://www.pilarbangsa.my.id');
  const [waPhone, setWaPhone] = useState('085607851580');
  const [waMessage, setWaMessage] = useState(
    'Halo Kak, saya ingin bertanya seputar kegiatan UKM Pilar Bangsa.'
  );
  const [gmapsQuery, setGmapsQuery] = useState('https://maps.app.goo.gl/Kqw7VtiUXvSuqFFS6');
  const [emailTo, setEmailTo] = useState('ukmpilarbangsa@gmail.com');
  const [emailSubject, setEmailSubject] = useState('Informasi UKM Pilar Bangsa');
  const [emailBody, setEmailBody] = useState('');
  const [wifiSsid, setWifiSsid] = useState('UKM Pilar Bangsa');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiSecurity, setWifiSecurity] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');

  // 2. State Kustomisasi Desain & Logo
  const [design, setDesign] = useState<QrDesignOptions>(DEFAULT_QR_DESIGN);
  const [selectedLogoId, setSelectedLogoId] = useState<QrLogoPresetId>('pilar');
  const [customLogoDataUri, setCustomLogoDataUri] = useState<string | null>(null);
  const [customLogoName, setCustomLogoName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'logo' | 'style' | 'color' | 'frame'>('logo');

  // 3. State Render & Aksi
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loadedLogoImg, setLoadedLogoImg] = useState<HTMLImageElement | null>(null);
  const [loadedLogoDataUri, setLoadedLogoDataUri] = useState<string | null>(null);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  // Hitung payload langsung yang dienkode ke dalam QR Code
  const directPayload = useMemo(
    () =>
      buildDirectQrPayload({
        mode,
        url: urlInput,
        waPhone,
        waMessage,
        gmapsQuery,
        emailTo,
        emailSubject,
        emailBody,
        wifiSsid,
        wifiPassword,
        wifiSecurity,
      }),
    [
      mode,
      urlInput,
      waPhone,
      waMessage,
      gmapsQuery,
      emailTo,
      emailSubject,
      emailBody,
      wifiSsid,
      wifiPassword,
      wifiSecurity,
    ]
  );

  // Enkode matriks QR (selalu gunakan level H saat ada logo agar 30% tahan tertutup logo)
  const qrMatrixResult = useMemo(() => {
    try {
      const matrix = encodeQrMatrix(directPayload, 'H');
      return { matrix, error: null };
    } catch (err: any) {
      return {
        matrix: encodeQrMatrix('https://www.pilarbangsa.my.id', 'H'),
        error: err?.message || 'Teks terlalu panjang.',
      };
    }
  }, [directPayload]);

  // Muat HTMLImageElement setiap kali logo berubah
  useEffect(() => {
    const src = design.logoSrc;
    if (!src) {
      setLoadedLogoImg(null);
      setLoadedLogoDataUri(null);
      return;
    }

    let cancelled = false;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      setLoadedLogoImg(img);

      // Konversi ke Data URI untuk ekspor SVG mandiri jika berupa path lokal
      if (src.startsWith('data:')) {
        setLoadedLogoDataUri(src);
      } else {
        try {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = 256;
          tempCanvas.height = 256;
          const tCtx = tempCanvas.getContext('2d');
          if (tCtx) {
            tCtx.drawImage(img, 0, 0, 256, 256);
            setLoadedLogoDataUri(tempCanvas.toDataURL('image/png'));
          }
        } catch {
          setLoadedLogoDataUri(src);
        }
      }
    };
    img.onerror = () => {
      if (!cancelled) {
        setLoadedLogoImg(null);
        setLoadedLogoDataUri(null);
      }
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [design.logoSrc]);

  // Render pratinjau QR ke Canvas secara real-time
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    renderQrToCanvas(canvas, qrMatrixResult.matrix, design, loadedLogoImg, 1024);
  }, [qrMatrixResult.matrix, design, loadedLogoImg]);

  const handleSelectLogoPreset = (presetId: QrLogoPresetId) => {
    setSelectedLogoId(presetId);
    if (presetId === 'custom') {
      if (customLogoDataUri) {
        setDesign((prev) => ({ ...prev, logoSrc: customLogoDataUri }));
      } else {
        fileInputRef.current?.click();
      }
      return;
    }
    const found = QR_LOGO_PRESETS.find((p) => p.id === presetId);
    setDesign((prev) => ({
      ...prev,
      logoSrc: found ? found.src : null,
    }));
  };

  const handleCustomLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusNote('Pilih berkas gambar (PNG, JPG, SVG, atau WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (result) {
        setCustomLogoDataUri(result);
        setCustomLogoName(file.name);
        setSelectedLogoId('custom');
        setDesign((prev) => ({ ...prev, logoSrc: result }));
        setStatusNote(`Logo kustom "${file.name}" berhasil dipasang di tengah QR.`);
        setTimeout(() => setStatusNote(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyColorPreset = (presetId: string) => {
    const preset = QR_COLOR_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setDesign((prev) => ({
      ...prev,
      fgColor: preset.fgColor,
      useGradient: preset.useGradient,
      fgGradientEnd: preset.fgGradientEnd,
      bgColor: preset.bgColor,
      customEyeColor: preset.customEyeColor,
      eyeColor: preset.eyeColor,
      frameColor: preset.frameColor,
    }));
  };

  const handleQuickPresetClick = (preset: (typeof QUICK_LINK_PRESETS)[number]) => {
    setMode(preset.mode);
    if (preset.url) setUrlInput(preset.url);
    if (preset.waPhone) setWaPhone(preset.waPhone);
    if (preset.waMessage) setWaMessage(preset.waMessage);

    const logoObj = QR_LOGO_PRESETS.find((l) => l.id === preset.logoId);
    setSelectedLogoId(preset.logoId);
    setDesign((prev) => ({
      ...prev,
      logoSrc: logoObj ? logoObj.src : prev.logoSrc,
      frameText: preset.frameText,
    }));
  };

  const handleDownloadPng = (resolution: 1024 | 2048) => {
    const exportCanvas = document.createElement('canvas');
    renderQrToCanvas(
      exportCanvas,
      qrMatrixResult.matrix,
      design,
      loadedLogoImg,
      resolution
    );
    exportCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const slugName = directPayload
        .replace(/^https?:\/\//i, '')
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 32)
        .toLowerCase();
      a.href = url;
      a.download = `qr-pilarbangsa-${slugName || 'link'}-${resolution}px.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    }, 'image/png');
  };

  const handleDownloadSvg = () => {
    const svgString = renderQrToSvgString(
      qrMatrixResult.matrix,
      design,
      loadedLogoDataUri
    );
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qr-pilarbangsa-vector.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  const handleCopyQrImage = async () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png')
      );
      if (blob && navigator.clipboard && 'ClipboardItem' in window) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2500);
      } else {
        handleDownloadPng(1024);
      }
    } catch {
      handleDownloadPng(1024);
    }
  };

  const handleCopyPayload = async () => {
    try {
      await navigator.clipboard.writeText(directPayload);
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    } catch {
      // Abaikan
    }
  };

  const handleResetDesign = () => {
    setDesign(DEFAULT_QR_DESIGN);
    setSelectedLogoId('pilar');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* KOLOM KIRI: PENGATURAN TUJUAN & KUSTOMISASI DESAIN */}
      <div className="lg:col-span-7 space-y-6">
        {/* BAGIAN 1: PILIH JENIS TUJUAN & LINK */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#E31837] bg-red-50 px-3 py-1 rounded-full border border-red-100">
                Langkah 1 • Tujuan Langsung
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-2">
                Tautan atau Tujuan QR Code
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
              <ShieldCheck size={14} /> Direct Scan (Tanpa Redirect)
            </span>
          </div>

          {/* Tab Mode Tujuan */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 bg-gray-100/90 rounded-2xl">
            {[
              { id: 'url', label: 'Website / Link', icon: LinkIcon },
              { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
              { id: 'gmaps', label: 'Google Maps', icon: MapPin },
              { id: 'email', label: 'Email', icon: Mail },
              { id: 'wifi', label: 'WiFi', icon: Wifi },
            ].map((item) => {
              const Icon = item.icon;
              const active = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setMode(item.id as ContentMode);
                    if (item.id === 'whatsapp' && selectedLogoId === 'pilar') {
                      handleSelectLogoPreset('whatsapp');
                    } else if (item.id === 'gmaps' && selectedLogoId === 'pilar') {
                      handleSelectLogoPreset('gmaps');
                    }
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-white text-[#E31837] shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Input Berdasarkan Mode */}
          {mode === 'url' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Masukkan URL / Tautan Tujuan
                </label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://www.pilarbangsa.my.id/..."
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-[#E31837] focus:ring-2 focus:ring-red-100 outline-none text-sm font-medium text-gray-900 bg-gray-50/50 focus:bg-white transition-all"
                />
                <p className="text-xs text-gray-500">
                  Mendukung semua tautan website, Google Forms, Google Drive, Instagram, YouTube, TikTok, dll. Saat di-scan, HP langsung membuka tautan ini.
                </p>
              </div>

              {/* Pintasan Tautan Resmi Pilar Bangsa */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Pintasan Cepat Tautan UKM Pilar Bangsa:
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_LINK_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleQuickPresetClick(preset)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-[#E31837] text-gray-700 border border-gray-200 hover:border-red-200 transition-colors"
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {mode === 'whatsapp' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Nomor WhatsApp Tujuan
                </label>
                <input
                  type="tel"
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  placeholder="Contoh: 085607851580 atau 6285607851580"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#008000] focus:ring-2 focus:ring-green-100 outline-none text-sm font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Pesan Otomatis Saat Di-Scan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  placeholder="Halo Kak, saya ingin mendaftar..."
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#008000] focus:ring-2 focus:ring-green-100 outline-none text-sm"
                />
              </div>
            </div>
          )}

          {mode === 'gmaps' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Tautan Google Maps atau Nama Lokasi
              </label>
              <input
                type="text"
                value={gmapsQuery}
                onChange={(e) => setGmapsQuery(e.target.value)}
                placeholder="https://maps.app.goo.gl/... atau Universitas 17 Agustus 1945 Banyuwangi"
                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-[#E31837] focus:ring-2 focus:ring-red-100 outline-none text-sm font-medium"
              />
              <p className="text-xs text-gray-500">
                Tempel link share Google Maps (`maps.app.goo.gl/...`) atau ketik nama tempat/alamat.
              </p>
            </div>
          )}

          {mode === 'email' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Alamat Email Tujuan
                  </label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="ukmpilarbangsa@gmail.com"
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#E31837] outline-none text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Subjek Email (Opsional)
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Permohonan Kerja Sama"
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#E31837] outline-none text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Isi Pesan Email (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Tulis isi email..."
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#E31837] outline-none text-sm"
                />
              </div>
            </div>
          )}

          {mode === 'wifi' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Nama WiFi (SSID)
                </label>
                <input
                  type="text"
                  value={wifiSsid}
                  onChange={(e) => setWifiSsid(e.target.value)}
                  placeholder="Nama WiFi"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#E31837] outline-none text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Kata Sandi WiFi
                </label>
                <input
                  type="text"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  placeholder="Kosongkan jika tanpa sandi"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#E31837] outline-none text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Keamanan
                </label>
                <select
                  value={wifiSecurity}
                  onChange={(e) => setWifiSecurity(e.target.value as 'WPA' | 'WEP' | 'nopass')}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#E31837] outline-none text-sm bg-white"
                >
                  <option value="WPA">WPA / WPA2 / WPA3</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">Tanpa Password</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* BAGIAN 2: STUDIO KUSTOMISASI (LOGO, GAYA TITIK, WARNA, BINGKAI) */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#008000] bg-green-50 px-3 py-1 rounded-full border border-green-200">
                Langkah 2 • Kustomisasi Desain
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-2">
                Logo Tengah, Bentuk & Warna QR
              </h2>
            </div>
            <button
              type="button"
              onClick={handleResetDesign}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#E31837] px-3 py-2 rounded-xl bg-gray-100 hover:bg-red-50 transition-colors"
            >
              <RotateCcw size={14} /> Reset Desain
            </button>
          </div>

          {/* Sub-Tab Kustomisasi */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-gray-100/90 rounded-2xl">
            {[
              { id: 'logo', label: 'Logo Tengah', icon: ImageIcon },
              { id: 'style', label: 'Bentuk & Pola', icon: Shapes },
              { id: 'color', label: 'Warna & Gradien', icon: Palette },
              { id: 'frame', label: 'Bingkai & Teks', icon: Type },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon size={15} className={isActive ? 'text-[#E31837]' : ''} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: TEMPLATE LOGO TENGAH & UPLOAD KUSTOM */}
          {activeTab === 'logo' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {QR_LOGO_PRESETS.map((preset) => {
                  const isSelected = selectedLogoId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectLogoPreset(preset.id)}
                      className={`group flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                        isSelected
                          ? 'border-[#E31837] bg-red-50/60 ring-2 ring-red-100 shadow-xs'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/70'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden mb-2 group-hover:scale-105 transition-transform">
                        {preset.src ? (
                          <img
                            src={preset.src}
                            alt={preset.label}
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          <span className="text-xs font-bold text-gray-400">Tanpa</span>
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-bold leading-tight line-clamp-1 ${
                          isSelected ? 'text-[#E31837]' : 'text-gray-700'
                        }`}
                      >
                        {preset.label}
                      </span>
                    </button>
                  );
                })}

                {/* Tombol Upload Logo Kustom Sendiri */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border border-dashed text-center transition-all ${
                    selectedLogoId === 'custom'
                      ? 'border-[#E31837] bg-red-50/60 ring-2 ring-red-100'
                      : 'border-gray-300 hover:border-[#E31837] bg-gray-50/60 hover:bg-red-50/30'
                  }`}
                >
                  <div className="w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden mb-2">
                    {customLogoDataUri ? (
                      <img
                        src={customLogoDataUri}
                        alt="Logo Kustom"
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <Upload size={18} className="text-[#E31837]" />
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-[#E31837] leading-tight line-clamp-1">
                    {customLogoName ? 'Ganti Logo' : 'Upload Logo'}
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleCustomLogoUpload}
                  className="hidden"
                />
              </div>

              {statusNote && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                  {statusNote}
                </div>
              )}

              {/* Pengaturan Ukuran & Bentuk Lencana Logo */}
              {design.logoSrc && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700">
                      Ukuran Logo Tengah ({Math.round(design.logoScale * 100)}%)
                    </label>
                    <input
                      type="range"
                      min={0.15}
                      max={0.24}
                      step={0.01}
                      value={design.logoScale}
                      onChange={(e) =>
                        setDesign((prev) => ({
                          ...prev,
                          logoScale: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full accent-[#E31837]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700">
                      Bentuk Lencana Logo
                    </label>
                    <div className="flex gap-1.5">
                      {(
                        [
                          { id: 'rounded', label: 'Bulat Halus' },
                          { id: 'circle', label: 'Lingkaran' },
                          { id: 'square', label: 'Kotak' },
                        ] as { id: QrLogoShape; label: string }[]
                      ).map((sh) => (
                        <button
                          key={sh.id}
                          type="button"
                          onClick={() => setDesign((prev) => ({ ...prev, logoShape: sh.id }))}
                          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                            design.logoShape === sh.id
                              ? 'bg-gray-900 text-white border-gray-900'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {sh.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 flex flex-col justify-center">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700 pt-3">
                      <input
                        type="checkbox"
                        checked={design.logoBgWhite}
                        onChange={(e) =>
                          setDesign((prev) => ({ ...prev, logoBgWhite: e.target.checked }))
                        }
                        className="w-4 h-4 rounded accent-[#E31837]"
                      />
                      <span>Beri Latar Bersih di Belakang Logo</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BENTUK TITIK & MATA POJOK QR */}
          {activeTab === 'style' && (
            <div className="space-y-6">
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Gaya Titik / Modul Data QR
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {(
                    [
                      { id: 'rounded', label: 'Rounded Halus' },
                      { id: 'dots', label: 'Titik Bulat' },
                      { id: 'square', label: 'Kotak Klasik' },
                      { id: 'classy', label: 'Classy Elegan' },
                      { id: 'diamond', label: 'Permata' },
                    ] as { id: QrDotStyle; label: string }[]
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setDesign((prev) => ({ ...prev, dotStyle: st.id }))}
                      className={`py-3 px-3 rounded-2xl text-xs font-bold border transition-all ${
                        design.dotStyle === st.id
                          ? 'border-[#E31837] bg-red-50 text-[#E31837] ring-2 ring-red-100'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Gaya Bingkai 3 Mata Pojok (Finder Frame)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(
                    [
                      { id: 'rounded', label: 'Sudut Halus' },
                      { id: 'circle', label: 'Lingkaran' },
                      { id: 'leaf', label: 'Daun Modern' },
                      { id: 'square', label: 'Kotak Tegas' },
                    ] as { id: QrEyeFrameStyle; label: string }[]
                  ).map((ef) => (
                    <button
                      key={ef.id}
                      type="button"
                      onClick={() => setDesign((prev) => ({ ...prev, eyeFrameStyle: ef.id }))}
                      className={`py-3 px-3 rounded-2xl text-xs font-bold border transition-all ${
                        design.eyeFrameStyle === ef.id
                          ? 'border-[#E31837] bg-red-50 text-[#E31837] ring-2 ring-red-100'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {ef.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Gaya Inti Mata Pojok (Finder Ball)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(
                    [
                      { id: 'rounded', label: 'Bulat Halus' },
                      { id: 'circle', label: 'Lingkaran' },
                      { id: 'diamond', label: 'Permata' },
                      { id: 'square', label: 'Kotak' },
                    ] as { id: QrEyeBallStyle; label: string }[]
                  ).map((eb) => (
                    <button
                      key={eb.id}
                      type="button"
                      onClick={() => setDesign((prev) => ({ ...prev, eyeBallStyle: eb.id }))}
                      className={`py-3 px-3 rounded-2xl text-xs font-bold border transition-all ${
                        design.eyeBallStyle === eb.id
                          ? 'border-[#E31837] bg-red-50 text-[#E31837] ring-2 ring-red-100'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {eb.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WARNA & GRADIEN */}
          {activeTab === 'color' && (
            <div className="space-y-6">
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Preset Tema Warna Resmi
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {QR_COLOR_PRESETS.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => handleApplyColorPreset(theme.id)}
                      className="flex items-center gap-2.5 p-3 rounded-2xl border border-gray-200 hover:border-gray-400 bg-white text-left transition-all"
                    >
                      <span
                        className="w-6 h-6 rounded-full shrink-0 border border-black/10"
                        style={{
                          background: theme.useGradient
                            ? `linear-gradient(135deg, ${theme.fgColor}, ${theme.fgGradientEnd})`
                            : theme.fgColor,
                        }}
                      />
                      <span className="text-xs font-bold text-gray-800 truncate">
                        {theme.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">
                    Warna Utama Modul QR
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={design.fgColor}
                      onChange={(e) =>
                        setDesign((prev) => ({ ...prev, fgColor: e.target.value }))
                      }
                      className="w-11 h-10 rounded-xl border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={design.fgColor}
                      onChange={(e) =>
                        setDesign((prev) => ({ ...prev, fgColor: e.target.value }))
                      }
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">
                    Warna Latar Belakang (Background)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={design.bgColor}
                      onChange={(e) =>
                        setDesign((prev) => ({ ...prev, bgColor: e.target.value }))
                      }
                      className="w-11 h-10 rounded-xl border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={design.bgColor}
                      onChange={(e) =>
                        setDesign((prev) => ({ ...prev, bgColor: e.target.value }))
                      }
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                    <input
                      type="checkbox"
                      checked={design.useGradient}
                      onChange={(e) =>
                        setDesign((prev) => ({ ...prev, useGradient: e.target.checked }))
                      }
                      className="w-4 h-4 rounded accent-[#E31837]"
                    />
                    <span>Aktifkan Gradien Warna Modul</span>
                  </label>
                  {design.useGradient && (
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={design.fgGradientEnd}
                        onChange={(e) =>
                          setDesign((prev) => ({ ...prev, fgGradientEnd: e.target.value }))
                        }
                        className="w-11 h-10 rounded-xl border border-gray-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={design.fgGradientEnd}
                        onChange={(e) =>
                          setDesign((prev) => ({ ...prev, fgGradientEnd: e.target.value }))
                        }
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                    <input
                      type="checkbox"
                      checked={design.customEyeColor}
                      onChange={(e) =>
                        setDesign((prev) => ({ ...prev, customEyeColor: e.target.checked }))
                      }
                      className="w-4 h-4 rounded accent-[#E31837]"
                    />
                    <span>Warna Khusus 3 Mata Pojok QR</span>
                  </label>
                  {design.customEyeColor && (
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={design.eyeColor}
                        onChange={(e) =>
                          setDesign((prev) => ({ ...prev, eyeColor: e.target.value }))
                        }
                        className="w-11 h-10 rounded-xl border border-gray-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={design.eyeColor}
                        onChange={(e) =>
                          setDesign((prev) => ({ ...prev, eyeColor: e.target.value }))
                        }
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BINGKAI & TEKS LABEL BAWAH */}
          {activeTab === 'frame' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Model Bingkai QR Code
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      { id: 'none', label: 'Tanpa Bingkai (1:1)' },
                      { id: 'bottom-pill', label: 'Kapsul Bawah' },
                      { id: 'card-banner', label: 'Kartu Penuh' },
                    ] as { id: QrFrameStyle; label: string }[]
                  ).map((fr) => (
                    <button
                      key={fr.id}
                      type="button"
                      onClick={() => setDesign((prev) => ({ ...prev, frameStyle: fr.id }))}
                      className={`py-3 px-3 rounded-2xl text-xs font-bold border transition-all ${
                        design.frameStyle === fr.id
                          ? 'border-[#E31837] bg-red-50 text-[#E31837] ring-2 ring-red-100'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {fr.label}
                    </button>
                  ))}
                </div>
              </div>

              {design.frameStyle !== 'none' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Teks Ajakan (Call-to-Action)
                      </label>
                      <input
                        type="text"
                        maxLength={34}
                        value={design.frameText}
                        onChange={(e) =>
                          setDesign((prev) => ({ ...prev, frameText: e.target.value }))
                        }
                        placeholder="SCAN ME"
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#E31837] outline-none text-sm font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Warna Pita Bingkai
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={design.frameColor}
                          onChange={(e) =>
                            setDesign((prev) => ({ ...prev, frameColor: e.target.value }))
                          }
                          className="w-11 h-11 rounded-xl border border-gray-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={design.frameColor}
                          onChange={(e) =>
                            setDesign((prev) => ({ ...prev, frameColor: e.target.value }))
                          }
                          className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Pilih Cepat Teks Bingkai:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {FRAME_TEXT_SUGGESTIONS.map((txt) => (
                        <button
                          key={txt}
                          type="button"
                          onClick={() => setDesign((prev) => ({ ...prev, frameText: txt }))}
                          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-[#E31837] text-gray-700 border border-gray-200 transition-colors"
                        >
                          {txt}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* KOLOM KANAN: PRATINJAU LANGSUNG & UNDUH HD */}
      <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#E31837]" />
              <h3 className="font-extrabold text-gray-900 text-lg">Pratinjau QR Code</h3>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
              ECC Level {qrMatrixResult.matrix.ecc} (30%)
            </span>
          </div>

          {/* Kanvas Pratinjau QR */}
          <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-b from-gray-50 to-gray-100/80 border border-gray-200/80 flex items-center justify-center">
            <canvas
              ref={previewCanvasRef}
              className="w-full max-w-[320px] h-auto rounded-2xl shadow-md bg-white"
            />
          </div>

          {qrMatrixResult.error && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs font-bold text-red-700">
              {qrMatrixResult.error}
            </div>
          )}

          {/* Informasi Tujuan Langsung Saat Di-Scan */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                Tujuan Saat Di-Scan Kamera:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyPayload}
                  className="text-xs font-bold text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
                >
                  {copiedPayload ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                  <span>{copiedPayload ? 'Disalin' : 'Salin Isi'}</span>
                </button>
                {directPayload.startsWith('http') && (
                  <a
                    href={directPayload}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#E31837] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Tes Buka</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
            <div className="text-xs font-mono text-gray-800 break-all line-clamp-2 bg-white px-3 py-2 rounded-xl border border-gray-100">
              {directPayload}
            </div>
          </div>

          {/* Tombol Unduh & Salin */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleDownloadPng(1024)}
                className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-[#E31837] hover:bg-red-700 text-white font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Download size={16} />
                <span>Unduh PNG (1024px)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadPng(2048)}
                className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gray-900 hover:bg-black text-white font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                <Sparkles size={16} className="text-[#FFD700]" />
                <span>PNG Cetak (2048px)</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDownloadSvg}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs sm:text-sm border border-gray-200 transition-all cursor-pointer"
              >
                <Download size={15} />
                <span>Unduh SVG Vektor</span>
              </button>

              <button
                type="button"
                onClick={handleCopyQrImage}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm border transition-all cursor-pointer ${
                  copiedImage
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200'
                }`}
              >
                {copiedImage ? <Check size={15} /> : <Copy size={15} />}
                <span>{copiedImage ? 'Gambar Disalin!' : 'Salin Gambar QR'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
