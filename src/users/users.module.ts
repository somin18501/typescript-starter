import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AuthService } from 'src/users/auth.service';
import { CurrentUserMiddleware } from 'src/users/middlewares/current-user.middleware';
import { UsersController } from 'src/users/users.controller';
import { UsersService } from 'src/users/users.service';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    AuthService,
    // { provide: APP_INTERCEPTOR, useClass: CurrentUserInterceptor }, // NOTE: This will be applied to all the controllers.
  ],
})
export class UsersModule {
  /**
   * NOTE: Moving the current user interceptor to the middleware as we need to access the user in AdminGuard.
   */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CurrentUserMiddleware).forRoutes('*'); // NOTE: This will apply the middleware to all routes.
  }
}

// Order of execution of middlewares:
// 1. Global middleware
// 2. Custom middleware
// 3. Guard
// 4. Interceptor
