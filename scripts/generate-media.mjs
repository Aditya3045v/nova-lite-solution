// Generates the seed product / category / banner artwork as SVG.
// Run: node scripts/generate-media.mjs   (outputs to packages/assets/public/media)
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'packages', 'assets', 'public', 'media');
const BRAND = '#F26B1D';
const BRAND_DARK = '#C94E0B';
const INK = '#0B1020';

function write(rel, svg) {
  const p = join(root, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, svg.trim() + '\n');
}

const doc = (body, defs = '', size = 800, h = size) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${h}" width="${size}" height="${h}" role="img">
<defs>
  <radialGradient id="glass" cx="42%" cy="34%" r="70%">
    <stop offset="0" stop-color="#FFFFFF"/>
    <stop offset=".55" stop-color="#F3F5F9"/>
    <stop offset=".85" stop-color="#E1E6EE"/>
    <stop offset="1" stop-color="#CBD2DD"/>
  </radialGradient>
  <radialGradient id="glow" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/>
    <stop offset=".6" stop-color="#FFF4E6" stop-opacity=".35"/>
    <stop offset="1" stop-color="#FFE3C2" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="neck" x1="0" x2="1">
    <stop offset="0" stop-color="#D9DDE4"/>
    <stop offset=".35" stop-color="#FFFFFF"/>
    <stop offset=".7" stop-color="#EEF0F4"/>
    <stop offset="1" stop-color="#C3C9D2"/>
  </linearGradient>
  <linearGradient id="metal" x1="0" x2="1">
    <stop offset="0" stop-color="#8E959F"/>
    <stop offset=".3" stop-color="#E9ECF0"/>
    <stop offset=".55" stop-color="#FFFFFF"/>
    <stop offset=".8" stop-color="#B8BEC7"/>
    <stop offset="1" stop-color="#7C838D"/>
  </linearGradient>
  <linearGradient id="alu" x1="0" x2="1">
    <stop offset="0" stop-color="#6B7280"/>
    <stop offset=".25" stop-color="#C9CED6"/>
    <stop offset=".5" stop-color="#EEF1F5"/>
    <stop offset=".75" stop-color="#B3B9C2"/>
    <stop offset="1" stop-color="#5E6570"/>
  </linearGradient>
  <linearGradient id="tube" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFFFFF"/>
    <stop offset=".45" stop-color="#F7F9FC"/>
    <stop offset="1" stop-color="#D5DBE4"/>
  </linearGradient>
  <linearGradient id="brand" x1="0" x2="1">
    <stop offset="0" stop-color="${BRAND_DARK}"/>
    <stop offset=".5" stop-color="${BRAND}"/>
    <stop offset="1" stop-color="${BRAND_DARK}"/>
  </linearGradient>
  <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
  <filter id="blur40" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>
  ${defs}
</defs>
${body}
</svg>`;

const shadow = (cx, cy, rx, ry = 18, o = 0.16) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#0B1020" opacity="${o}" filter="url(#soft)"/>`;

