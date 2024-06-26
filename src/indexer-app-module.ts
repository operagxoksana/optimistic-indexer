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
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { EventResolver } from './services/event-resolver';
import { EventService } from './services/event-service';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
    }),
    ConfigModule.forRoot({ envFilePath: 'indexer.env', isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME ?? 'indexer',
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
    EventService,
    EventResolver
  ],
  exports: [],
})
export class IndexerAppModule {}
