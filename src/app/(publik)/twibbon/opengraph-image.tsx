import { ImageResponse } from 'next/og';
import { fetchPublicTwibbonCampaignList } from '@/lib/twibbon/server-service';

export const runtime = 'nodejs';
export const revalidate = 60;

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function OpenGraphImage() {
  const campaigns = await fetchPublicTwibbonCampaignList(1);
  const featured = campaigns.length > 0 ? campaigns[0] : null;

  let frameDataUri: string | null = null;
  const frameUrl = featured?.frame_url || featured?.thumbnail_url;
  if (frameUrl && frameUrl.startsWith('http')) {
    try {
      const imgRes = await fetch(frameUrl, {
        signal: AbortSignal.timeout(4000),
      });
      if (imgRes.ok) {
        const buf = Buffer.from(await imgRes.arrayBuffer());
        const mime = imgRes.headers.get('content-type') || 'image/png';
        frameDataUri = `data:${mime};base64,${buf.toString('base64')}`;
      }
    } catch {
      // Abaikan jika fetch timeout
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          backgroundColor: '#09090b',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Latar Belakang Gradien Merah & Emas */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(227, 24, 55, 0.35) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -150,
            right: 200,
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 215, 0, 0.15) 0%, transparent 70%)',
          }}
        />

        {/* Kolom Kiri: Branding Katalog Twibbon */}
        <div
          style={{
            flex: 1,
            padding: '60px 40px 60px 64px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#E31837',
                  color: '#ffffff',
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                UKM PILAR BANGSA
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 215, 0, 0.15)',
                  border: '1px solid rgba(255, 215, 0, 0.4)',
                  color: '#FFD700',
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                KATALOG TWIBBON RESMI
              </div>
            </div>

            <h1
              style={{
                fontSize: 48,
                fontWeight: 900,
                lineHeight: 1.15,
                color: '#ffffff',
                margin: '12px 0 0 0',
                letterSpacing: '-0.02em',
              }}
            >
              Twibbon Pilar Bangsa
            </h1>

            <p
              style={{
                fontSize: 18,
                color: '#9ca3af',
                lineHeight: 1.45,
                margin: '6px 0 0 0',
                maxWidth: 580,
              }}
            >
              {featured
                ? `Pilih bingkai resmi kegiatan seperti "${featured.title}", sesuaikan foto secara lokal di perangkat Anda, unduh PNG 1080×1080, dan salin caption resmi.`
                : 'Pilih bingkai resmi kegiatan UKM Pilar Bangsa Untag Banyuwangi, sesuaikan foto Anda secara instan di browser, unduh hasil HD, dan salin caption.'}
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              paddingTop: 18,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#34d399',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              <span>✓ Bebas Iklan</span>
              <span style={{ color: '#4b5563' }}>•</span>
              <span>✓ Tanpa Login</span>
              <span style={{ color: '#4b5563' }}>•</span>
              <span>✓ 100% Proses Lokal di Browser</span>
            </div>
            <div
              style={{
                fontSize: 14,
                color: '#6b7280',
                fontWeight: 600,
                letterSpacing: '0.02em',
              }}
            >
              www.pilarbangsa.my.id/twibbon
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Pratinjau Frame Kampanye Unggulan */}
        <div
          style={{
            width: 480,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingRight: 64,
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: 390,
              height: 390,
              borderRadius: 36,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 100%)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)',
              }}
            />

            {frameDataUri ? (
              <img
                src={frameDataUri}
                alt={featured?.title || 'Twibbon'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 24,
                  textAlign: 'center',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #450a0a 100%)',
                }}
              >
                <div
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 20,
                    backgroundColor: '#E31837',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 32,
                    marginBottom: 16,
                  }}
                >
                  PB
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#ffffff',
                    marginBottom: 6,
                  }}
                >
                  Twibbon Resmi
                </div>
                <div style={{ fontSize: 13, color: '#FFD700', fontWeight: 700 }}>
                  UKM Pilar Bangsa
                </div>
              </div>
            )}

            <div
              style={{
                position: 'absolute',
                bottom: 16,
                padding: '6px 14px',
                borderRadius: 16,
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              1080 × 1080 HD
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

