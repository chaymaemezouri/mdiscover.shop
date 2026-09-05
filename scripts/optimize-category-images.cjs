/**
 * Compress storefront category carousel images (destructive overwrite).
 *   node scripts/optimize-category-images.cjs
 */
const fs = require('fs');
const path = require('path');

async function main() {
  const sharp = require('sharp');
  const dir = path.join(__dirname, '..', 'apps', 'web', 'public', 'categories');
  const outDir = path.join(dir, '_optimized');
  fs.mkdirSync(outDir, { recursive: true });

  const files = fs
    .readdirSync(dir)
    .filter((f) => /\.jpe?g$/i.test(f) && !f.startsWith('brand-story') && !f.startsWith('.'));

  for (const f of files) {
    const input = path.join(dir, f);
    const output = path.join(outDir, f);
    const before = fs.statSync(input).size;
    await sharp(input)
      .rotate()
      .resize({ width: 1400, height: 1500, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true, progressive: true })
      .toFile(output);
    const after = fs.statSync(output).size;
    console.log(`${f}: ${(before / 1e6).toFixed(2)}MB → ${(after / 1e6).toFixed(2)}MB`);
  }

  for (const f of files) {
    const from = path.join(outDir, f);
    const to = path.join(dir, f);
    try {
      fs.renameSync(from, to);
    } catch {
      fs.copyFileSync(from, to);
      fs.unlinkSync(from);
    }
  }
  try {
    fs.rmdirSync(outDir);
  } catch {
    /* ignore if not empty */
  }
  console.log('Done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