// Classic A-shape bulb. scale ~ size, label printed on the neck.
function bulb({ label = '9W', inverter = false, scale = 1, cx = 400, baseY = 700, lit = true } = {}) {
  const s = scale;
  const g = [];
  const top = baseY - 560 * s;
  g.push(`<g transform="translate(${cx} ${top}) scale(${s}) translate(-400 -140)">`);
  if (lit) g.push(`<circle cx="400" cy="330" r="260" fill="url(#glow)" opacity=".9"/>`);
  // glass
  g.push(`<path d="M300 505 C 245 455 208 400 208 330 A 192 192 0 1 1 592 330 C 592 400 555 455 500 505 Z" fill="url(#glass)" stroke="#D3D9E2" stroke-width="2"/>`);
  g.push(`<path d="M300 505 C 245 455 208 400 208 330 A 192 192 0 0 1 300 164" fill="none" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" opacity=".55"/>`);
  g.push(`<ellipse cx="330" cy="250" rx="46" ry="78" transform="rotate(28 330 250)" fill="#FFFFFF" opacity=".75"/>`);
  // neck / housing
  const neckH = inverter ? 118 : 96;
  g.push(`<path d="M296 500 L504 500 L486 ${500 + neckH} L314 ${500 + neckH} Z" fill="url(#neck)" stroke="#C5CCD6" stroke-width="2"/>`);
  g.push(`<rect x="297" y="500" width="206" height="${inverter ? 16 : 10}" rx="4" fill="url(#brand)"/>`);
  g.push(`<text x="400" y="${inverter ? 560 : 552}" text-anchor="middle" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="30" font-weight="700" fill="#4B5563" letter-spacing="1">${label}</text>`);
  g.push(`<text x="400" y="${inverter ? 590 : 580}" text-anchor="middle" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="15" font-weight="700" fill="${BRAND}" letter-spacing="4">${inverter ? 'INVERTER' : 'NOVA'}</text>`);
  if (inverter) {
    g.push(`<g transform="translate(446 538)"><rect width="30" height="16" rx="3" fill="none" stroke="#16A34A" stroke-width="3"/><rect x="30" y="5" width="4" height="6" fill="#16A34A"/><rect x="4" y="4" width="16" height="8" fill="#16A34A"/></g>`);
  }
  const b = 500 + neckH;
  // cap
  g.push(`<path d="M322 ${b} L478 ${b} L470 ${b + 70} L330 ${b + 70} Z" fill="url(#metal)"/>`);
  for (let i = 1; i < 4; i++) g.push(`<line x1="${324 + i * 1.5}" y1="${b + i * 17}" x2="${476 - i * 1.5}" y2="${b + i * 17}" stroke="#8E959F" stroke-width="2" opacity=".6"/>`);
  g.push(`<rect x="312" y="${b + 24}" width="18" height="14" rx="4" fill="url(#metal)"/><rect x="470" y="${b + 24}" width="18" height="14" rx="4" fill="url(#metal)"/>`);
  g.push(`<path d="M334 ${b + 70} L466 ${b + 70} L440 ${b + 102} L360 ${b + 102} Z" fill="#1F2430"/>`);
  g.push(`<circle cx="378" cy="${b + 96}" r="8" fill="url(#metal)"/><circle cx="422" cy="${b + 96}" r="8" fill="url(#metal)"/>`);
  g.push(`</g>`);
  return g.join('\n');
}

// Wide-body commercial bulb
function ultrawide({ label = '18W', cx = 400, baseY = 700 } = {}) {
  return `
  <g transform="translate(${cx - 400} ${baseY - 700})">
    <circle cx="400" cy="300" r="300" fill="url(#glow)"/>
    <path d="M210 420 C 150 400 120 330 150 260 C 190 160 290 120 400 120 C 510 120 610 160 650 260 C 680 330 650 400 590 420 Z" fill="url(#glass)" stroke="#D3D9E2" stroke-width="2"/>
    <ellipse cx="300" cy="215" rx="70" ry="34" transform="rotate(-18 300 215)" fill="#FFFFFF" opacity=".8"/>
    <path d="M205 418 L595 418 L540 540 L260 540 Z" fill="url(#neck)" stroke="#C5CCD6" stroke-width="2"/>
    ${Array.from({ length: 9 }, (_, i) => `<line x1="${262 + i * 34}" y1="430" x2="${282 + i * 30}" y2="532" stroke="#CDD3DC" stroke-width="3"/>`).join('')}
    <rect x="210" y="418" width="380" height="12" rx="4" fill="url(#brand)"/>
    <text x="400" y="495" text-anchor="middle" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="30" font-weight="700" fill="#4B5563">${label}</text>
    <path d="M322 540 L478 540 L470 610 L330 610 Z" fill="url(#metal)"/>
    <rect x="312" y="564" width="18" height="14" rx="4" fill="url(#metal)"/><rect x="470" y="564" width="18" height="14" rx="4" fill="url(#metal)"/>
    <path d="M334 610 L466 610 L440 642 L360 642 Z" fill="#1F2430"/>
    <circle cx="378" cy="636" r="8" fill="url(#metal)"/><circle cx="422" cy="636" r="8" fill="url(#metal)"/>
  </g>`;
}

