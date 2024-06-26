import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { IndexerService } from './services/indexer-service';

@Injectable()
export class IndexerWarmupServiceV2 implements OnApplicationBootstrap {
  constructor(private indexerServiceV2: IndexerService) {}

  async onApplicationBootstrap(): Promise<any> {
    this.indexerServiceV2.runIndexer();
  }
}
