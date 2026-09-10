import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src');

/** Longer patterns first to avoid partial collisions. */
const replacements = [
  [/ring-offset-zinc-950/g, 'ring-offset-background'],
  [/placeholder-zinc-500/g, 'placeholder:text-muted-foreground'],
  [/hover:border-zinc-600/g, 'hover:border-border-strong'],
  [/hover:border-zinc-700/g, 'hover:border-border-strong'],
  [/hover:bg-zinc-900\/70/g, 'hover:bg-surface-muted'],
  [/hover:bg-zinc-900\/60/g, 'hover:bg-surface-muted'],
  [/hover:bg-zinc-800\/70/g, 'hover:bg-surface-raised/70'],
  [/hover:bg-zinc-800\/60/g, 'hover:bg-surface-raised/60'],
  [/hover:bg-zinc-800/g, 'hover:bg-surface-raised'],
  [/hover:text-zinc-100/g, 'hover:text-foreground'],
  [/hover:text-zinc-200/g, 'hover:text-foreground'],
  [/hover:text-zinc-50/g, 'hover:text-foreground'],
  [/border-zinc-800\/80/g, 'border-border'],
  [/border-zinc-800\/70/g, 'border-border'],
  [/border-zinc-800\/50/g, 'border-border/60'],
  [/border-zinc-800\/60/g, 'border-border'],
  [/border-zinc-700\/80/g, 'border-border-strong'],
  [/border-zinc-800/g, 'border-border'],
  [/border-zinc-700/g, 'border-border-strong'],
  [/bg-zinc-950\/90/g, 'bg-background/90'],
  [/bg-zinc-950\/50/g, 'bg-background/50'],
  [/bg-zinc-950/g, 'bg-background'],
  [/bg-zinc-900\/80/g, 'bg-surface/80'],
  [/bg-zinc-900\/70/g, 'bg-surface/70'],
  [/bg-zinc-900\/50/g, 'bg-surface/50'],
  [/bg-zinc-900\/40/g, 'bg-surface/40'],
  [/bg-zinc-900\/30/g, 'bg-surface/30'],
  [/bg-zinc-900/g, 'bg-surface'],
  [/bg-zinc-800\/80/g, 'bg-surface-raised/80'],
  [/bg-zinc-800\/60/g, 'bg-surface-raised/60'],
  [/bg-zinc-800\/50/g, 'bg-surface-raised/50'],
  [/bg-zinc-800/g, 'bg-surface-raised'],
  [/text-zinc-50/g, 'text-foreground'],
  [/text-zinc-100/g, 'text-foreground'],
  [/text-zinc-200/g, 'text-foreground'],
  [/text-zinc-300/g, 'text-muted-foreground'],
  [/text-zinc-400/g, 'text-muted-foreground'],
  [/text-zinc-500/g, 'text-muted-foreground'],
  [/text-zinc-600/g, 'text-muted-foreground'],
];

const skipDirs = new Set(['campaign']); // keep campaign brand tokens mostly intact if any zinc there for intentional dark chrome

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name) && path.basename(dir) === 'src') {
        // still walk but skip? Actually campaign theme can keep dark - skip replacing inside campaign/
        continue;
      }
      walk(full, out);
    } else if (/\.(tsx|ts|css)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(root);
let changed = 0;
for (const file of files) {
  // Skip product showcase mocks — intentional dark product chrome
  if (file.replace(/\\/g, '/').includes('ProductShowcase.tsx')) continue;
  // Skip theme CSS token file itself if we put zinc there - index.css already rewritten
  if (file.endsWith(`${path.sep}index.css`)) continue;

  let text = fs.readFileSync(file, 'utf8');
  const original = text;
  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }
  if (text !== original) {
    fs.writeFileSync(file, text);
    changed += 1;
    console.log('updated', path.relative(root, file));
  }
}
console.log(`Done. ${changed} files updated.`);
