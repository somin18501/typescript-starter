// import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
// import { MessagesModule } from 'src/messages/messages.module';
// import { ComputerModule } from 'src/computer/computer.module';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
// import { setupApp } from 'src/setup-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule); // NestExpressApplication if used as generic app object will have methods available exclusively for that specific platform.
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);
  // setupApp(app); // NOTE: This is recommended by nestjs documentation but for testing we need to setup it in appModule.
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
