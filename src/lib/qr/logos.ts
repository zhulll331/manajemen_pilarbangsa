/**
 * Katalog Template Logo Tengah QR Code UKM Pilar Bangsa.
 *
 * Menyediakan logo resmi organisasi (Pilar Bangsa, Maskot AI/UKM, Untag Banyuwangi),
 * ekosistem Google (Google, Gemini AI, Google Maps, Google Drive, Google Forms, YouTube),
 * serta media sosial & komunikasi (WhatsApp, Instagram, TikTok, X/Twitter, Facebook, LinkedIn, Telegram).
 */

export type QrLogoPresetId =
  | 'none'
  | 'pilar'
  | 'maskot_ai'
  | 'maskot_ukm'
  | 'untag'
  | 'whatsapp'
  | 'instagram'
  | 'gmaps'
  | 'google'
  | 'gemini'
  | 'gdrive'
  | 'gforms'
  | 'youtube'
  | 'tiktok'
  | 'x'
  | 'facebook'
  | 'linkedin'
  | 'telegram'
  | 'globe'
  | 'custom';

export interface QrLogoPreset {
  id: QrLogoPresetId;
  label: string;
  category: 'organisasi' | 'google' | 'sosmed' | 'umum';
  src: string | null; // Path lokal atau SVG Data URI bebas CORS
  accentColor: string;
}

function svgToDataUri(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
}

