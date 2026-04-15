import { MiddlewareConsumer, Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import cookieSession from 'cookie-session';
import { AppController } from 'src/app.controller';
import { AppService } from 'src/app.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ReportsModule } from 'src/reports/reports.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true, // This will remove any properties that are not in the DTO from the request body.
      }),
    },
  ],
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),
    PrismaModule,
    UsersModule,
    ReportsModule,
    // MessagesModule,
    // ComputerModule,
    // CpuModule,
    // DiskModule,
    // PowerModule,
  ],
})
export class AppModule {
  constructor(private configService: ConfigService) {}
  /**
   * NOTE: Configure the middleware for the app.
   */
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        cookieSession({
          keys: [this.configService.get<string>('COOKIE_KEY')],
        }),
      )
      .forRoutes('*'); // NOTE: This will apply the middleware to all routes.
  }
}
