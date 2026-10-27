import test from 'node:test';
import assert from 'node:assert/strict';

import {
  detectImageFormat,
  parseImageHeader,
  getExifNormalizedDimensions,
  computeWorkingDimensions,
} from '../src/lib/twibbon/exif.ts';
import {
  createInitialTransform,
  computePhotoMetrics,
  clampTransform,
  cssDeltaToLogicalDelta,
  panTransform,
  zoomTransform,
  rotateTransform90,
} from '../src/lib/twibbon/transform.ts';
import {
  validateCaptionTemplates,
  renderParticipantCaption,
  extractCaptionTokens,
  detectSquareBracketPlaceholders,
  DEFAULT_DIKLAT_CAPTION_UMUM,
  DEFAULT_DIKLAT_CAPTION_PERSONAL,
} from '../src/lib/twibbon/caption.ts';
import {
  validateParticipantPhotoBytes,
  validateParticipantDimensions,
  validateAdminFrameHeader,
  analyzeFrameRgbaPixels,
  validateCampaignSlug,
  validateAdminCampaignFields,
  PARTICIPANT_MAX_BYTES,
  ADMIN_FRAME_MAX_BYTES,
} from '../src/lib/twibbon/validation.ts';
import {
  applyExifContextTransform,
  renderTwibbonComposite,
} from '../src/lib/twibbon/renderer.ts';

function makePngHeaderBytes(width, height, includeAcTL = false) {
  const chunks = [];
  // PNG Signature
  chunks.push(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

  // IHDR chunk (length 13)
  const ihdr = new Uint8Array(4 + 4 + 13 + 4);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, 13, false);
  ihdr.set([0x49, 0x48, 0x44, 0x52], 4); // 'IHDR'
  view.setUint32(8, width, false);
  view.setUint32(12, height, false);
  ihdr[16] = 8; // bit depth
  ihdr[17] = 6; // RGBA
  chunks.push(ihdr);

  if (includeAcTL) {
    const actl = new Uint8Array(4 + 4 + 8 + 4);
    const actlView = new DataView(actl.buffer);
    actlView.setUint32(0, 8, false);
    actl.set([0x61, 0x63, 0x54, 0x4c], 4); // 'acTL'
    chunks.push(actl);
  }

  // IDAT marker
  const idat = new Uint8Array([0, 0, 0, 0, 0x49, 0x44, 0x41, 0x54, 0, 0, 0, 0]);
  chunks.push(idat);

  const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
  const out = new Uint8Array(totalLen);
  let pos = 0;
  for (const c of chunks) {
    out.set(c, pos);
    pos += c.length;
  }
  return out;
}

function makeJpegWithExifBytes(width, height, orientation = 1, littleEndian = true) {
  // SOI + APP1 (Exif) + SOF0
  const buf = new Uint8Array(128);
  const view = new DataView(buf.buffer);
  buf[0] = 0xff;
  buf[1] = 0xd8; // SOI

  // APP1 marker at offset 2
  buf[2] = 0xff;
  buf[3] = 0xe1;
  view.setUint16(4, 38, false); // length of APP1 segment
  // 'Exif\0\0' at 6..11
  buf.set([0x45, 0x78, 0x69, 0x66, 0x00, 0x00], 6);

  // TIFF header starts at 12
  const tiff = 12;
  if (littleEndian) {
    buf.set([0x49, 0x49], tiff); // 'II'
  } else {
    buf.set([0x4d, 0x4d], tiff); // 'MM'
  }
  view.setUint16(tiff + 2, 0x002a, littleEndian);
  view.setUint32(tiff + 4, 8, littleEndian); // IFD0 offset = 8 (starts at 20)

  const ifd0 = tiff + 8;
  view.setUint16(ifd0, 1, littleEndian); // 1 entry
  view.setUint16(ifd0 + 2, 0x0112, littleEndian); // Orientation tag
  view.setUint16(ifd0 + 4, 3, littleEndian); // SHORT
  view.setUint32(ifd0 + 6, 1, littleEndian); // count = 1
  view.setUint16(ifd0 + 10, orientation, littleEndian); // value

  // SOF0 marker at offset 2 + 2 + 38 = 42
  const sof = 42;
  buf[sof] = 0xff;
  buf[sof + 1] = 0xc0;
  view.setUint16(sof + 2, 11, false);
  buf[sof + 4] = 8; // precision
  view.setUint16(sof + 5, height, false);
  view.setUint16(sof + 7, width, false);

  return buf;
}

