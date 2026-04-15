import { execFileSync } from 'child_process';
import { rm } from 'fs/promises';
import path from 'path';

global.beforeAll(async () => {
  try {
    await rm(path.join(__dirname, '..', 'prisma', 'sqlite', 'test.db'));
  } catch (error) {
    console.log('Error deleting prisma/sqlite/test.db', (error as Error).message);
  }

  execFileSync(process.execPath, ['scripts/setup-prisma-env.mjs'], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
    stdio: 'inherit',
  });
});
