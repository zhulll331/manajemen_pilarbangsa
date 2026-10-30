import { type QrMatrix, isFinderEyeModule } from './encoder.ts';

export type QrDotStyle = 'square' | 'rounded' | 'dots' | 'diamond' | 'classy';
export type QrEyeFrameStyle = 'square' | 'rounded' | 'circle' | 'leaf';
export type QrEyeBallStyle = 'square' | 'rounded' | 'circle' | 'diamond';
export type QrFrameStyle = 'none' | 'bottom-pill' | 'card-banner';
export type QrLogoShape = 'rounded' | 'circle' | 'square';

export interface QrDesignOptions {
  dotStyle: QrDotStyle;
  eyeFrameStyle: QrEyeFrameStyle;
  eyeBallStyle: QrEyeBallStyle;
  fgColor: string;
  useGradient: boolean;
  fgGradientEnd: string;
  bgColor: string;
  customEyeColor: boolean;
  eyeColor: string;
  logoSrc: string | null;
  logoScale: number; // 0.16 .. 0.24 (default 0.21)
  logoShape: QrLogoShape;
  logoBgWhite: boolean;
  frameStyle: QrFrameStyle;
  frameText: string;
  frameColor: string;
}

export interface QrColorPreset {
  id: string;
  name: string;
  fgColor: string;
  useGradient: boolean;
  fgGradientEnd: string;
  bgColor: string;
  customEyeColor: boolean;
  eyeColor: string;
  frameColor: string;
}

export const QR_COLOR_PRESETS: QrColorPreset[] = [
  {
    id: 'pilar-resmi',
    name: 'Pilar Bangsa Resmi',
    fgColor: '#111827',
    useGradient: false,
    fgGradientEnd: '#111827',
    bgColor: '#FFFFFF',
    customEyeColor: true,
    eyeColor: '#E31837',
    frameColor: '#E31837',
  },
  {
    id: 'merah-garuda',
    name: 'Merah Gradien UKM',
    fgColor: '#E31837',
    useGradient: true,
    fgGradientEnd: '#88081B',
    bgColor: '#FFFFFF',
    customEyeColor: true,
    eyeColor: '#008000',
    frameColor: '#E31837',
  },
  {
    id: 'klasik-hitam',
    name: 'Hitam Klasik Kontras',
    fgColor: '#09090b',
    useGradient: false,
    fgGradientEnd: '#09090b',
    bgColor: '#FFFFFF',
    customEyeColor: false,
    eyeColor: '#09090b',
    frameColor: '#09090b',
  },
  {
    id: 'hijau-zamrud',
    name: 'Hijau Emerald WA',
    fgColor: '#008000',
    useGradient: true,
    fgGradientEnd: '#064e3b',
    bgColor: '#FFFFFF',
    customEyeColor: true,
    eyeColor: '#047857',
    frameColor: '#008000',
  },
  {
    id: 'biru-kampus',
    name: 'Biru Akademik',
    fgColor: '#1d4ed8',
    useGradient: true,
    fgGradientEnd: '#1e1b4b',
    bgColor: '#FFFFFF',
    customEyeColor: true,
    eyeColor: '#E31837',
    frameColor: '#1d4ed8',
  },
  {
    id: 'gemini-ai',
    name: 'Ungu Gemini AI',
    fgColor: '#2563eb',
    useGradient: true,
    fgGradientEnd: '#db2777',
    bgColor: '#FFFFFF',
    customEyeColor: true,
    eyeColor: '#4f46e5',
    frameColor: '#4f46e5',
  },
];

export const DEFAULT_QR_DESIGN: QrDesignOptions = {
  dotStyle: 'rounded',
  eyeFrameStyle: 'rounded',
  eyeBallStyle: 'rounded',
  fgColor: '#111827',
  useGradient: false,
  fgGradientEnd: '#88081B',
  bgColor: '#FFFFFF',
  customEyeColor: true,
  eyeColor: '#E31837',
  logoSrc: '/logo_pilar.svg',
  logoScale: 0.21,
  logoShape: 'rounded',
  logoBgWhite: true,
  frameStyle: 'bottom-pill',
  frameText: 'SCAN ME • PILAR BANGSA',
  frameColor: '#E31837',
};

/**
 * Mengecek apakah modul `(x, y)` berada di zona logo tengah yang harus dikosongkan.
 */
