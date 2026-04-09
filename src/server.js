import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { startServer } from './app.js';

const port = Number(process.env.PORT ?? 3000);
const dataDir = process.env.DATA_DIR ?? join(process.cwd(), '.data');

await mkdir(dataDir, { recursive: true });
const server = await startServer({ dataDir, port });

console.log(`qrstorage_app listening on http://127.0.0.1:${server.port}`);
