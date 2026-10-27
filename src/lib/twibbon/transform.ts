import type { TwibbonRotation, TwibbonTransformState } from '@/types/twibbon';

export const TWIBBON_LOGICAL_WIDTH = 1080;
export const TWIBBON_LOGICAL_HEIGHT = 1080;
export const TWIBBON_MIN_ZOOM = 1;
export const TWIBBON_MAX_ZOOM = 4;

export interface EffectivePhotoMetrics {
  /** Lebar efektif sesudah rotasi 90/270 */
  effectiveWidth: number;
  /** Tinggi efektif sesudah rotasi 90/270 */
  effectiveHeight: number;
  /** Skala minimum agar foto menutup kanvas penuh (cover) */
  baseScale: number;
  /** Skala akhir s = baseScale * zoom */
  finalScale: number;
  /** Lebar ter-skala di ruang logis */
  scaledWidth: number;
  /** Tinggi ter-skala di ruang logis */
  scaledHeight: number;
  /** Batas maksimum absolut pergeseran horizontal */
  maxTx: number;
  /** Batas maksimum absolut pergeseran vertikal */
  maxTy: number;
}

export function normalizeRotation(deg: number): TwibbonRotation {
  const mod = ((Math.round(deg / 90) * 90) % 360 + 360) % 360;
  if (mod === 90 || mod === 180 || mod === 270) return mod;
  return 0;
}

export function clampZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) return TWIBBON_MIN_ZOOM;
  return Math.min(TWIBBON_MAX_ZOOM, Math.max(TWIBBON_MIN_ZOOM, zoom));
}

export function createInitialTransform(): TwibbonTransformState {
  return {
    tx: 0,
    ty: 0,
    zoom: 1,
    rotation: 0,
  };
}

/**
 * Menghitung metrik cover & batas clamp berdasarkan dimensi sumber foto yang sudah dinormalisasi EXIF.
 * Sesuai PRD Bagian 10.3:
 * - Untuk rotasi θ ∈ {0, 90, 180, 270}, tukar Iw' dan Ih' pada 90 dan 270.
 * - s0 = max(W / Iw', H / Ih')
 * - s = s0 * z dengan z ∈ [1, 4]
 * - |tx| <= (Iw' * s - W) / 2 dan |ty| <= (Ih' * s - H) / 2
 */
export function computePhotoMetrics(
  photoWidth: number,
  photoHeight: number,
  rotation: TwibbonRotation,
  zoom: number,
  canvasWidth: number = TWIBBON_LOGICAL_WIDTH,
  canvasHeight: number = TWIBBON_LOGICAL_HEIGHT
): EffectivePhotoMetrics {
  const safeW = Math.max(1, photoWidth);
  const safeH = Math.max(1, photoHeight);
  const normRot = normalizeRotation(rotation);
  const clampedZ = clampZoom(zoom);

  const isSwapped = normRot === 90 || normRot === 270;
  const effectiveWidth = isSwapped ? safeH : safeW;
  const effectiveHeight = isSwapped ? safeW : safeH;

  const baseScale = Math.max(canvasWidth / effectiveWidth, canvasHeight / effectiveHeight);
  const finalScale = baseScale * clampedZ;

  const scaledWidth = effectiveWidth * finalScale;
  const scaledHeight = effectiveHeight * finalScale;

  const maxTx = Math.max(0, (scaledWidth - canvasWidth) / 2);
  const maxTy = Math.max(0, (scaledHeight - canvasHeight) / 2);

  return {
    effectiveWidth,
    effectiveHeight,
    baseScale,
    finalScale,
    scaledWidth,
    scaledHeight,
    maxTx,
    maxTy,
  };
}

/**
 * Memastikan transformasi berada dalam batas yang sah sehingga tidak pernah ada celah kosong di kanvas.
 */
export function clampTransform(
  transform: TwibbonTransformState,
  photoWidth: number,
  photoHeight: number,
  canvasWidth: number = TWIBBON_LOGICAL_WIDTH,
  canvasHeight: number = TWIBBON_LOGICAL_HEIGHT
): TwibbonTransformState {
  const rotation = normalizeRotation(transform.rotation);
  const zoom = clampZoom(transform.zoom);
  const metrics = computePhotoMetrics(photoWidth, photoHeight, rotation, zoom, canvasWidth, canvasHeight);

  const rawTx = Number.isFinite(transform.tx) ? transform.tx : 0;
  const rawTy = Number.isFinite(transform.ty) ? transform.ty : 0;

  const tx = Math.min(metrics.maxTx, Math.max(-metrics.maxTx, rawTx));
  const ty = Math.min(metrics.maxTy, Math.max(-metrics.maxTy, rawTy));

  return {
    tx: Object.is(tx, -0) ? 0 : tx,
    ty: Object.is(ty, -0) ? 0 : ty,
    zoom,
    rotation,
  };
}