// Finned high-watt bulb
function highwatt({ label = '30W', scale = 1, cx = 400, baseY = 700 } = {}) {
  const s = scale;
  return `
  <g transform="translate(${cx} ${baseY}) scale(${s}) translate(-400 -700)">
    <circle cx="400" cy="270" r="280" fill="url(#glow)"/>
    <rect x="250" y="90" width="300" height="300" rx="120" fill="url(#glass)" stroke="#D3D9E2" stroke-width="2"/>
    <ellipse cx="320" cy="180" rx="34" ry="70" transform="rotate(12 320 180)" fill="#FFFFFF" opacity=".8"/>
    <rect x="240" y="370" width="320" height="16" rx="6" fill="url(#brand)"/>
    <path d="M244 386 L556 386 L520 560 L280 560 Z" fill="url(#alu)"/>
    ${Array.from({ length: 11 }, (_, i) => `<path d="M${262 + i * 27.5} 392 L${286 + i * 23} 554" stroke="#4B5563" stroke-width="5" opacity=".45"/>`).join('')}
    <rect x="330" y="440" width="140" height="44" rx="10" fill="#111827" opacity=".82"/>
    <text x="400" y="472" text-anchor="middle" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="28" font-weight="800" fill="#FFFFFF">${label}</text>
    <path d="M322 560 L478 560 L470 626 L330 626 Z" fill="url(#metal)"/>
    ${[1, 2, 3].map((i) => `<line x1="326" y1="${560 + i * 16}" x2="474" y2="${560 + i * 16}" stroke="#8E959F" stroke-width="2" opacity=".6"/>`).join('')}
    <path d="M334 626 L466 626 L440 658 L360 658 Z" fill="#1F2430"/>
    <circle cx="400" cy="652" r="10" fill="url(#metal)"/>
  </g>`;
}

// T8 tube (tilted)
function tubeT8({ label = '20W', length = 660 } = {}) {
  const x0 = 400 - length / 2;
  return `
  <g transform="rotate(-24 400 420)">
    <rect x="${x0 - 20}" y="330" width="${length + 40}" height="180" rx="90" fill="url(#glow)" opacity=".9"/>
    <rect x="${x0 + 40}" y="392" width="${length - 80}" height="56" rx="28" fill="url(#tube)" stroke="#D3D9E2" stroke-width="2"/>
    <rect x="${x0 + 60}" y="398" width="${length - 120}" height="10" rx="5" fill="#FFFFFF" opacity=".9"/>
    <rect x="${x0}" y="386" width="48" height="68" rx="12" fill="url(#metal)"/>
    <rect x="${x0 + length - 48}" y="386" width="48" height="68" rx="12" fill="url(#metal)"/>
    <rect x="${x0 + 40}" y="386" width="10" height="68" fill="url(#brand)"/>
    <rect x="${x0 + length - 50}" y="386" width="10" height="68" fill="url(#brand)"/>
    <rect x="${x0 - 16}" y="404" width="18" height="6" rx="3" fill="#9CA3AF"/><rect x="${x0 - 16}" y="430" width="18" height="6" rx="3" fill="#9CA3AF"/>
    <rect x="${x0 + length - 2}" y="404" width="18" height="6" rx="3" fill="#9CA3AF"/><rect x="${x0 + length - 2}" y="430" width="18" height="6" rx="3" fill="#9CA3AF"/>
    <text x="400" y="431" text-anchor="middle" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="20" font-weight="700" fill="#6B7280" letter-spacing="3">NOVA T8 · ${label}</text>
  </g>
  ${shadow(400, 640, 300, 16, 0.12)}`;
}

