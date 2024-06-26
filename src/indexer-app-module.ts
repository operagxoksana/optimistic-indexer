import { Module } from '@nestjs/common';

import {
  IndexerChainConfig,
  IndexerChainConfigSchema,
} from './models/indexer-chain-config';
import { IndexerService } from './services/indexer-service';
import { IndexerWarmupServiceV2 } from './indexer-warmup-service-v2';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEntity, EventSchema } from './models/event-entity';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: 'indexer.env', isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME,
    }),
    MongooseModule.forFeature([
      {
        name: EventEntity.name,
        schema: EventSchema,
      },
      {
        name: IndexerChainConfig.name,
        schema: IndexerChainConfigSchema,
      },
    ]),
  ],
  controllers: [],
  providers: [
    IndexerService,
    IndexerWarmupServiceV2,
  ],
  exports: [],
})
export class IndexerAppModule {}