test('T03 & T05: portrait, landscape, and square photos cover 1080x1080 and clamp pan at all 90-degree rotations and zooms', () => {
  const cases = [
    { w: 800, h: 1600, label: 'portrait' },
    { w: 1920, h: 1080, label: 'landscape' },
    { w: 1080, h: 1080, label: 'square' },
  ];

  for (const c of cases) {
    for (const rotation of [0, 90, 180, 270]) {
      for (const zoom of [1, 2.5, 4]) {
        const metrics = computePhotoMetrics(c.w, c.h, rotation, zoom);
        assert.ok(
          metrics.scaledWidth >= 1080 - 1e-6,
          `${c.label} rot=${rotation} z=${zoom} scaledWidth must cover 1080`
        );
        assert.ok(
          metrics.scaledHeight >= 1080 - 1e-6,
          `${c.label} rot=${rotation} z=${zoom} scaledHeight must cover 1080`
        );

        // Extreme pan must be clamped so edges never leave the [0..1080] canvas
        const clampedPos = clampTransform({ tx: 99999, ty: -99999, zoom, rotation }, c.w, c.h);
        assert.equal(clampedPos.tx, metrics.maxTx);
        assert.equal(clampedPos.ty, -metrics.maxTy || 0);

        const leftEdge = 540 + clampedPos.tx - metrics.scaledWidth / 2;
        const rightEdge = 540 + clampedPos.tx + metrics.scaledWidth / 2;
        const topEdge = 540 + clampedPos.ty - metrics.scaledHeight / 2;
        const bottomEdge = 540 + clampedPos.ty + metrics.scaledHeight / 2;

        assert.ok(leftEdge <= 1e-6, 'left edge covers x=0');
        assert.ok(rightEdge >= 1080 - 1e-6, 'right edge covers x=1080');
        assert.ok(topEdge <= 1e-6, 'top edge covers y=0');
        assert.ok(bottomEdge >= 1080 - 1e-6, 'bottom edge covers y=1080');
      }
    }
  }
});

test('T04: JPEG EXIF orientations 1..8 are parsed accurately and normalized once without double rotation', () => {
  for (let orient = 1; orient <= 8; orient++) {
    const bytesLE = makeJpegWithExifBytes(1600, 1200, orient, true);
    const bytesBE = makeJpegWithExifBytes(1600, 1200, orient, false);

    const parsedLE = parseImageHeader(bytesLE);
    const parsedBE = parseImageHeader(bytesBE);

    assert.equal(parsedLE.format, 'jpeg');
    assert.equal(parsedLE.exifOrientation, orient);
    assert.equal(parsedBE.exifOrientation, orient);

    const norm = getExifNormalizedDimensions(1600, 1200, orient);
    if (orient >= 5 && orient <= 8) {
      assert.deepEqual(norm, { width: 1200, height: 1600 });
    } else {
      assert.deepEqual(norm, { width: 1600, height: 1200 });
    }

    // Verify matrix call on a mock context
    let appliedMatrix = null;
    const mockCtx = {
      transform: (...args) => {
        appliedMatrix = args;
      },
    };
    applyExifContextTransform(mockCtx, orient, 1600, 1200);
    assert.equal(appliedMatrix.length, 6);
  }
});