export const QR_LOGO_PRESETS: QrLogoPreset[] = [
  {
    id: 'none',
    label: 'Tanpa Logo',
    category: 'umum',
    src: null,
    accentColor: '#111827',
  },
  // 1. ORGANISASI & KAMPUS
  {
    id: 'pilar',
    label: 'Logo Pilar Bangsa',
    category: 'organisasi',
    src: '/logo_pilar.svg',
    accentColor: '#E31837',
  },
  {
    id: 'maskot_ai',
    label: 'Maskot AI Pilar',
    category: 'organisasi',
    src: '/logoikonai_chatbot.svg',
    accentColor: '#E31837',
  },
  {
    id: 'maskot_ukm',
    label: 'Maskot UKM Pilar',
    category: 'organisasi',
    src: '/logoikonai_user.svg',
    accentColor: '#008000',
  },
  {
    id: 'untag',
    label: 'Logo Untag BWI',
    category: 'organisasi',
    src: '/logo_untag.svg',
    accentColor: '#E31837',
  },

  // 2. MEDIA SOSIAL & KOMUNIKASI
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    category: 'sosmed',
    accentColor: '#16a34a',
    src: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <rect width="120" height="120" rx="28" fill="#25D366"/>
        <path fill="#FFFFFF" d="M60.2 22C39.2 22 22.1 38.9 22.1 59.8c0 6.8 1.8 13.4 5.3 19.2L22 98l19.6-5.1c5.6 3 11.9 4.6 18.5 4.6 21 0 38.1-16.9 38.1-37.8C98.2 38.9 81.2 22 60.2 22zm22.3 53.7c-.9 2.6-5.4 5-7.6 5.3-2 .3-4.5.4-7.3-.5-1.7-.5-3.9-1.3-6.7-2.5-11.8-5.1-19.5-17-20.1-17.8-.6-.8-4.8-6.4-4.8-12.2 0-5.8 3-8.6 4.1-9.8 1.1-1.2 2.4-1.5 3.2-1.5.8 0 1.6 0 2.3.1.7 0 1.7-.3 2.7 2.1 1 2.4 3.4 8.3 3.7 8.9.3.6.5 1.3.1 2.1-.4.8-.6 1.3-1.2 2-.6.7-1.3 1.5-1.8 2-.6.6-1.2 1.2-.5 2.4.7 1.2 3.1 5.1 6.7 8.3 4.6 4.1 8.5 5.4 9.7 6 .9.4 1.9.3 2.6-.5.8-.9 3.1-3.6 3.9-4.8.8-1.2 1.6-1 2.7-.6 1.1.4 7 3.3 8.2 3.9 1.2.6 2 .9 2.3 1.4.3.6.3 3.1-.6 5.7z"/>
      </svg>
    `),
  },
  {
    id: 'instagram',
    label: 'Instagram',
    category: 'sosmed',
    accentColor: '#e1306c',
    src: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <defs>
          <radialGradient id="ig" cx="30%" cy="107%" r="150%">
            <stop offset="0%" stop-color="#fdf497"/>
            <stop offset="5%" stop-color="#fdf497"/>
            <stop offset="45%" stop-color="#fd5949"/>
            <stop offset="60%" stop-color="#d6249f"/>
            <stop offset="90%" stop-color="#285AEB"/>
          </radialGradient>
        </defs>
        <rect width="120" height="120" rx="28" fill="url(#ig)"/>
        <rect x="25" y="25" width="70" height="70" rx="20" fill="none" stroke="#FFFFFF" stroke-width="7.5"/>
        <circle cx="60" cy="60" r="16.5" fill="none" stroke="#FFFFFF" stroke-width="7.5"/>
        <circle cx="80" cy="40" r="4.8" fill="#FFFFFF"/>
      </svg>
    `),
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    category: 'sosmed',
    accentColor: '#000000',
    src: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <rect width="120" height="120" rx="28" fill="#09090b"/>
        <path fill="#25F4EE" d="M78 44.5c-5.9-1.2-10.3-6.1-10.8-12.2H56.5v44c0 5.4-4.4 9.7-9.8 9.7-5.4 0-9.8-4.4-9.8-9.7 0-5.4 4.4-9.7 9.8-9.7 1 0 2 .2 2.9.5V56.2c-.9-.1-1.9-.2-2.9-.2-11.3 0-20.5 9.1-20.5 20.3S35.4 96.6 46.7 96.6s20.5-9.1 20.5-20.3V54.2c4.4 3.2 9.8 5.1 15.6 5.1v-10.6c-1.6 0-3.3-.1-4.8-.2z" transform="translate(-2.5, -2)"/>
        <path fill="#FE2C55" d="M80.5 46.5c-5.9-1.2-10.3-6.1-10.8-12.2H59v44c0 5.4-4.4 9.7-9.8 9.7-5.4 0-9.8-4.4-9.8-9.7 0-5.4 4.4-9.7 9.8-9.7 1 0 2 .2 2.9.5V58.2c-.9-.1-1.9-.2-2.9-.2-11.3 0-20.5 9.1-20.5 20.3S37.9 98.6 49.2 98.6s20.5-9.1 20.5-20.3V56.2c4.4 3.2 9.8 5.1 15.6 5.1V50.7c-1.6 0-3.3-.1-4.8-.2z"/>
        <path fill="#FFFFFF" d="M79 45.5c-5.9-1.2-10.3-6.1-10.8-12.2H57.5v44c0 5.4-4.4 9.7-9.8 9.7-5.4 0-9.8-4.4-9.8-9.7 0-5.4 4.4-9.7 9.8-9.7 1 0 2 .2 2.9.5V57.2c-.9-.1-1.9-.2-2.9-.2-11.3 0-20.5 9.1-20.5 20.3S36.4 97.6 47.7 97.6s20.5-9.1 20.5-20.3V55.2c4.4 3.2 9.8 5.1 15.6 5.1V49.7c-1.6 0-3.3-.1-4.8-.2z"/>
      </svg>
    `),
  },
  {
    id: 'youtube',
    label: 'YouTube',
    category: 'sosmed',
    accentColor: '#FF0000',
    src: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <rect width="120" height="120" rx="28" fill="#FF0000"/>
        <path fill="#FFFFFF" d="M48 40l32 20-32 20V40z"/>
      </svg>
    `),
  },
  {
    id: 'x',
    label: 'X / Twitter',
    category: 'sosmed',
    accentColor: '#09090b',
    src: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <rect width="120" height="120" rx="28" fill="#09090b"/>
        <path fill="#FFFFFF" d="M71.9 28h11.3L58.5 56.3 87.6 92H64.8L47 68.7 26.6 92H15.3l26.5-30.3L13.8 28h23.4l16.1 21.3L71.9 28zm-4 57.2h6.3L33.7 34.5H27l40.9 50.7z"/>
      </svg>
    `),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    category: 'sosmed',
    accentColor: '#1877F2',
    src: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <rect width="120" height="120" rx="28" fill="#1877F2"/>
        <path fill="#FFFFFF" d="M74.5 64.5l2.5-16.3H61.4V37.6c0-4.5 2.2-8.8 9.2-8.8h7.1V14.9s-6.5-1.1-12.7-1.1c-12.9 0-21.4 7.8-21.4 22v12.4H29.2v16.3h14.4V106h17.8V64.5h13.1z"/>
      </svg>
    `),
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    category: 'sosmed',
    accentColor: '#0A66C2',
    src: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <rect width="120" height="120" rx="28" fill="#0A66C2"/>
        <circle cx="37" cy="36" r="8" fill="#FFFFFF"/>
        <rect x="30" y="50" width="14" height="42" rx="2" fill="#FFFFFF"/>
        <path fill="#FFFFFF" d="M67 50v6c2.8-4.4 7.8-7.2 14.2-7.2 10.2 0 16.8 6.7 16.8 18.8V92H84V70.4c0-5.8-2.4-9.2-7.4-9.2-5.2 0-8.6 3.5-8.6 9.2V92H54V50h13z"/>
      </svg>
    `),
  },
  {
    id: 'telegram',
    label: 'Telegram',
    category: 'sosmed',
    accentColor: '#229ED9',
    src: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <rect width="120" height="120" rx="28" fill="#229ED9"/>
        <path fill="#FFFFFF" d="M88.8 32.3L23.5 57.5c-4.4 1.8-4.4 4.3-.8 5.4l16.8 5.2 38.8-24.5c1.8-1.1 3.5-.5 2.1.8L49 72.7l-1.2 17.5c1.7 0 2.5-.8 3.5-1.7l8.4-8.1 17.4 12.8c3.2 1.8 5.5.9 6.3-2.9l11.4-53.8c1.1-4.7-1.8-6.8-6-4.2z"/>
      </svg>
    `),
  },

  // 3. EKOSISTEM GOOGLE & AI
  {
    id: 'gmaps',
    label: 'Google Maps',
    category: 'google',
    accentColor: '#EA4335',
    src: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <rect width="120" height="120" rx="28" fill="#FFFFFF"/>
        <path fill="#EA4335" d="M60 18c-17.7 0-32 14.3-32 32 0 22.5 28.2 50.2 30.1 52 1.1 1 2.7 1 3.8 0C63.8 100.2 92 72.5 92 50c0-17.7-14.3-32-32-32z"/>
        <path fill="#34A853" d="M60 18c-17.7 0-32 14.3-32 32 0 8.2 3.1 16.8 8.3 25L79 31.3C73.7 23.2 67.2 18 60 18z"/>
        <path fill="#4285F4" d="M84.5 38.2L44.2 84.5C51.8 93.8 58.8 100.8 60 102c1.9-1.8 32-29.5 32-52 0-4.2-.8-8.2-2.5-11.8z"/>
        <path fill="#FBBC05" d="M36.3 75c2.5 3.4 5.2 6.6 7.9 9.5l40.3-46.3c-1.4-2.5-3.3-4.8-5.5-6.9L36.3 75z"/>
        <circle cx="60" cy="50" r="13" fill="#FFFFFF"/>
      </svg>
    `),
  },
  {
    id: 'google',
    label: 'Google',
    category: 'google',
    accentColor: '#4285F4',
    src: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <rect width="120" height="120" rx="28" fill="#FFFFFF"/>
        <path fill="#4285F4" d="M96.6 60.9c0-2.7-.2-5.3-.7-7.8H60v14.8h20.6c-.9 4.8-3.6 8.8-7.7 11.5v9.6h12.4c7.3-6.7 11.3-16.5 11.3-28.1z"/>
        <path fill="#34A853" d="M60 98c10.3 0 19-3.4 25.3-9.2L72.9 79.2c-3.4 2.3-7.8 3.7-12.9 3.7-9.9 0-18.3-6.7-21.3-15.7H25.9v9.9C32.2 89.5 45.1 98 60 98z"/>
        <path fill="#FBBC05" d="M38.7 67.2c-.8-2.3-1.2-4.7-1.2-7.2s.4-4.9 1.2-7.2v-9.9H25.9C23.3 48.1 22 53.9 22 60s1.3 11.9 3.9 17.1l12.8-9.9z"/>
        <path fill="#EA4335" d="M60 37.1c5.6 0 10.6 1.9 14.6 5.7l10.9-10.9C78.9 25.7 70.3 22 60 22 45.1 22 32.2 30.5 25.9 42.9l12.8 9.9c3-9 11.4-15.7 21.3-15.7z"/>
      </svg>
    `),
  },
  {
    id: 'gemini',
    label: 'Google Gemini AI',
    category: 'google',
    accentColor: '#4f46e5',
    src: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <defs>
          <linearGradient id="gem" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1d4ed8"/>
            <stop offset="50%" stop-color="#9333ea"/>
            <stop offset="100%" stop-color="#ec4899"/>
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="28" fill="#0f172a"/>
        <path fill="url(#gem)" d="M60 16c2.5 23.2 20.8 41.5 44 44-23.2 2.5-41.5 20.8-44 44-2.5-23.2-20.8-41.5-44-44 23.2-2.5 41.5-20.8 44-44z"/>
      </svg>
    `),
  },
  {
    id: 'gdrive',
    label: 'Google Drive',
    category: 'google',
    accentColor: '#0F9D58',
    src: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <rect width="120" height="120" rx="28" fill="#FFFFFF"/>
        <path fill="#0F9D58" d="M46.5 24L20 70l13.3 23L60 47z"/>
        <path fill="#FBBC04" d="M73.5 24H46.5l27 46h26.5z"/>
        <path fill="#4285F4" d="M33.3 93h53.4L100 70H46.5z"/>
      </svg>
    `),
  },
  {
    id: 'gforms',
    label: 'Google Forms',
    category: 'google',
    accentColor: '#673AB7',
    src: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <rect width="120" height="120" rx="28" fill="#673AB7"/>
        <rect x="32" y="22" width="56" height="76" rx="8" fill="#FFFFFF"/>
        <circle cx="44" cy="44" r="3.5" fill="#673AB7"/>
        <rect x="52" y="41" width="24" height="6" rx="3" fill="#673AB7"/>
        <circle cx="44" cy="60" r="3.5" fill="#673AB7"/>
        <rect x="52" y="57" width="24" height="6" rx="3" fill="#673AB7"/>
        <circle cx="44" cy="76" r="3.5" fill="#673AB7"/>
        <rect x="52" y="73" width="24" height="6" rx="3" fill="#673AB7"/>
      </svg>
    `),
  },
  {
    id: 'globe',
    label: 'Website / Tautan',
    category: 'umum',
    accentColor: '#E31837',
    src: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <rect width="120" height="120" rx="28" fill="#E31837"/>
        <circle cx="60" cy="60" r="32" fill="none" stroke="#FFFFFF" stroke-width="6"/>
        <ellipse cx="60" cy="60" rx="15" ry="32" fill="none" stroke="#FFFFFF" stroke-width="6"/>
        <line x1="28" y1="60" x2="92" y2="60" stroke="#FFFFFF" stroke-width="6"/>
      </svg>
    `),
  },
];
