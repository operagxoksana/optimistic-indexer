import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export class EventGroupIndexConfig {
  groupId: string;
  eventSignatures: Array<string>;
  contractAddress?: string;
  startBlock: number;
}

@Schema({ collection: 'indexer-chain-configs' })
export class IndexerChainConfig {
  @Prop() chainId: number;
  @Prop() lastIndexedBlock: number;
  @Prop() eventGroups: Array<EventGroupIndexConfig>;
}

export type IndexerChainConfigDocument = IndexerChainConfig & Document;
export const IndexerChainConfigSchema =
  SchemaFactory.createForClass(IndexerChainConfig);

IndexerChainConfigSchema.index({ chainId: 1 }, { unique: true });
