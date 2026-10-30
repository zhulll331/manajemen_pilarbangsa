import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const revalidate = 3600;

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function OpenGraphImage() {
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
            right: 180,
            width: 580,
            height: 580,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 215, 0, 0.16) 0%, transparent 70%)',
          }}
        />

        {/* Kolom Kiri */}
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
                  backgroundColor: '#E31837',
                  color: '#ffffff',
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                }}
              >
                UKM PILAR BANGSA
              </div>
              <div
                style={{
                  display: 'flex',
                  backgroundColor: 'rgba(255, 215, 0, 0.15)',
                  border: '1px solid rgba(255, 215, 0, 0.4)',
                  color: '#FFD700',
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                DIRECT SCAN • AKTIF SELAMANYA
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
              Link to QR Code Generator Kustom
            </h1>

            <p
              style={{
                fontSize: 19,
                color: '#9ca3af',
                lineHeight: 1.45,
                margin: '6px 0 0 0',
                maxWidth: 580,
              }}
            >
              Buat QR Code berlogo resmi (Pilar Bangsa, Maskot UKM, Google, Gemini, Maps, WhatsApp, Instagram) secara instan tanpa iklan dan langsung menuju tujuan.
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
                gap: 10,
                color: '#34d399',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              <span>✓ 19+ Template Logo</span>
              <span style={{ color: '#4b5563' }}>•</span>
              <span>✓ Warna & Gradien Kustom</span>
              <span style={{ color: '#4b5563' }}>•</span>
              <span>✓ PNG 2048px & Vektor SVG</span>
            </div>
            <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 600 }}>
              www.pilarbangsa.my.id/qr
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Ilustrasi Kartu QR */}
        <div
          style={{
            width: 460,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingRight: 64,
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: 370,
              height: 410,
              borderRadius: 34,
              backgroundColor: '#ffffff',
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div
              style={{
                width: 280,
                height: 280,
                borderRadius: 24,
                border: '6px solid #111827',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                backgroundColor: '#f9fafb',
              }}
            >
              <div
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 22,
                  backgroundColor: '#E31837',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                  fontWeight: 900,
                }}
              >
                QR
              </div>
            </div>
            <div
              style={{
                backgroundColor: '#E31837',
                color: '#ffffff',
                padding: '8px 28px',
                borderRadius: 20,
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: '0.06em',
              }}
            >
              SCAN ME • PILAR BANGSA
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
