import { ImageResponse } from 'next/og';

export const alt = 'Nova Lite Solution: unique light for your home';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: 'linear-gradient(135deg, #070b17 0%, #0b1330 55%, #0d1a3f 100%)', color: 'white', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: '#F26B1D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 800 }}>N</div>
          <div style={{ fontSize: 36, fontWeight: 700 }}>Nova Lite Solution</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>Unique light for your home</div>
          <div style={{ marginTop: 24, fontSize: 32, color: '#cbd5e1' }}>LED bulbs · Inverter bulbs · Tube lights · Dealer supply</div>
        </div>
        <div style={{ display: 'flex', fontSize: 26, color: '#FDA970' }}>Kishanganj, Bihar · Order on WhatsApp</div>
      </div>
    ),
    size,
  );
}