// Integrated batten (tilted)
function batten({ label = '20W', length = 660, thick = 1 } = {}) {
  const x0 = 400 - length / 2;
  const h = 64 * thick;
  return `
  <g transform="rotate(-22 400 420)">
    <rect x="${x0 - 20}" y="${420 - h * 1.6}" width="${length + 40}" height="${h * 3.2}" rx="${h}" fill="url(#glow)" opacity=".9"/>
    <rect x="${x0}" y="${420 - h / 2 + 10}" width="${length}" height="${h * 0.7}" rx="10" fill="url(#alu)"/>
    <rect x="${x0 + 6}" y="${420 - h / 2}" width="${length - 12}" height="${h * 0.62}" rx="${h * 0.3}" fill="url(#tube)" stroke="#D3D9E2" stroke-width="2"/>
    <rect x="${x0 + 30}" y="${420 - h / 2 + 6}" width="${length - 60}" height="8" rx="4" fill="#FFFFFF"/>
    <rect x="${x0 - 8}" y="${420 - h / 2 - 2}" width="26" height="${h * 0.9}" rx="8" fill="#E5E7EB" stroke="#CBD2DD"/>
    <rect x="${x0 + length - 18}" y="${420 - h / 2 - 2}" width="26" height="${h * 0.9}" rx="8" fill="#E5E7EB" stroke="#CBD2DD"/>
    <rect x="${x0 + length / 2 - 60}" y="${420 + h * 0.2 + 12}" width="120" height="6" rx="3" fill="url(#brand)"/>
    <text x="400" y="${420 + 2}" text-anchor="middle" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="18" font-weight="700" fill="#6B7280" letter-spacing="3">NOVA BATTEN · ${label}</text>
  </g>
  ${shadow(400, 640, 300, 16, 0.12)}`;
}

// Retail box in 3/4 view
function box({ name, label, sub }) {
  return doc(`
  ${shadow(410, 720, 250, 22, 0.18)}
  <path d="M170 250 L470 200 L470 700 L170 720 Z" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="2"/>
  <path d="M470 200 L640 250 L640 690 L470 700 Z" fill="#EEF0F4" stroke="#E5E7EB" stroke-width="2"/>
  <path d="M170 250 L470 200 L640 250 L340 292 Z" fill="#F7F8FA" stroke="#E5E7EB" stroke-width="2"/>
  <path d="M170 520 L470 490 L470 700 L170 720 Z" fill="${BRAND}"/>
  <path d="M470 490 L640 520 L640 690 L470 700 Z" fill="${BRAND_DARK}"/>
  <g transform="translate(0 0) skewY(-9.5) translate(0 50)">
    <text x="196" y="320" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="34" font-weight="800" fill="${INK}" letter-spacing="2">NOVA</text>
    <text x="196" y="346" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="14" font-weight="700" fill="${BRAND}" letter-spacing="4">LITE SOLUTION</text>
    <text x="196" y="420" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="64" font-weight="800" fill="${INK}">${label}</text>
    <text x="196" y="455" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="#4B5563">${sub}</text>
    <text x="196" y="560" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="20" font-weight="700" fill="#FFFFFF">${name}</text>
    <text x="196" y="590" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="15" font-weight="600" fill="#FFE8D6">1 year replacement warranty</text>
  </g>
  <circle cx="555" cy="345" r="54" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="2"/>
  <path d="M555 312 a26 26 0 0 1 16 46 v10 h-32 v-10 a26 26 0 0 1 16 -46 z" fill="none" stroke="${BRAND}" stroke-width="5"/>
  <rect x="541" y="372" width="28" height="6" rx="3" fill="${BRAND}"/>
  `);
}

