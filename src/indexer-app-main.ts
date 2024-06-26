import { NestFactory } from '@nestjs/core';
import { IndexerAppModule } from './indexer-app-module';

async function bootstrap() {
  const app = await NestFactory.create(IndexerAppModule);
  app.enableCors();
  app.enableShutdownHooks();
  await app.listen(2329);
}

bootstrap();
