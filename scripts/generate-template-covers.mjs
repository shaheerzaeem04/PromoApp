import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '../public/templates/covers');
mkdirSync(outDir, { recursive: true });

const palettes = {
  blank: ['#3f3f46', '#18181b', '#e4e4e7'],
  'ai-generated': ['#7c3aed', '#a21caf', '#f5d0fe'],
  basic: ['#0d9488', '#065f46', '#99f6e4'],
  instagram: ['#ec4899', '#fb923c', '#ffe4e6'],
  facebook: ['#2563eb', '#1e3a8a', '#bfdbfe'],
  youtube: ['#dc2626', '#7f1d1d', '#fecaca'],
  'x-twitter': ['#71717a', '#18181b', '#fafafa'],
  tiktok: ['#22d3ee', '#ec4899', '#ffffff'],
  linkedin: ['#0284c7', '#1e3a8a', '#bae6fd'],
  pinterest: ['#ef4444', '#9f1239', '#fecdd3'],
  twitch: ['#a855f7', '#4c1d95', '#e9d5ff'],
  discord: ['#6366f1', '#312e81', '#c7d2fe'],
  'email-list': ['#3b82f6', '#0e7490', '#bae6fd'],
  referral: ['#f59e0b', '#c2410c', '#fde68a'],
  'photo-contest': ['#d946ef', '#6b21a8', '#f5d0fe'],
  'video-contest': ['#f43f5e', '#991b1b', '#fecdd3'],
  quiz: ['#10b981', '#115e59', '#a7f3d0'],
  survey: ['#0ea5e9', '#3730a3', '#c7d2fe'],
  'app-download': ['#84cc16', '#166534', '#d9f99d'],
  'product-launch': ['#6366f1', '#0891b2', '#a5f3fc'],
  holiday: ['#dc2626', '#15803d', '#fde68a'],
  milestone: ['#eab308', '#92400e', '#fef08a'],
  ugc: ['#ec4899', '#6d28d9', '#fbcfe8'],
  vip: ['#fcd34d', '#a16207', '#fffbeb'],
  newsletter: ['#60a5fa', '#4338ca', '#c7d2fe'],
  'caption-contest': ['#fb923c', '#db2777', '#ffedd5'],
  snapchat: ['#facc15', '#a16207', '#fef9c3'],
  'social-growth': ['#ec4899', '#be123c', '#fecdd3'],
  'spin-to-win': ['#f59e0b', '#c2410c', '#fde68a'],
  minimal: ['#a1a1aa', '#3f3f46', '#f4f4f5'],
};

