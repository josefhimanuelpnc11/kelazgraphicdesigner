import { promises as fs } from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';
import sharp from 'sharp';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC_DIR = path.join(ROOT, 'public', 'questions');
const OUT_DIR = SRC_DIR; // in-place optimize

const MAX_W = 1600; // px
const QUALITY = 78; // JPEG/WebP quality

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true }).catch(() => {});
}

function outPath(inFile) {
  // keep same path & ext preference: convert jpg/jpeg/png to webp but preserve name
  const ext = path.extname(inFile).toLowerCase();
  const base = inFile.slice(0, -ext.length);
  if (['.jpg', '.jpeg', '.png'].includes(ext)) return base + '.webp';
  if (ext === '.webp') return inFile; // re-encode in place
  return inFile; // skip others (svg,gif)
}

async function optimizeOne(file) {
  const rel = path.relative(SRC_DIR, file);
  const dest = path.join(OUT_DIR, outPath(rel));
  const absDest = path.join(OUT_DIR, outPath(file));
  await ensureDir(path.dirname(absDest));
  const input = sharp(file, { failOn: 'none' });
  const meta = await input.metadata();
  let pipeline = input;
  if ((meta.width || 0) > MAX_W) pipeline = pipeline.resize({ width: MAX_W });
  const ext = path.extname(dest).toLowerCase();
  if (ext === '.webp') pipeline = pipeline.webp({ quality: QUALITY, effort: 4 });
  else if (['.jpg', '.jpeg'].includes(ext)) pipeline = pipeline.jpeg({ quality: QUALITY, mozjpeg: true });
  else if (ext === '.png') pipeline = pipeline.png({ quality: QUALITY, palette: true });
  await pipeline.toFile(absDest);
  if (absDest !== file && dest.endsWith('.webp')) {
    // remove original if converted
    try { await fs.unlink(file); } catch {}
  }
  return { src: file, out: absDest };
}

async function main() {
  try {
    const exists = await fs.stat(SRC_DIR).then(() => true).catch(() => false);
    if (!exists) {
      console.log(`[optimize-images] skip: folder not found: ${SRC_DIR}`);
      return;
    }
    const files = await fg(['**/*.{jpg,jpeg,png,webp}'], { cwd: SRC_DIR, absolute: true });
    if (files.length === 0) {
      console.log('[optimize-images] no images found');
      return;
    }
    console.log(`[optimize-images] processing ${files.length} file(s)`);
    for (const f of files) {
      try {
        const { out } = await optimizeOne(f);
        console.log('optimized:', path.relative(ROOT, out));
      } catch (e) {
        console.warn('failed:', f, e?.message);
      }
    }
    console.log('[optimize-images] done');
  } catch (e) {
    console.error('[optimize-images] error', e);
    process.exitCode = 1;
  }
}

await main();