const products = [
  { file: 'bulb-5w', art: () => bulb({ label: '5W', scale: 0.82 }), name: 'LED Bulb', label: '5W', sub: '500 lm · Cool White' },
  { file: 'bulb-7w', art: () => bulb({ label: '7W', scale: 0.87 }), name: 'LED Bulb', label: '7W', sub: '700 lm · Cool White' },
  { file: 'bulb-9w', art: () => bulb({ label: '9W', scale: 0.92 }), name: 'LED Bulb', label: '9W', sub: '900 lm · Cool White' },
  { file: 'bulb-12w', art: () => bulb({ label: '12W', scale: 0.96 }), name: 'LED Bulb', label: '12W', sub: '1200 lm · Cool White' },
  { file: 'bulb-15w', art: () => bulb({ label: '15W', scale: 1 }), name: 'LED Bulb', label: '15W', sub: '1500 lm · Cool White' },
  { file: 'inverter-9w', art: () => bulb({ label: '9W', inverter: true, scale: 0.9 }), name: 'Inverter Bulb', label: '9W', sub: 'Up to 4 hrs backup' },
  { file: 'inverter-12w', art: () => bulb({ label: '12W', inverter: true, scale: 0.95 }), name: 'Inverter Bulb', label: '12W', sub: '4 to 8 hrs backup' },
  { file: 'inverter-15w', art: () => bulb({ label: '15W', inverter: true, scale: 1 }), name: 'Inverter Bulb', label: '15W', sub: 'Up to 6 hrs backup' },
  { file: 'tube-t8-20w', art: () => tubeT8({ label: '20W' }), name: 'T8 Tube Light', label: '20W', sub: '4 ft · 2000 lm' },
  { file: 'batten-10w', art: () => batten({ label: '10W', length: 520, thick: 1.5 }), name: 'T5 Batten', label: '10W', sub: '2 ft · 1000 lm' },
  { file: 'batten-20w', art: () => batten({ label: '20W', length: 680, thick: 1.5 }), name: 'T5 Batten', label: '20W', sub: '4 ft · 2000 lm' },
  { file: 'batten-36w', art: () => batten({ label: '36W', length: 700, thick: 1.9 }), name: 'Slim Batten', label: '36W', sub: '4 ft · 3600 lm' },
  { file: 'ultrawide-18w', art: () => ultrawide({ label: '18W' }), name: 'Ultrawide LED', label: '18W', sub: '1800 lm · Wide spread' },
  { file: 'highwatt-30w', art: () => highwatt({ label: '30W', scale: 0.9 }), name: 'High-Watt LED', label: '30W', sub: '3000 lm' },
  { file: 'highwatt-40w', art: () => highwatt({ label: '40W', scale: 0.95 }), name: 'High-Watt LED', label: '40W', sub: '4000 lm' },
  { file: 'highwatt-50w', art: () => highwatt({ label: '50W', scale: 1 }), name: 'High-Watt LED', label: '50W', sub: '5000 lm' },
];

for (const p of products) {
  const art = p.art();
  const withShadow = p.file.startsWith('tube') || p.file.startsWith('batten') ? art : `${shadow(400, 735, 170)}\n${art}`;
  write(`products/${p.file}.svg`, doc(withShadow));
  write(`products/${p.file}-box.svg`, box(p));
}

// Categories reuse a representative product
const catArt = {
  'led-bulbs': `${shadow(330, 735, 140)}${bulb({ label: '9W', scale: 0.8, cx: 300 })}${shadow(520, 735, 120)}${bulb({ label: '12W', scale: 0.7, cx: 540 })}`,
  'inverter-bulbs': `${shadow(400, 735, 170)}${bulb({ label: '12W', inverter: true, scale: 0.95 })}`,
  'tube-lights': tubeT8({ label: '20W' }),
  'high-wattage': `${shadow(400, 735, 170)}${highwatt({ label: '40W', scale: 0.95 })}`,
};
for (const [k, v] of Object.entries(catArt)) write(`categories/${k}.svg`, doc(v));