test('T05 & T07: rotateTransform90, zoomTransform, and cssDeltaToLogicalDelta preserve composition across viewport resizes', () => {
  // Dragging 10% of a 320px mobile screen == dragging 10% of a 540px desktop preview == 108 logical pixels
  const mobileDelta = cssDeltaToLogicalDelta(32, -16, 320, 320);
  const desktopDelta = cssDeltaToLogicalDelta(54, -27, 540, 540);
  assert.deepEqual(mobileDelta, { dx: 108, dy: -54 });
  assert.deepEqual(desktopDelta, { dx: 108, dy: -54 });

  // Rotate 4 times returns to 0 deg
  let state = createInitialTransform();
  state = zoomTransform(state, 2, 1200, 1600);
  state = panTransform(state, 100, 50, 1200, 1600);
  for (let i = 0; i < 4; i++) {
    state = rotateTransform90(state, 'cw', 1200, 1600);
  }
  assert.equal(state.rotation, 0);
  assert.equal(state.zoom, 2);
});

test('T09: renderTwibbonComposite uses identical logical transform geometry on preview (360x360) and export (1080x1080)', () => {
  const calls360 = [];
  const calls1080 = [];

  const createRecorderCtx = (log) => ({
    imageSmoothingEnabled: false,
    imageSmoothingQuality: 'low',
    fillStyle: '',
    save: () => log.push(['save']),
    restore: () => log.push(['restore']),
    setTransform: (...a) => log.push(['setTransform', ...a]),
    fillRect: (...a) => log.push(['fillRect', ...a]),
    translate: (...a) => log.push(['translate', ...a]),
    rotate: (...a) => log.push(['rotate', ...a]),
    scale: (...a) => log.push(['scale', ...a]),
    drawImage: (_img, ...a) => log.push(['drawImage', ...a]),
  });

  const transform = { tx: 75, ty: -120, zoom: 1.8, rotation: 90 };
  const fakePhoto = {};
  const fakeFrame = {};

  renderTwibbonComposite({
    ctx: createRecorderCtx(calls360),
    photo: fakePhoto,
    photoWidth: 1600,
    photoHeight: 1200,
    frame: fakeFrame,
    transform,
    targetWidth: 360,
    targetHeight: 360,
  });

  renderTwibbonComposite({
    ctx: createRecorderCtx(calls1080),
    photo: fakePhoto,
    photoWidth: 1600,
    photoHeight: 1200,
    frame: fakeFrame,
    transform,
    targetWidth: 1080,
    targetHeight: 1080,
  });

  const translate360 = calls360.find((c) => c[0] === 'translate');
  const translate1080 = calls1080.find((c) => c[0] === 'translate');
  const scale360 = calls360.find((c) => c[0] === 'scale');
  const scale1080 = calls1080.find((c) => c[0] === 'scale');

  // Preview 360 is exactly 1/3 of Export 1080
  assert.ok(Math.abs(translate360[1] * 3 - translate1080[1]) < 1e-6);
  assert.ok(Math.abs(translate360[2] * 3 - translate1080[2]) < 1e-6);
  assert.ok(Math.abs(scale360[1] * 3 - scale1080[1]) < 1e-6);
});

test('T12 & T13: participant photo validation enforces size, format, animation, dimension bounds, low-res warning, and 2560px downscale', () => {
  // Oversized > 15 MiB
  const overBytes = validateParticipantPhotoBytes(new Uint8Array(16), PARTICIPANT_MAX_BYTES + 1);
  assert.equal(overBytes.valid, false);
  assert.equal(overBytes.errorCode, 'FILE_TOO_LARGE');

  // Animated PNG rejected
  const apngBytes = makePngHeaderBytes(1080, 1080, true);
  const apngRes = validateParticipantPhotoBytes(apngBytes);
  assert.equal(apngRes.valid, false);
  assert.equal(apngRes.errorCode, 'ANIMATED_NOT_SUPPORTED');

  // Fake extension / SVG rejected
  const svgBytes = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  assert.equal(detectImageFormat(svgBytes), 'svg');
  assert.equal(validateParticipantPhotoBytes(svgBytes).valid, false);

  // Dimension too small (< 200)
  assert.equal(validateParticipantDimensions(199, 1080, 1).valid, false);

  // Dimension too large (> 12000 or > 48 MP)
  assert.equal(validateParticipantDimensions(12001, 1000, 1).valid, false);
  assert.equal(validateParticipantDimensions(8000, 7000, 1).valid, false); // 56 MP > 48 MP

  // Low quality warning (< 1080) allowed with warning
  const lowQ = validateParticipantDimensions(720, 1280, 1);
  assert.equal(lowQ.valid, true);
  assert.equal(lowQ.lowQualityWarning, true);

  // Working dimensions capped at 2560 without upscaling smaller photos
  assert.deepEqual(computeWorkingDimensions(800, 600, 2560), {
    width: 800,
    height: 600,
    downscaled: false,
  });
  assert.deepEqual(computeWorkingDimensions(5120, 2560, 2560), {
    width: 2560,
    height: 1280,
    downscaled: true,
  });
});

