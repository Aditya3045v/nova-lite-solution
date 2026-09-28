// Copies shared brand/icons/media into the storefront's public folder (Next.js
// cannot point public/ elsewhere). The Vite apps use packages/assets/public directly.
import { cpSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'packages', 'assets', 'public');
const dest = join(root, 'apps', 'storefront', 'public');
for (const dir of ['media', 'brand', 'icons']) {
  mkdirSync(join(dest, dir), { recursive: true });
  cpSync(join(src, dir), join(dest, dir), { recursive: true });
}
console.log('synced shared media into apps/storefront/public');
