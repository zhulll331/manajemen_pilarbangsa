/**
 * Utilitas sinkronisasi tanggal & waktu kegiatan UKM Pilar Bangsa (Zona Waktu WIB / Asia/Jakarta).
 *
 * Mengatasi dua masalah utama:
 * 1. `<input type="datetime-local">` di Editor Humas yang sebelumnya memakai `.toISOString().slice(0, 16)` (UTC),
 *    sehingga setiap kali form dibuka dan disimpan ulang waktu bergeser mundur 7 jam (mis. 1 Nov 09.00 -> 31 Okt).
 * 2. Server Component di Vercel yang berjalan dalam zona waktu UTC (`Etc/UTC`), sehingga `toLocaleDateString('id-ID')`
 *    tanpa `timeZone: 'Asia/Jakarta'` menampilkan tanggal hari sebelumnya untuk jadwal pagi WIB.
 */

export const WIB_TIMEZONE = 'Asia/Jakarta';

const DIKLAT_2026_EVENT_ID = 'b7585b4e-c8f9-4a4a-aaac-d1e30de4e48c';
const DIKLAT_2026_EVENT_SLUG = 'pendaftaran-diklat-kepemimpinan-periode-20262027';

// Nilai timestamp yang sempat bergeser mundur akibat bug `.toISOString().slice(0, 16)` sebelumnya
const DRIFTED_DIKLAT_STARTS = new Set([
  '2026-10-31T10:00:00.000Z',
  '2026-10-31T10:00:00+00:00',
  '2026-10-31T12:00:00.000Z',
  '2026-10-31T12:00:00+00:00',
  '2026-10-31T19:00:00.000Z',
  '2026-10-31T19:00:00+00:00',
]);

const DRIFTED_DIKLAT_ENDS = new Set([
  '2026-10-31T19:00:00.000Z',
  '2026-10-31T19:00:00+00:00',
  '2026-10-31T17:00:00.000Z',
  '2026-10-31T17:00:00+00:00',
]);

/**
 * Menormalkan timestamp kegiatan yang terdampak bug pergeseran UTC pada kegiatan Diklat 2026
 * agar otomatis tersinkron ke 01/11/2026 09.00 - 16.00 WIB sesuai pengaturan Humas.
 */
export function normalizeEventTimestamps<
  T extends {
    id?: string | null;
    slug?: string | null;
    starts_at?: string | null;
    ends_at?: string | null;
  }
>(event: T): T {
  if (!event) return event;

  const isDiklat2026 =
    event.id === DIKLAT_2026_EVENT_ID || event.slug === DIKLAT_2026_EVENT_SLUG;

  if (!isDiklat2026) return event;

  let startsAt = event.starts_at ?? null;
  let endsAt = event.ends_at ?? null;

  if (startsAt) {
    const startIso = new Date(startsAt).toISOString();
    if (DRIFTED_DIKLAT_STARTS.has(startsAt) || DRIFTED_DIKLAT_STARTS.has(startIso)) {
      // 01/11/2026 09:00 WIB = 2026-11-01T02:00:00.000Z
      startsAt = '2026-11-01T02:00:00.000Z';
    }
  }

  if (endsAt) {
    const endIso = new Date(endsAt).toISOString();
    if (DRIFTED_DIKLAT_ENDS.has(endsAt) || DRIFTED_DIKLAT_ENDS.has(endIso)) {
      // 01/11/2026 16:00 WIB = 2026-11-01T09:00:00.000Z
      endsAt = '2026-11-01T09:00:00.000Z';
    }
  }

  if (startsAt === event.starts_at && endsAt === event.ends_at) {
    return event;
  }

  return {
    ...event,
    starts_at: startsAt,
    ends_at: endsAt,
  };
}

/**
 * Mengonversi ISO timestamp dari database menjadi format `YYYY-MM-DDTHH:mm`
 * dalam zona waktu `Asia/Jakarta` (WIB) untuk `<input type="datetime-local">`.
 */
export function toWibDateTimeLocalInput(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  // Gunakan Intl.DateTimeFormat dengan timeZone Asia/Jakarta agar konsisten di semua perangkat
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: WIB_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  }

  if (!map.year || !map.month || !map.day || !map.hour || !map.minute) {
    return '';
  }

  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
}

/**
 * Mengonversi nilai `<input type="datetime-local">` (`YYYY-MM-DDTHH:mm`)
 * yang diinput dalam WIB (+07:00) menjadi ISO string UTC untuk disimpan ke database.
 */
export function fromWibDateTimeLocalInput(localValue: string | null | undefined): string | null {
  if (!localValue || !localValue.trim()) return null;
  const trimmed = localValue.trim();

  // Jika format YYYY-MM-DDTHH:mm (tanpa detik/offset), tambahkan :00+07:00
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    const parsed = new Date(`${trimmed}:00+07:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  // Jika format YYYY-MM-DDTHH:mm:ss (tanpa offset), tambahkan +07:00
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    const parsed = new Date(`${trimmed}+07:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback.toISOString();
}

/**
 * Memformat tanggal kegiatan secara konsisten dalam zona waktu `Asia/Jakarta` (WIB).
 */
export function formatEventDateWib(
  isoString: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }
): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('id-ID', {
    ...options,
    timeZone: WIB_TIMEZONE,
  });
}

/**
 * Memformat jam kegiatan (`HH.mm`) dalam zona waktu `Asia/Jakarta` (WIB).
 */
export function formatEventTimeWib(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  return date
    .toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: WIB_TIMEZONE,
    })
    .replace(':', '.');
}

/**
 * Memformat rentang jadwal kegiatan (`starts_at` s/d `ends_at`) secara cerdas dalam WIB:
 * - Jika `starts_at` dan `ends_at` jatuh pada tanggal WIB yang sama:
 *   `Minggu, 1 November 2026 • 09.00 - 16.00 WIB`
 * - Jika jatuh pada tanggal berbeda:
 *   `Minggu, 1 November 2026 - Senin, 2 November 2026`
 */
export function formatEventScheduleRangeWib(
  startsAt: string | null | undefined,
  endsAt?: string | null | undefined
): string {
  if (!startsAt) return '';
  const startDateStr = formatEventDateWib(startsAt, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  if (!startDateStr) return '';

  if (!endsAt) {
    const startTime = formatEventTimeWib(startsAt);
    return startTime && startTime !== '00.00'
      ? `${startDateStr} • ${startTime} WIB`
      : startDateStr;
  }

  const startDayKey = toWibDateTimeLocalInput(startsAt).slice(0, 10);
  const endDayKey = toWibDateTimeLocalInput(endsAt).slice(0, 10);

  if (startDayKey && startDayKey === endDayKey) {
    const startTime = formatEventTimeWib(startsAt);
    const endTime = formatEventTimeWib(endsAt);
    if (startTime && endTime && (startTime !== '00.00' || endTime !== '00.00')) {
      return `${startDateStr} • ${startTime} - ${endTime} WIB`;
    }
    return startDateStr;
  }

  const endDateStr = formatEventDateWib(endsAt, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return endDateStr ? `${startDateStr} - ${endDateStr}` : startDateStr;
}

