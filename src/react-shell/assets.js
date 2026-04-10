import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const assetDirectory = join(process.cwd(), 'dist', 'assets');
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

export async function handleReactShellAssetRequest(pathname, response) {
  if (!pathname.startsWith('/assets/')) {
    return false;
  }

  const assetName = pathname.slice('/assets/'.length);

  if (!['react-shell.css', 'react-shell.js'].includes(assetName)) {
    return false;
  }

  try {
    const file = await readFile(join(assetDirectory, assetName));
    response.writeHead(200, {
      'content-type': contentTypes[extname(assetName)] ?? 'application/octet-stream',
    });
    response.end(file);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }

  return true;
}
