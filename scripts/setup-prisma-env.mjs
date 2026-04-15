import { mkdirSync, openSync, closeSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const generateOnly = process.argv.includes('--generate-only');

if (process.env.NODE_ENV !== 'production') {
  const sqliteDir = resolve(projectRoot, 'prisma', 'sqlite');
  const sqliteDbFile =
    process.env.NODE_ENV === 'test'
      ? resolve(sqliteDir, 'test.db')
      : resolve(sqliteDir, 'dev.db');

  mkdirSync(sqliteDir, { recursive: true });
  closeSync(openSync(sqliteDbFile, 'a'));
}

const run = (args) => {
  const result = spawnSync(process.execPath, ['scripts/run-prisma.mjs', ...args], {
    cwd: projectRoot,
    env: process.env,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

run(['generate']);

if (!generateOnly && process.env.NODE_ENV !== 'production') {
  run(['db', 'push', '--skip-generate']);
}