/**
 * Mengonversi delta pointer CSS (px di layar) ke delta koordinat logis (1080x1080).
 * Perubahan ukuran viewport/CSS tidak akan menggeser komposisi.
 */
export function cssDeltaToLogicalDelta(
  deltaCssX: number,
  deltaCssY: number,
  viewportCssWidth: number,
  viewportCssHeight: number,
  logicalWidth: number = TWIBBON_LOGICAL_WIDTH,
  logicalHeight: number = TWIBBON_LOGICAL_HEIGHT
): { dx: number; dy: number } {
  if (viewportCssWidth <= 0 || viewportCssHeight <= 0) {
    return { dx: 0, dy: 0 };
  }
  return {
    dx: (deltaCssX * logicalWidth) / viewportCssWidth,
    dy: (deltaCssY * logicalHeight) / viewportCssHeight,
  };
}

export function panTransform(
  transform: TwibbonTransformState,
  deltaLogicalX: number,
  deltaLogicalY: number,
  photoWidth: number,
  photoHeight: number,
  canvasWidth: number = TWIBBON_LOGICAL_WIDTH,
  canvasHeight: number = TWIBBON_LOGICAL_HEIGHT
): TwibbonTransformState {
  return clampTransform(
    {
      ...transform,
      tx: transform.tx + deltaLogicalX,
      ty: transform.ty + deltaLogicalY,
    },
    photoWidth,
    photoHeight,
    canvasWidth,
    canvasHeight
  );
}

/**
 * Mengubah zoom sambil menjaga titik relatif (default pusat kanvas) dan melakukan clamp.
 */
export function zoomTransform(
  transform: TwibbonTransformState,
  nextZoom: number,
  photoWidth: number,
  photoHeight: number,
  anchorLogicalX: number = TWIBBON_LOGICAL_WIDTH / 2,
  anchorLogicalY: number = TWIBBON_LOGICAL_HEIGHT / 2,
  canvasWidth: number = TWIBBON_LOGICAL_WIDTH,
  canvasHeight: number = TWIBBON_LOGICAL_HEIGHT
): TwibbonTransformState {
  const prevZoom = clampZoom(transform.zoom);
  const clampedNext = clampZoom(nextZoom);
  if (clampedNext === prevZoom) {
    return clampTransform(transform, photoWidth, photoHeight, canvasWidth, canvasHeight);
  }

  const ratio = clampedNext / prevZoom;
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  const relX = anchorLogicalX - centerX;
  const relY = anchorLogicalY - centerY;

  const nextTx = relX - (relX - transform.tx) * ratio;
  const nextTy = relY - (relY - transform.ty) * ratio;

  return clampTransform(
    {
      ...transform,
      zoom: clampedNext,
      tx: nextTx,
      ty: nextTy,
    },
    photoWidth,
    photoHeight,
    canvasWidth,
    canvasHeight
  );
}

/**
 * Memutar foto sebesar +90 atau -90 derajat, memutar vektor offset pusat secara konsisten,
 * lalu menghitung ulang cover & clamp sesuai PRD Bagian 10.3.
 */
export function rotateTransform90(
  transform: TwibbonTransformState,
  direction: 'cw' | 'ccw',
  photoWidth: number,
  photoHeight: number,
  canvasWidth: number = TWIBBON_LOGICAL_WIDTH,
  canvasHeight: number = TWIBBON_LOGICAL_HEIGHT
): TwibbonTransformState {
  const step = direction === 'cw' ? 90 : -90;
  const nextRotation = normalizeRotation(transform.rotation + step);

  // Rotasikan offset pusat agar bagian foto yang sedang dilihat tetap berada di dekat pusat
  const rotatedTx = direction === 'cw' ? -transform.ty : transform.ty;
  const rotatedTy = direction === 'cw' ? transform.tx : -transform.tx;

  return clampTransform(
    {
      ...transform,
      rotation: nextRotation,
      tx: rotatedTx,
      ty: rotatedTy,
    },
    photoWidth,
    photoHeight,
    canvasWidth,
    canvasHeight
  );
}
