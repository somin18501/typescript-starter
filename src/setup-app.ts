import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieSession from 'cookie-session';

/**
 * NOTE: Setup the app with the necessary middleware and pipes.
 */
export const setupApp = (app: INestApplication) => {
  app.use(
    cookieSession({
      keys: ['qwerty'],
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // This will remove any properties that are not in the DTO from the request body.
    }),
  );
};