test('T14: admin frame PNG validation rejects non-PNG, APNG, wrong dimensions, >5 MiB, fully opaque, and fully transparent frames', () => {
  // Over 5 MiB
  assert.equal(
    validateAdminFrameHeader(makePngHeaderBytes(1080, 1080), ADMIN_FRAME_MAX_BYTES + 1).errorCode,
    'FRAME_TOO_LARGE'
  );

  // JPEG rejected
  assert.equal(
    validateAdminFrameHeader(makeJpegWithExifBytes(1080, 1080, 1)).errorCode,
    'FRAME_NOT_PNG'
  );

  // APNG rejected
  assert.equal(
    validateAdminFrameHeader(makePngHeaderBytes(1080, 1080, true)).errorCode,
    'FRAME_ANIMATED'
  );

  // Wrong dimensions rejected
  assert.equal(
    validateAdminFrameHeader(makePngHeaderBytes(1080, 1350, false)).errorCode,
    'FRAME_WRONG_DIMENSIONS'
  );

  // Valid header
  assert.equal(validateAdminFrameHeader(makePngHeaderBytes(1080, 1080, false)).valid, true);

  // RGBA pixel analysis: 100% opaque rejected
  const totalBytes = 1080 * 1080 * 4;
  const opaqueRgba = new Uint8Array(totalBytes);
  opaqueRgba.fill(255);
  const opaqueRes = analyzeFrameRgbaPixels(opaqueRgba, 1080, 1080);
  assert.equal(opaqueRes.valid, false);
  assert.equal(opaqueRes.errorCode, 'FRAME_FULLY_OPAQUE');

  // 100% transparent rejected
  const emptyRgba = new Uint8Array(totalBytes);
  const emptyRes = analyzeFrameRgbaPixels(emptyRgba, 1080, 1080);
  assert.equal(emptyRes.valid, false);
  assert.equal(emptyRes.errorCode, 'FRAME_FULLY_TRANSPARENT');

  // Tiny transparent hole (< 5%) passes with warning
  const tinyHoleRgba = new Uint8Array(totalBytes);
  tinyHoleRgba.fill(255);
  for (let i = 0; i < 1000 * 4; i += 4) {
    tinyHoleRgba[i + 3] = 0;
  }
  const tinyRes = analyzeFrameRgbaPixels(tinyHoleRgba, 1080, 1080);
  assert.equal(tinyRes.valid, true);
  assert.equal(tinyRes.hasTransparencyWarning, true);

  // Normal frame (40% transparent window, 60% design) passes cleanly without warning
  const goodRgba = new Uint8Array(totalBytes);
  goodRgba.fill(255);
  const holePixels = Math.floor(1080 * 1080 * 0.4);
  for (let i = 0; i < holePixels * 4; i += 4) {
    goodRgba[i + 3] = 0;
  }
  const goodRes = analyzeFrameRgbaPixels(goodRgba, 1080, 1080);
  assert.equal(goodRes.valid, true);
  assert.equal(goodRes.hasTransparencyWarning, false);
});