// Product range composite (hero / dealer banner)
write('banners/range.svg', doc(`
  ${shadow(400, 745, 340, 22, 0.2)}
  <g>${tubeT8({ label: '20W', length: 620 }).replace('rotate(-24 400 420)', 'translate(20 -150) rotate(-18 400 420)').replace(/<ellipse[^>]*\/>/, '')}</g>
  ${highwatt({ label: '30W', scale: 0.58, cx: 640, baseY: 735 })}
  ${bulb({ label: '12W', inverter: true, scale: 0.64, cx: 170, baseY: 735 })}
  ${bulb({ label: '9W', scale: 0.6, cx: 405, baseY: 745 })}
`, '', 800));

// Portfolio project illustrations (dark scenes with pools of light)
function scene(kind) {
  const W = 1200, H = 800;
  const lights = kind === 'warehouse' ? [200, 450, 700, 950] : kind === 'clinic' ? [300, 600, 900] : [240, 480, 720, 960];
  const pools = lights.map((x) => `
    <path d="M${x - 16} 150 L${x + 16} 150 L${x + 190} 640 L${x - 190} 640 Z" fill="url(#beam)" opacity=".55"/>
    <circle cx="${x}" cy="150" r="46" fill="#FFF6EA" opacity=".25" filter="url(#blur40)"/>
    <rect x="${x - 44}" y="132" width="88" height="18" rx="9" fill="#FFFFFF"/>
    <rect x="${x - 2}" y="60" width="4" height="72" fill="#475569"/>`).join('');
  const props = {
    showroom: `
      <rect x="120" y="470" width="960" height="170" rx="10" fill="#1E293B"/>
      <rect x="120" y="470" width="960" height="12" fill="${BRAND}"/>
      ${Array.from({ length: 12 }, (_, i) => `<rect x="${150 + i * 78}" y="${380 - (i % 3) * 30}" width="46" height="${90 + (i % 3) * 30}" rx="8" fill="#334155"/><circle cx="${173 + i * 78}" cy="${372 - (i % 3) * 30}" r="18" fill="#F8FAFC" opacity=".9"/>`).join('')}`,
    clinic: `
      <rect x="140" y="420" width="360" height="90" rx="14" fill="#E2E8F0"/>
      <rect x="140" y="510" width="20" height="130" fill="#94A3B8"/><rect x="480" y="510" width="20" height="130" fill="#94A3B8"/>
      <rect x="160" y="400" width="120" height="30" rx="12" fill="#FFFFFF"/>
      <rect x="700" y="300" width="340" height="340" rx="16" fill="#1E293B"/>
      <rect x="840" y="360" width="60" height="180" rx="8" fill="#22C55E" opacity=".9"/>
      <rect x="780" y="420" width="180" height="60" rx="8" fill="#22C55E" opacity=".9"/>`,
    warehouse: `
      ${Array.from({ length: 4 }, (_, r) => Array.from({ length: 7 }, (_, c) => `<rect x="${110 + c * 142}" y="${360 + r * 70}" width="120" height="58" rx="6" fill="${(r + c) % 3 === 0 ? BRAND_DARK : '#334155'}" opacity="${(r + c) % 3 === 0 ? 0.85 : 1}"/>`).join('')).join('')}`,
  }[kind];
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1020"/><stop offset="1" stop-color="#111a33"/></linearGradient>
  <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4E0" stop-opacity=".9"/><stop offset="1" stop-color="#FFF4E0" stop-opacity="0"/></linearGradient>
  <filter id="blur40" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect y="640" width="${W}" height="160" fill="#0F172A"/>
<rect y="640" width="${W}" height="3" fill="#1E293B"/>
<rect y="60" width="${W}" height="4" fill="#1E293B"/>
${pools}
${props}
</svg>`;
}
for (const k of ['showroom', 'clinic', 'warehouse']) write(`projects/${k}.svg`, scene(k));

// Placeholder
write('placeholder.svg', doc(`
  <rect width="800" height="800" fill="#F3F4F6"/>
  <g opacity=".35">${bulb({ label: '', scale: 0.7, lit: false })}</g>
`));

console.log('media generated in', root);
