import { access, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { startServer } from './app.js';

async function ensureReactShellAssetsExist() {
  const assetPaths = [join(process.cwd(), 'dist', 'assets', 'react-shell.css'), join(process.cwd(), 'dist', 'assets', 'react-shell.js')];

  try {
    await Promise.all(assetPaths.map((path) => access(path)));
  } catch {
    throw new Error('React shell assets are missing. Run `npm run build` before starting the server.');
  }
}

const port = Number(process.env.PORT ?? 3000);
const dataDir = process.env.DATA_DIR ?? join(process.cwd(), '.data');

await ensureReactShellAssetsExist();
await mkdir(dataDir, { recursive: true });
const baseUrl = process.env.APP_BASE_URL;
const server = await startServer({ dataDir, port, baseUrl });

console.log(`qrstorage_app listening on http://127.0.0.1:${server.port}`);