test('T15 & T16: caption validation and local rendering handle flexible tokens (mahasiswa, siswa, custom), partial, empty, invalid syntax, and HTML safely', () => {
  // Valid default Diklat templates pass
  const validCheck = validateCaptionTemplates(
    DEFAULT_DIKLAT_CAPTION_UMUM,
    DEFAULT_DIKLAT_CAPTION_PERSONAL
  );
  assert.equal(validCheck.valid, true);

  // Flexible tokens for Mahasiswa (nama, fakultas, prodi) and Siswa (nama, asal_sekolah, kelas) pass
  const mhsTemplate = 'Kenalin, Aku {{nama}}, dari fakultas {{fakultas}}, prodi {{prodi}}.';
  assert.equal(validateCaptionTemplates(DEFAULT_DIKLAT_CAPTION_UMUM, mhsTemplate).valid, true);
  assert.deepEqual(
    extractCaptionTokens(mhsTemplate).map((t) => t.key),
    ['nama', 'fakultas', 'prodi']
  );

  // Auto-detect square-bracket placeholders like [nama fakultas] -> {{fakultas}}
  const bracketMatches = detectSquareBracketPlaceholders(
    'Kenalin, Aku {{nama}}, dari fakultas [nama fakultas], prodi {{prodi}}.'
  );
  assert.equal(bracketMatches.length, 1);
  assert.equal(bracketMatches[0].rawBracket, '[nama fakultas]');
  assert.equal(bracketMatches[0].suggestedTokenKey, 'fakultas');

  // Invalid token syntax ({{<script>}} or empty {{}}) rejected on publish
  const badToken = validateCaptionTemplates(
    DEFAULT_DIKLAT_CAPTION_UMUM,
    'Halo saya {{nama}} dengan {{<script>}}'
  );
  assert.equal(badToken.valid, false);
  assert.equal(
    validateCaptionTemplates(DEFAULT_DIKLAT_CAPTION_UMUM, 'Halo {{}}').valid,
    false
  );

  // Unbalanced braces rejected on publish
  const unbalanced = validateCaptionTemplates(
    DEFAULT_DIKLAT_CAPTION_UMUM,
    'Halo saya {{nama dari {{prodi}}'
  );
  assert.equal(unbalanced.valid, false);

  // Both filled -> uses personal template
  const full = renderParticipantCaption({
    captionDefault: DEFAULT_DIKLAT_CAPTION_UMUM,
    captionTemplate: DEFAULT_DIKLAT_CAPTION_PERSONAL,
    nama: '  Budi Santoso  ',
    prodi: ' Teknik Informatika ',
  });
  assert.equal(full.variant, 'personal');
  assert.ok(full.text.includes('Saya Budi Santoso dari Teknik Informatika'));
  assert.ok(!full.text.includes('{{'));

  // Multi-variable Siswa template (nama + asal_sekolah + kelas) rendered via values map
  const siswaCaption = renderParticipantCaption({
    captionDefault: DEFAULT_DIKLAT_CAPTION_UMUM,
    captionTemplate: 'Halo! Saya {{nama}} siswa kelas {{kelas}} dari {{asal_sekolah}}.',
    values: {
      nama: 'Siti Aminah',
      kelas: 'XII IPA 1',
      asal_sekolah: 'SMAN 1 Banyuwangi',
    },
  });
  assert.equal(siswaCaption.variant, 'personal');
  assert.equal(
    siswaCaption.text,
    'Halo! Saya Siti Aminah siswa kelas XII IPA 1 dari SMAN 1 Banyuwangi.'
  );

  // One empty -> uses default caption with zero leftover tokens
  const oneEmpty = renderParticipantCaption({
    captionDefault: DEFAULT_DIKLAT_CAPTION_UMUM,
    captionTemplate: DEFAULT_DIKLAT_CAPTION_PERSONAL,
    nama: 'Budi Santoso',
    prodi: '   ',
  });
  assert.equal(oneEmpty.variant, 'default');
  assert.equal(oneEmpty.text, DEFAULT_DIKLAT_CAPTION_UMUM);
  assert.ok(!oneEmpty.text.includes('{{'));

  // Both empty -> uses default caption
  const bothEmpty = renderParticipantCaption({
    captionDefault: DEFAULT_DIKLAT_CAPTION_UMUM,
    captionTemplate: DEFAULT_DIKLAT_CAPTION_PERSONAL,
    nama: '',
    prodi: '',
  });
  assert.equal(bothEmpty.variant, 'default');
  assert.equal(bothEmpty.text, DEFAULT_DIKLAT_CAPTION_UMUM);

  // Token injection / HTML string in nama does not expand {{prodi}} twice or execute
  const injection = renderParticipantCaption({
    captionDefault: DEFAULT_DIKLAT_CAPTION_UMUM,
    captionTemplate: 'Halo {{nama}} - {{prodi}}',
    nama: '<script>{{prodi}}</script>',
    prodi: 'Hukum',
  });
  assert.equal(injection.text, 'Halo <script>{{prodi}}</script> - Hukum');
});

