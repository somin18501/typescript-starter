import { rm } from 'fs/promises';
import path from 'path';

global.beforeAll(async () => {
  try {
    await rm(path.join(__dirname, '..', 'test.sqlite'));
  } catch (error) {
    console.log('Error deleting test.sqlite', (error as Error).message);
  }
});
