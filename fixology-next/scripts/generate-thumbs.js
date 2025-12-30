/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..', 'public', 'devices');
const outRoot = path.join(root, 'thumbs');
const exts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif']);

/** Recursively collect image files under root, skipping the thumbs dir */
const collectFiles = (dir, acc) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.toLowerCase() === 'thumbs') continue;
      collectFiles(full, acc);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (exts.has(ext)) acc.push(full);
    }
  }
  return acc;
};

const toThumbPath = (absPath) => {
  const rel = path.relative(root, absPath).replace(/\\/g, '/');
  const withoutExt = rel.replace(/\.[^.]+$/, '');
  return path.join(outRoot, `${withoutExt}.webp`);
};

const main = async () => {
  const files = collectFiles(root, []);
  console.log(`Found ${files.length} source images under /public/devices`);
  let processed = 0;
  for (const file of files) {
    const outPath = toThumbPath(file);
    await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
    const img = sharp(file);
    const meta = await img.metadata();
    await img
      .resize(128, 128, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outPath);
    processed += 1;
    console.log(
      `thumb ${path.relative(root, file)} -> ${path.relative(root, outPath)} (${meta.width}x${
        meta.height
      })`,
    );
  }
  console.log(`Generated ${processed} thumbnails into /public/devices/thumbs`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