test('Slug & campaign field validation enforces format, reserved words, and publish readiness', () => {
  assert.equal(validateCampaignSlug('diklat-kepemimpinan-2026').valid, true);
  assert.equal(validateCampaignSlug('admin').valid, false);
  assert.equal(validateCampaignSlug('Invalid_Slug').valid, false);

  const publishBlockedWithoutFrame = validateAdminCampaignFields({
    title: 'Twibbon Diklat Kepemimpinan 2026',
    slug: 'diklat-kepemimpinan-2026',
    description: 'Ringkasan singkat',
    captionDefault: DEFAULT_DIKLAT_CAPTION_UMUM,
    captionTemplate: DEFAULT_DIKLAT_CAPTION_PERSONAL,
    requireReadyForPublish: true,
    hasValidFrame: false,
  });
  assert.equal(publishBlockedWithoutFrame.valid, false);
});


test('T19 & T20: server-side PNG validator (validateAdminFramePngOnServer) decodes real 1080x1080 PNG IDAT stream and verifies alpha transparency', async () => {
  const { validateAdminFramePngOnServer } = await import(
    '../src/lib/twibbon/server-png-validator.ts'
  );
  const sharpMod = await import('sharp');
  const sharp = sharpMod.default || sharpMod;

  // 1. Valid 1080x1080 PNG with 50% transparent window + 50% opaque border
  const rawValid = Buffer.alloc(1080 * 1080 * 4);
  for (let i = 0; i < 1080 * 1080; i++) {
    const offset = i * 4;
    if (i < (1080 * 1080) / 2) {
      // Transparent hole
      rawValid[offset] = 0;
      rawValid[offset + 1] = 0;
      rawValid[offset + 2] = 0;
      rawValid[offset + 3] = 0;
    } else {
      // Opaque red frame
      rawValid[offset] = 227;
      rawValid[offset + 1] = 24;
      rawValid[offset + 2] = 55;
      rawValid[offset + 3] = 255;
    }
  }
  const validPngBuf = await sharp(rawValid, {
    raw: { width: 1080, height: 1080, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const resValid = await validateAdminFramePngOnServer(validPngBuf, 'image/png');
  assert.equal(resValid.valid, true);
  assert.equal(resValid.width, 1080);
  assert.equal(resValid.height, 1080);
  assert.ok(resValid.checksum && resValid.checksum.length === 64);

  // 2. 100% opaque 1080x1080 PNG rejected by server
  const rawOpaque = Buffer.alloc(1080 * 1080 * 4, 255);
  const opaquePngBuf = await sharp(rawOpaque, {
    raw: { width: 1080, height: 1080, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const resOpaque = await validateAdminFramePngOnServer(opaquePngBuf, 'image/png');
  assert.equal(resOpaque.valid, false);
  assert.equal(resOpaque.errorCode, 'FRAME_FULLY_OPAQUE');

  // 3. 100% transparent 1080x1080 PNG rejected by server
  const rawEmpty = Buffer.alloc(1080 * 1080 * 4, 0);
  const emptyPngBuf = await sharp(rawEmpty, {
    raw: { width: 1080, height: 1080, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const resEmpty = await validateAdminFramePngOnServer(emptyPngBuf, 'image/png');
  assert.equal(resEmpty.valid, false);
  assert.equal(resEmpty.errorCode, 'FRAME_FULLY_TRANSPARENT');
});
