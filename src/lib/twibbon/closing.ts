/**
 * Penutupan otomatis kampanye Twibbon setelah batas kegiatan.
 *
 * Aturan:
 * - Kampanye yang tertaut ke kegiatan akan ditutup ketika waktu sekarang melewati
 *   batas akhir kegiatan (`ends_at`). Bila `ends_at` kosong, batas adalah akhir
 *   hari (23:59:59 WIB) dari tanggal mulai kegiatan.
 * - Admin Humas dapat memperpanjang dengan `extended_until`. Batas efektif adalah
 *   nilai terbesar antara batas kegiatan dan `extended_until`.
 * - Kampanye tanpa kegiatan dan tanpa perpanjangan tidak pernah ditutup otomatis.
 */

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

function parseTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : t;
}

/** Akhir hari WIB (23:59:59.999) dari sebuah timestamp, dalam epoch ms. */
export function endOfWibDayMs(startMs: number): number {
  const wibShifted = startMs + WIB_OFFSET_MS;
  const dayStart = Math.floor(wibShifted / 86_400_000) * 86_400_000;
  return dayStart + 86_400_000 - 1 - WIB_OFFSET_MS;
}

export function computeEventCloseMs(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined
): number | null {
  const end = parseTime(endsAt);
  if (end !== null) return end;
  const start = parseTime(startsAt);
  if (start !== null) return endOfWibDayMs(start);
  return null;
}

/** Batas penutupan efektif (ISO) atau null bila tidak pernah menutup otomatis. */
export function computeEffectiveCloseAt(params: {
  startsAt?: string | null;
  endsAt?: string | null;
  extendedUntil?: string | null;
}): string | null {
  const eventClose = computeEventCloseMs(params.startsAt, params.endsAt);
  const extended = parseTime(params.extendedUntil);
  if (eventClose === null && extended === null) return null;
  const effective = Math.max(eventClose ?? -Infinity, extended ?? -Infinity);
  return new Date(effective).toISOString();
}

export function isTwibbonAutoClosed(
  params: {
    startsAt?: string | null;
    endsAt?: string | null;
    extendedUntil?: string | null;
    hasEvent: boolean;
  },
  now: Date = new Date()
): boolean {
  // Tanpa kegiatan tertaut: tidak ada batas otomatis.
  if (!params.hasEvent) return false;
  const closeAt = computeEffectiveCloseAt(params);
  if (closeAt === null) return false;
  return now.getTime() > Date.parse(closeAt);
}