export function isModuleInLogoCutout(
  x: number,
  y: number,
  matrixSize: number,
  hasLogo: boolean,
  logoScale: number
): boolean {
  if (!hasLogo) return false;
  if (isFinderEyeModule(x, y, matrixSize)) return false;

  const clampedScale = Math.min(Math.max(logoScale || 0.21, 0.14), 0.25);
  const cutoutModules = Math.ceil(matrixSize * (clampedScale + 0.04));
  const half = cutoutModules / 2;
  const center = matrixSize / 2;

  return (
    x >= Math.floor(center - half) &&
    x < Math.ceil(center + half) &&
    y >= Math.floor(center - half) &&
    y < Math.ceil(center + half)
  );
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | [number, number, number, number]
) {
  const radii =
    typeof r === 'number'
      ? [r, r, r, r]
      : r.map((v) => Math.max(0, Math.min(v, Math.min(w, h) / 2)));
  const [tl, tr, br, bl] = radii;
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

function drawFinderEyeCanvas(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  cellSize: number,
  frameStyle: QrEyeFrameStyle,
  ballStyle: QrEyeBallStyle,
  eyeFill: string | CanvasGradient,
  bgColor: string
) {
  const outerSize = cellSize * 7;
  const innerGapOffset = cellSize * 1;
  const innerGapSize = cellSize * 5;
  const ballOffset = cellSize * 2;
  const ballSize = cellSize * 3;

  ctx.save();
  ctx.fillStyle = eyeFill;

  // 1. Outer 7x7 Frame
  if (frameStyle === 'circle') {
    ctx.beginPath();
    ctx.arc(ox + outerSize / 2, oy + outerSize / 2, outerSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.arc(ox + outerSize / 2, oy + outerSize / 2, innerGapSize / 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (frameStyle === 'leaf') {
    const rBig = cellSize * 2.3;
    const rSmall = cellSize * 0.45;
    drawRoundedRectPath(ctx, ox, oy, outerSize, outerSize, [rBig, rSmall, rBig, rSmall]);
    ctx.fill();
    ctx.fillStyle = bgColor;
    drawRoundedRectPath(
      ctx,
      ox + innerGapOffset,
      oy + innerGapOffset,
      innerGapSize,
      innerGapSize,
      [cellSize * 1.6, cellSize * 0.3, cellSize * 1.6, cellSize * 0.3]
    );
    ctx.fill();
  } else {
    const rOuter = frameStyle === 'rounded' ? cellSize * 1.8 : 0;
    const rInner = frameStyle === 'rounded' ? cellSize * 1.15 : 0;
    drawRoundedRectPath(ctx, ox, oy, outerSize, outerSize, rOuter);
    ctx.fill();
    ctx.fillStyle = bgColor;
    drawRoundedRectPath(
      ctx,
      ox + innerGapOffset,
      oy + innerGapOffset,
      innerGapSize,
      innerGapSize,
      rInner
    );
    ctx.fill();
  }

  // 2. Inner 3x3 Ball
  ctx.fillStyle = eyeFill;
  const bx = ox + ballOffset;
  const by = oy + ballOffset;
  if (ballStyle === 'circle') {
    ctx.beginPath();
    ctx.arc(bx + ballSize / 2, by + ballSize / 2, ballSize / 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (ballStyle === 'diamond') {
    ctx.beginPath();
    ctx.moveTo(bx + ballSize / 2, by);
    ctx.lineTo(bx + ballSize, by + ballSize / 2);
    ctx.lineTo(bx + ballSize / 2, by + ballSize);
    ctx.lineTo(bx, by + ballSize / 2);
    ctx.closePath();
    ctx.fill();
  } else {
    const rBall = ballStyle === 'rounded' ? cellSize * 0.85 : 0;
    drawRoundedRectPath(ctx, bx, by, ballSize, ballSize, rBall);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Merender matriks QR Code beserta kustomisasi gaya, gradien, logo tengah, dan frame ke HTMLCanvasElement.
 */
export function renderQrToCanvas(
  canvas: HTMLCanvasElement,
  matrix: QrMatrix,
  options: QrDesignOptions,
  logoImage: HTMLImageElement | null,
  targetWidth: number = 1024
) {
  const hasFrame = options.frameStyle !== 'none' && options.frameText.trim().length > 0;
  const extraHeight = hasFrame ? Math.round(targetWidth * 0.14) : 0;
  const totalWidth = targetWidth;
  const totalHeight = targetWidth + extraHeight;

  canvas.width = totalWidth;
  canvas.height = totalHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();
  ctx.clearRect(0, 0, totalWidth, totalHeight);

  // Latar belakang utama
  if (options.frameStyle === 'card-banner' && hasFrame) {
    ctx.fillStyle = options.frameColor;
    drawRoundedRectPath(ctx, 0, 0, totalWidth, totalHeight, Math.round(targetWidth * 0.055));
    ctx.fill();

    const cardPad = Math.round(targetWidth * 0.032);
    ctx.fillStyle = options.bgColor;
    drawRoundedRectPath(
      ctx,
      cardPad,
      cardPad,
      totalWidth - cardPad * 2,
      targetWidth - cardPad * 1.5,
      Math.round(targetWidth * 0.04)
    );
    ctx.fill();
  } else {
    ctx.fillStyle = options.bgColor;
    drawRoundedRectPath(ctx, 0, 0, totalWidth, totalHeight, Math.round(targetWidth * 0.045));
    ctx.fill();
  }

  // Quiet zone 4 modul di sekeliling matriks QR
  const quietZoneModules = 4;
  const totalModules = matrix.size + quietZoneModules * 2;
  const cellSize = targetWidth / totalModules;
  const offsetX = quietZoneModules * cellSize;
  const offsetY = quietZoneModules * cellSize;

  // Siapkan fill utama (Solid atau Linear Gradient)
  let mainFill: string | CanvasGradient = options.fgColor;
  if (options.useGradient) {
    const grad = ctx.createLinearGradient(
      offsetX,
      offsetY,
      offsetX + matrix.size * cellSize,
      offsetY + matrix.size * cellSize
    );
    grad.addColorStop(0, options.fgColor);
    grad.addColorStop(1, options.fgGradientEnd || options.fgColor);
    mainFill = grad;
  }

  const eyeFill: string | CanvasGradient = options.customEyeColor
    ? options.eyeColor
    : mainFill;

  const hasActiveLogo = Boolean(options.logoSrc && logoImage);

  // 1. Gambar modul data & fungsi selain Finder Eye dan zona logo
  ctx.fillStyle = mainFill;
  for (let y = 0; y < matrix.size; y++) {
    for (let x = 0; x < matrix.size; x++) {
      if (!matrix.modules[y * matrix.size + x]) continue;
      if (isFinderEyeModule(x, y, matrix.size)) continue;
      if (isModuleInLogoCutout(x, y, matrix.size, hasActiveLogo, options.logoScale)) {
        continue;
      }

      const px = offsetX + x * cellSize;
      const py = offsetY + y * cellSize;

      switch (options.dotStyle) {
        case 'dots': {
          ctx.beginPath();
          ctx.arc(
            px + cellSize / 2,
            py + cellSize / 2,
            cellSize * 0.44,
            0,
            Math.PI * 2
          );
          ctx.fill();
          break;
        }
        case 'diamond': {
          const pad = cellSize * 0.04;
          ctx.beginPath();
          ctx.moveTo(px + cellSize / 2, py + pad);
          ctx.lineTo(px + cellSize - pad, py + cellSize / 2);
          ctx.lineTo(px + cellSize / 2, py + cellSize - pad);
          ctx.lineTo(px + pad, py + cellSize / 2);
          ctx.closePath();
          ctx.fill();
          break;
        }
        case 'classy': {
          drawRoundedRectPath(ctx, px, py, cellSize, cellSize, [
            cellSize * 0.42,
            0,
            cellSize * 0.42,
            0,
          ]);
          ctx.fill();
          break;
        }
        case 'rounded': {
          drawRoundedRectPath(
            ctx,
            px + cellSize * 0.04,
            py + cellSize * 0.04,
            cellSize * 0.92,
            cellSize * 0.92,
            cellSize * 0.32
          );
          ctx.fill();
          break;
        }
        case 'square':
        default: {
          ctx.fillRect(px, py, cellSize + 0.35, cellSize + 0.35);
          break;
        }
      }
    }
  }

  // 2. Gambar 3 Finder Eyes (Kiri Atas, Kanan Atas, Kiri Bawah)
  drawFinderEyeCanvas(
    ctx,
    offsetX,
    offsetY,
    cellSize,
    options.eyeFrameStyle,
    options.eyeBallStyle,
    eyeFill,
    options.bgColor
  );
  drawFinderEyeCanvas(
    ctx,
    offsetX + (matrix.size - 7) * cellSize,
    offsetY,
    cellSize,
    options.eyeFrameStyle,
    options.eyeBallStyle,
    eyeFill,
    options.bgColor
  );
  drawFinderEyeCanvas(
    ctx,
    offsetX,
    offsetY + (matrix.size - 7) * cellSize,
    cellSize,
    options.eyeFrameStyle,
    options.eyeBallStyle,
    eyeFill,
    options.bgColor
  );

  // 3. Gambar Logo di Tengah QR
  if (hasActiveLogo && logoImage) {
    const qrAreaSize = matrix.size * cellSize;
    const clampedScale = Math.min(Math.max(options.logoScale || 0.21, 0.14), 0.25);
    const badgeSize = qrAreaSize * clampedScale;
    const badgeX = offsetX + (qrAreaSize - badgeSize) / 2;
    const badgeY = offsetY + (qrAreaSize - badgeSize) / 2;
    const pad = badgeSize * 0.11;

    ctx.save();
    if (options.logoBgWhite) {
      ctx.fillStyle = options.bgColor;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
      ctx.shadowBlur = cellSize * 0.8;
      if (options.logoShape === 'circle') {
        ctx.beginPath();
        ctx.arc(
          badgeX + badgeSize / 2,
          badgeY + badgeSize / 2,
          badgeSize / 2 + pad * 0.5,
          0,
          Math.PI * 2
        );
        ctx.fill();
      } else {
        const rBadge = options.logoShape === 'rounded' ? badgeSize * 0.24 : badgeSize * 0.06;
        drawRoundedRectPath(
          ctx,
          badgeX - pad * 0.5,
          badgeY - pad * 0.5,
          badgeSize + pad,
          badgeSize + pad,
          rBadge
        );
        ctx.fill();
      }
    }

    // Clip sesuai bentuk logo
    if (options.logoShape === 'circle') {
      ctx.beginPath();
      ctx.arc(badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2, 0, Math.PI * 2);
      ctx.clip();
    } else if (options.logoShape === 'rounded') {
      drawRoundedRectPath(ctx, badgeX, badgeY, badgeSize, badgeSize, badgeSize * 0.2);
      ctx.clip();
    }

    ctx.shadowColor = 'transparent';
    ctx.drawImage(logoImage, badgeX, badgeY, badgeSize, badgeSize);
    ctx.restore();
  }

  // 4. Gambar Call-to-Action Frame / Pita Bawah
  if (hasFrame) {
    const labelText = options.frameText.trim().slice(0, 36);
    const centerY = targetWidth + extraHeight * 0.42;

    if (options.frameStyle === 'bottom-pill') {
      const pillW = Math.min(totalWidth * 0.84, Math.max(totalWidth * 0.48, labelText.length * (targetWidth * 0.025) + targetWidth * 0.12));
      const pillH = extraHeight * 0.64;
      const pillX = (totalWidth - pillW) / 2;
      const pillY = centerY - pillH / 2;

      ctx.fillStyle = options.frameColor;
      drawRoundedRectPath(ctx, pillX, pillY, pillW, pillH, pillH / 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `800 ${Math.round(targetWidth * 0.036)}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, totalWidth / 2, pillY + pillH / 2 + 1);
    } else if (options.frameStyle === 'card-banner') {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `800 ${Math.round(targetWidth * 0.04)}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, totalWidth / 2, targetWidth + extraHeight * 0.45);
    }
  }

  ctx.restore();
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Menghasilkan dokumen SVG vektor murni dari matriks QR Code & opsi desain.
 */
export function renderQrToSvgString(
  matrix: QrMatrix,
  options: QrDesignOptions,
  embeddedLogoDataUri: string | null
): string {
  const targetWidth = 1024;
  const hasFrame = options.frameStyle !== 'none' && options.frameText.trim().length > 0;
  const extraHeight = hasFrame ? Math.round(targetWidth * 0.14) : 0;
  const totalWidth = targetWidth;
  const totalHeight = targetWidth + extraHeight;

  const quietZoneModules = 4;
  const totalModules = matrix.size + quietZoneModules * 2;
  const cellSize = targetWidth / totalModules;
  const offsetX = quietZoneModules * cellSize;
  const offsetY = quietZoneModules * cellSize;

  const mainFillRef = options.useGradient ? 'url(#qrMainGrad)' : options.fgColor;
  const eyeFillRef = options.customEyeColor ? options.eyeColor : mainFillRef;
  const logoHref = embeddedLogoDataUri || options.logoSrc;
  const hasActiveLogo = Boolean(logoHref);

  const dotElements: string[] = [];
  for (let y = 0; y < matrix.size; y++) {
    for (let x = 0; x < matrix.size; x++) {
      if (!matrix.modules[y * matrix.size + x]) continue;
      if (isFinderEyeModule(x, y, matrix.size)) continue;
      if (isModuleInLogoCutout(x, y, matrix.size, hasActiveLogo, options.logoScale)) {
        continue;
      }

      const px = offsetX + x * cellSize;
      const py = offsetY + y * cellSize;

      if (options.dotStyle === 'dots') {
        dotElements.push(
          `<circle cx="${(px + cellSize / 2).toFixed(2)}" cy="${(py + cellSize / 2).toFixed(2)}" r="${(cellSize * 0.44).toFixed(2)}" />`
        );
      } else if (options.dotStyle === 'diamond') {
        const cx = (px + cellSize / 2).toFixed(2);
        const cy = (py + cellSize / 2).toFixed(2);
        const top = (py + cellSize * 0.04).toFixed(2);
        const right = (px + cellSize * 0.96).toFixed(2);
        const bottom = (py + cellSize * 0.96).toFixed(2);
        const left = (px + cellSize * 0.04).toFixed(2);
        dotElements.push(`<polygon points="${cx},${top} ${right},${cy} ${cx},${bottom} ${left},${cy}" />`);
      } else if (options.dotStyle === 'rounded' || options.dotStyle === 'classy') {
        const r = (cellSize * 0.32).toFixed(2);
        dotElements.push(
          `<rect x="${(px + cellSize * 0.04).toFixed(2)}" y="${(py + cellSize * 0.04).toFixed(2)}" width="${(cellSize * 0.92).toFixed(2)}" height="${(cellSize * 0.92).toFixed(2)}" rx="${r}" />`
        );
      } else {
        dotElements.push(
          `<rect x="${px.toFixed(2)}" y="${py.toFixed(2)}" width="${(cellSize + 0.3).toFixed(2)}" height="${(cellSize + 0.3).toFixed(2)}" />`
        );
      }
    }
  }

  const buildFinderEyeSvg = (ox: number, oy: number) => {
    const outerSize = cellSize * 7;
    const innerOffset = cellSize * 1;
    const innerSize = cellSize * 5;
    const ballOffset = cellSize * 2;
    const ballSize = cellSize * 3;
    const rOuter =
      options.eyeFrameStyle === 'circle'
        ? outerSize / 2
        : options.eyeFrameStyle === 'rounded' || options.eyeFrameStyle === 'leaf'
        ? cellSize * 1.8
        : 0;
    const rInner =
      options.eyeFrameStyle === 'circle'
        ? innerSize / 2
        : options.eyeFrameStyle === 'rounded' || options.eyeFrameStyle === 'leaf'
        ? cellSize * 1.15
        : 0;
    const rBall =
      options.eyeBallStyle === 'circle'
        ? ballSize / 2
        : options.eyeBallStyle === 'rounded'
        ? cellSize * 0.85
        : 0;

    return `
      <g>
        <rect x="${ox.toFixed(2)}" y="${oy.toFixed(2)}" width="${outerSize.toFixed(2)}" height="${outerSize.toFixed(2)}" rx="${rOuter.toFixed(2)}" fill="${eyeFillRef}" />
        <rect x="${(ox + innerOffset).toFixed(2)}" y="${(oy + innerOffset).toFixed(2)}" width="${innerSize.toFixed(2)}" height="${innerSize.toFixed(2)}" rx="${rInner.toFixed(2)}" fill="${options.bgColor}" />
        <rect x="${(ox + ballOffset).toFixed(2)}" y="${(oy + ballOffset).toFixed(2)}" width="${ballSize.toFixed(2)}" height="${ballSize.toFixed(2)}" rx="${rBall.toFixed(2)}" fill="${eyeFillRef}" />
      </g>
    `;
  };

  const qrAreaSize = matrix.size * cellSize;
  const clampedScale = Math.min(Math.max(options.logoScale || 0.21, 0.14), 0.25);
  const badgeSize = qrAreaSize * clampedScale;
  const badgeX = offsetX + (qrAreaSize - badgeSize) / 2;
  const badgeY = offsetY + (qrAreaSize - badgeSize) / 2;
  const pad = badgeSize * 0.11;
  const badgeRx =
    options.logoShape === 'circle'
      ? (badgeSize + pad) / 2
      : options.logoShape === 'rounded'
      ? badgeSize * 0.22
      : badgeSize * 0.06;

  const labelText = escapeXml(options.frameText.trim().slice(0, 36));
  const pillW = Math.min(
    totalWidth * 0.84,
    Math.max(totalWidth * 0.48, options.frameText.trim().length * (targetWidth * 0.025) + targetWidth * 0.12)
  );
  const pillH = extraHeight * 0.64;
  const pillX = (totalWidth - pillW) / 2;
  const pillY = targetWidth + extraHeight * 0.42 - pillH / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">
  <defs>
    ${
      options.useGradient
        ? `<linearGradient id="qrMainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${options.fgColor}" />
      <stop offset="100%" stop-color="${options.fgGradientEnd || options.fgColor}" />
    </linearGradient>`
        : ''
    }
  </defs>
  ${
    options.frameStyle === 'card-banner' && hasFrame
      ? `<rect width="${totalWidth}" height="${totalHeight}" rx="${Math.round(targetWidth * 0.055)}" fill="${options.frameColor}" />
         <rect x="${Math.round(targetWidth * 0.032)}" y="${Math.round(targetWidth * 0.032)}" width="${totalWidth - Math.round(targetWidth * 0.032) * 2}" height="${targetWidth - Math.round(targetWidth * 0.048)}" rx="${Math.round(targetWidth * 0.04)}" fill="${options.bgColor}" />`
      : `<rect width="${totalWidth}" height="${totalHeight}" rx="${Math.round(targetWidth * 0.045)}" fill="${options.bgColor}" />`
  }
  <g fill="${mainFillRef}">
    ${dotElements.join('\n    ')}
  </g>
  ${buildFinderEyeSvg(offsetX, offsetY)}
  ${buildFinderEyeSvg(offsetX + (matrix.size - 7) * cellSize, offsetY)}
  ${buildFinderEyeSvg(offsetX, offsetY + (matrix.size - 7) * cellSize)}
  ${
    hasActiveLogo && logoHref
      ? `<g>
          ${
            options.logoBgWhite
              ? `<rect x="${(badgeX - pad * 0.5).toFixed(2)}" y="${(badgeY - pad * 0.5).toFixed(2)}" width="${(badgeSize + pad).toFixed(2)}" height="${(badgeSize + pad).toFixed(2)}" rx="${badgeRx.toFixed(2)}" fill="${options.bgColor}" />`
              : ''
          }
          <image href="${escapeXml(logoHref)}" x="${badgeX.toFixed(2)}" y="${badgeY.toFixed(2)}" width="${badgeSize.toFixed(2)}" height="${badgeSize.toFixed(2)}" preserveAspectRatio="xMidYMid meet" />
        </g>`
      : ''
  }
  ${
    hasFrame && options.frameStyle === 'bottom-pill'
      ? `<g>
          <rect x="${pillX.toFixed(2)}" y="${pillY.toFixed(2)}" width="${pillW.toFixed(2)}" height="${pillH.toFixed(2)}" rx="${(pillH / 2).toFixed(2)}" fill="${options.frameColor}" />
          <text x="${totalWidth / 2}" y="${(pillY + pillH * 0.64).toFixed(2)}" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.round(targetWidth * 0.036)}" font-weight="800" text-anchor="middle">${labelText}</text>
        </g>`
      : hasFrame && options.frameStyle === 'card-banner'
      ? `<text x="${totalWidth / 2}" y="${Math.round(targetWidth + extraHeight * 0.56)}" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.round(targetWidth * 0.04)}" font-weight="800" text-anchor="middle">${labelText}</text>`
      : ''
  }
</svg>`;
}
