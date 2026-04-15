import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const nodeEnv = process.env.NODE_ENV ?? 'development';

const schemaByEnv = {
  production: resolve(projectRoot, 'prisma/postgresql/schema.prisma'),
  development: resolve(projectRoot, 'prisma/sqlite/schema.prisma'),
  test: resolve(projectRoot, 'prisma/sqlite/schema.prisma'),
};

const envFileByEnv = {
  production: resolve(projectRoot, '.env.production'),
  development: resolve(projectRoot, '.env.development'),
  test: resolve(projectRoot, '.env.test'),
};

const schemaPath = schemaByEnv[nodeEnv];
const envFilePath = envFileByEnv[nodeEnv];

if (!schemaPath) {
  throw new Error(`Unsupported NODE_ENV "${nodeEnv}" for Prisma commands.`);
}

if (existsSync(envFilePath)) {
  const envLines = readFileSync(envFilePath, 'utf8').split(/\r?\n/);

  for (const line of envLines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, '');

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const prismaArgs = process.argv.slice(2);

if (prismaArgs.length === 0) {
  throw new Error('Expected Prisma CLI arguments.');
}

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['prisma', ...prismaArgs, '--schema', schemaPath],
  {
    cwd: projectRoot,
    env: process.env,
    stdio: 'inherit',
  },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 0);