const scenes = {
  blank: `
    <rect x="250" y="130" width="300" height="220" rx="28" fill="none" stroke="${'#fff'}" stroke-opacity=".22" stroke-dasharray="14 10" stroke-width="3"/>
    <rect x="370" y="210" width="60" height="16" rx="8" fill="#fff" fill-opacity=".85"/>
    <rect x="392" y="188" width="16" height="60" rx="8" fill="#fff" fill-opacity=".85"/>`,
  'ai-generated': `
    <circle cx="400" cy="230" r="78" fill="#fff" fill-opacity=".12"/>
    <circle cx="400" cy="230" r="42" fill="#fff" fill-opacity=".2"/>
    <path d="M400 168l8 38 40 8-40 8-8 38-8-38-40-8 40-8z" fill="#fff"/>
    <circle cx="292" cy="150" r="8" fill="#fff" fill-opacity=".7"/>
    <circle cx="508" cy="168" r="6" fill="#fff" fill-opacity=".55"/>
    <circle cx="318" cy="318" r="7" fill="#fff" fill-opacity=".5"/>
    <circle cx="490" cy="300" r="5" fill="#fff" fill-opacity=".7"/>`,
  basic: `
    <rect x="330" y="168" width="140" height="150" rx="18" fill="#fff" fill-opacity=".92"/>
    <rect x="330" y="168" width="140" height="42" rx="18" fill="#0f766e"/>
    <rect x="330" y="188" width="140" height="22" fill="#0f766e"/>
    <rect x="388" y="148" width="24" height="40" rx="8" fill="#fbbf24"/>`,
  instagram: `
    <rect x="318" y="118" width="164" height="264" rx="36" fill="#18181b"/>
    <rect x="330" y="142" width="140" height="216" rx="22" fill="url(#g)"/>
    <circle cx="400" cy="250" r="38" fill="none" stroke="#fff" stroke-width="6"/>
    <circle cx="448" cy="172" r="8" fill="#fff"/>`,
  facebook: `
    <circle cx="400" cy="230" r="92" fill="#fff" fill-opacity=".16"/>
    <text x="400" y="268" text-anchor="middle" font-size="120" font-family="Arial, sans-serif" font-weight="700" fill="#fff">f</text>`,
  youtube: `
    <rect x="250" y="160" width="300" height="180" rx="36" fill="#fff" fill-opacity=".95"/>
    <polygon points="370,210 370,290 460,250" fill="#dc2626"/>`,
  'x-twitter': `
    <path d="M310 150l80 92-80 108h52l54-74 62 74h72L470 248l78-98h-52l-50 68-58-68z" fill="#fafafa"/>`,
  tiktok: `
    <rect x="330" y="110" width="140" height="280" rx="32" fill="#09090b"/>
    <rect x="342" y="132" width="116" height="236" rx="18" fill="#18181b"/>
    <circle cx="400" cy="248" r="34" fill="#22d3ee"/>
    <circle cx="412" cy="236" r="34" fill="#ec4899" fill-opacity=".85"/>
    <circle cx="406" cy="242" r="22" fill="#fff"/>`,
  linkedin: `
    <rect x="250" y="150" width="300" height="200" rx="24" fill="#fff" fill-opacity=".12"/>
    <text x="400" y="278" text-anchor="middle" font-size="92" font-family="Arial, sans-serif" font-weight="700" fill="#fff">in</text>`,
  pinterest: `
    <circle cx="400" cy="210" r="86" fill="#fff"/>
    <circle cx="400" cy="198" r="36" fill="#e11d48"/>
    <path d="M392 230c8 38 18 70 28 96 6-20 8-38 4-58" fill="none" stroke="#e11d48" stroke-width="14" stroke-linecap="round"/>`,
  twitch: `
    <path d="M280 130h240v180l-60 60H280z" fill="#fff"/>
    <path d="M300 150h200v140l-40 40H300z" fill="#7c3aed"/>
    <rect x="348" y="186" width="22" height="58" fill="#fff"/>
    <rect x="400" y="186" width="22" height="58" fill="#fff"/>`,
  discord: `
    <ellipse cx="400" cy="240" rx="150" ry="100" fill="#fff" fill-opacity=".16"/>
    <ellipse cx="400" cy="236" rx="118" ry="78" fill="#5865F2"/>
    <circle cx="360" cy="230" r="16" fill="#fff"/>
    <circle cx="440" cy="230" r="16" fill="#fff"/>`,
  'email-list': `
    <rect x="230" y="150" width="340" height="210" rx="24" fill="#fff" fill-opacity=".95"/>
    <path d="M230 174l170 110 170-110" fill="none" stroke="#0284c7" stroke-width="10" stroke-linejoin="round"/>
    <rect x="270" y="300" width="180" height="12" rx="6" fill="#bae6fd"/>
    <rect x="270" y="324" width="120" height="12" rx="6" fill="#e0f2fe"/>`,
  referral: `
    <circle cx="320" cy="230" r="54" fill="#fff"/>
    <circle cx="480" cy="230" r="54" fill="#fff" fill-opacity=".88"/>
    <path d="M374 230h52" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
    <path d="M418 210l20 20-20 20" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`,
  'photo-contest': `
    <rect x="250" y="150" width="210" height="160" rx="16" transform="rotate(-8 355 230)" fill="#fff"/>
    <rect x="340" y="170" width="210" height="160" rx="16" transform="rotate(7 445 250)" fill="#f5d0fe"/>
    <circle cx="430" cy="236" r="28" fill="none" stroke="#a21caf" stroke-width="8"/>
    <rect x="470" y="196" width="22" height="14" rx="4" fill="#a21caf"/>`,
  'video-contest': `
    <rect x="240" y="150" width="320" height="200" rx="28" fill="#18181b"/>
    <rect x="258" y="168" width="284" height="164" rx="16" fill="#fff" fill-opacity=".08"/>
    <polygon points="370,210 370,300 470,255" fill="#fff"/>`,
  quiz: `
    <circle cx="400" cy="230" r="96" fill="#fff" fill-opacity=".14"/>
    <text x="400" y="268" text-anchor="middle" font-size="120" font-family="Georgia, serif" font-weight="700" fill="#fff">?</text>`,
  survey: `
    <rect x="280" y="120" width="240" height="270" rx="22" fill="#fff"/>
    <rect x="310" y="160" width="180" height="14" rx="7" fill="#c7d2fe"/>
    <rect x="310" y="196" width="140" height="14" rx="7" fill="#e0e7ff"/>
    <rect x="310" y="232" width="160" height="14" rx="7" fill="#c7d2fe"/>
    <rect x="310" y="268" width="110" height="14" rx="7" fill="#e0e7ff"/>
    <circle cx="324" cy="322" r="10" fill="#4f46e5"/>`,
  'app-download': `
    <rect x="330" y="110" width="140" height="280" rx="32" fill="#052e16"/>
    <rect x="344" y="136" width="112" height="228" rx="18" fill="#ecfccb"/>
    <rect x="366" y="176" width="68" height="68" rx="16" fill="#65a30d"/>
    <rect x="372" y="328" width="56" height="10" rx="5" fill="#166534"/>`,
  'product-launch': `
    <path d="M400 120l28 92 96 12-76 62 22 94-70-48-70 48 22-94-76-62 96-12z" fill="#fff" fill-opacity=".2"/>
    <path d="M370 250c30-90 40-90 70 0l-16 90c-18 12-20 12-38 0z" fill="#fff"/>
    <path d="M392 340c-18 28-8 48 8 58 16-10 26-30 8-58z" fill="#22d3ee" fill-opacity=".8"/>`,
  holiday: `
    <polygon points="400,120 460,280 340,280" fill="#15803d"/>
    <polygon points="400,160 444,270 356,270" fill="#22c55e"/>
    <rect x="388" y="276" width="24" height="50" fill="#92400e"/>
    <circle cx="400" cy="168" r="10" fill="#fde68a"/>
    <circle cx="372" cy="230" r="8" fill="#ef4444"/>
    <circle cx="428" cy="242" r="8" fill="#f59e0b"/>`,
  milestone: `
    <rect x="300" y="250" width="200" height="28" rx="6" fill="#fef3c7"/>
    <rect x="328" y="278" width="144" height="18" rx="6" fill="#fde68a"/>
    <rect x="350" y="296" width="100" height="14" rx="6" fill="#fcd34d"/>
    <ellipse cx="400" cy="196" rx="54" ry="58" fill="#fbbf24"/>
    <rect x="392" y="230" width="16" height="28" fill="#f59e0b"/>`,
  ugc: `
    <circle cx="320" cy="210" r="48" fill="#fff"/>
    <circle cx="400" cy="168" r="48" fill="#fff" fill-opacity=".9"/>
    <circle cx="480" cy="210" r="48" fill="#fff" fill-opacity=".8"/>
    <rect x="250" y="268" width="300" height="90" rx="20" fill="#fff" fill-opacity=".16"/>`,
  vip: `
    <path d="M300 210l40-50 60 36 60-36 40 50-20 90H320z" fill="#fff"/>
    <circle cx="400" cy="168" r="14" fill="#f59e0b"/>
    <rect x="330" y="300" width="140" height="18" rx="9" fill="#fde68a"/>`,
  newsletter: `
    <rect x="250" y="140" width="300" height="220" rx="18" fill="#fff"/>
    <rect x="250" y="140" width="300" height="54" fill="#4338ca"/>
    <rect x="280" y="220" width="240" height="12" rx="6" fill="#c7d2fe"/>
    <rect x="280" y="248" width="180" height="12" rx="6" fill="#e0e7ff"/>
    <rect x="280" y="276" width="210" height="12" rx="6" fill="#c7d2fe"/>`,
  'caption-contest': `
    <rect x="230" y="150" width="250" height="170" rx="24" fill="#fff"/>
    <rect x="258" y="178" width="194" height="12" rx="6" fill="#fed7aa"/>
    <rect x="258" y="206" width="150" height="12" rx="6" fill="#ffedd5"/>
    <circle cx="530" cy="300" r="54" fill="#fff" fill-opacity=".2"/>
    <path d="M508 300h44M530 278v44" stroke="#fff" stroke-width="8" stroke-linecap="round"/>`,
  snapchat: `
    <path d="M400 120c70 0 110 54 110 110 0 38-16 58-6 86-18-6-32 6-50 14-10 20-28 30-54 30s-44-10-54-30c-18-8-32-20-50-14 10-28-6-48-6-86 0-56 40-110 110-110z" fill="#fff"/>`,
  'social-growth': `
    <path d="M220 320 320 240 390 268 500 150 560 150 560 190 518 190 400 330 328 300 250 360z" fill="#fff" fill-opacity=".9"/>
    <circle cx="500" cy="150" r="16" fill="#fff"/>`,
  'spin-to-win': `
    <circle cx="400" cy="240" r="110" fill="#fff" fill-opacity=".14"/>
    <circle cx="400" cy="240" r="96" fill="#fff"/>
    <path d="M400 240L400 144A96 96 0 0 1 484 288z" fill="#f59e0b"/>
    <path d="M400 240L484 288A96 96 0 0 1 316 288z" fill="#ea580c"/>
    <path d="M400 240L316 288A96 96 0 0 1 400 144z" fill="#fbbf24"/>
    <circle cx="400" cy="240" r="18" fill="#18181b"/>
    <polygon points="400,118 412,148 388,148" fill="#fff"/>`,
  minimal: `
    <rect x="300" y="150" width="200" height="200" rx="40" fill="#fff" fill-opacity=".1"/>
    <rect x="340" y="190" width="120" height="120" rx="28" fill="#fff" fill-opacity=".16"/>
    <circle cx="400" cy="250" r="22" fill="#fff"/>`,
};

function svg(key) {
  const [from, to, accent] = palettes[key];
  const scene = scenes[key];
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500" role="img">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
    <radialGradient id="glow" cx=".78" cy=".18" r=".7">
      <stop offset="0" stop-color="${accent}" stop-opacity=".35"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.2" fill="#fff" fill-opacity=".12"/>
    </pattern>
  </defs>
  <rect width="800" height="500" fill="#09090b"/>
  <rect width="800" height="500" fill="url(#g)"/>
  <rect width="800" height="500" fill="url(#glow)"/>
  <rect width="800" height="500" fill="url(#dots)"/>
  <circle cx="120" cy="400" r="140" fill="#000" fill-opacity=".16"/>
  ${scene}
</svg>
`;
}

for (const key of Object.keys(palettes)) {
  writeFileSync(join(outDir, `${key}.svg`), svg(key));
}

console.log(`Wrote ${Object.keys(palettes).length} covers to ${outDir}`);
