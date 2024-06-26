import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ collection: 'events' })
export class EventEntity {
  @Prop() blockHash: string;
  @Prop() blockNumber: number;
  @Prop() transactionHash: string;
  @Prop() logIndex: number;
  @Prop() chainId: number;
  @Prop() timestamp: number;

  @Prop() contractAddress: string;
  @Prop() eventName: string;
  @Prop() eventSignature: string;
  @Prop() data: Param[];
}

export class Param {
  key: string;
  value: any;
}

export const EventSchema = SchemaFactory.createForClass(EventEntity);
export type EventDocument = EventEntity & mongoose.Document;

// for queries
EventSchema.index({
  chainId: 1,
  contractAddress: 1,
  eventName: 1,
  'data.key': 1,
  'data.value': 1,
});

// for uniqueness
EventSchema.index({ blockHash: 1, logIndex: 1 }, { unique: true });

// for sorting
EventSchema.index({ blockNumber: 1, logIndex: 1 });
