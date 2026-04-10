import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const serverEntry = resolve('src/server.js');

function waitForExit(child, timeoutMs = 1_000) {
  return new Promise((resolvePromise, rejectPromise) => {
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      rejectPromise(new Error('server did not exit before timeout'));
    }, timeoutMs);

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('exit', (code) => {
      clearTimeout(timer);
      resolvePromise({ code, stderr });
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      rejectPromise(error);
    });
  });
}

test('node src/server.js fails fast when React shell assets have not been built', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'qrstorage-server-start-'));

  try {
    const child = spawn(process.execPath, [serverEntry], {
      cwd,
      env: {
        ...process.env,
        PORT: '0',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const { code, stderr } = await waitForExit(child);

    assert.notEqual(code, 0);
    assert.match(stderr, /react shell assets/i);
    assert.match(stderr, /npm run build/i);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
