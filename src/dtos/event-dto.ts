import { createUnionType, Field, Int, ObjectType } from '@nestjs/graphql';
import { Param } from '../models/event-entity';

@ObjectType()
export class EventDto {
  @Field() blockHash: string;
  @Field(type=> Int) blockNumber: number;
  @Field() transactionHash: string;
  @Field(type => Int) logIndex: number;
  @Field(type => Int) chainId: number;
  @Field(type => Int) timestamp: number;

  @Field() contractAddress: string;
  @Field() eventName: string;
  @Field() eventSignature: string;
  @Field(() => [ParamDto]) data: ParamDto[];
}

// export const ValueUnion = createUnionType({
//   name: 'ValueUnion',
//   types: () => [String, Number] as const,
// })
@ObjectType()
export class ParamDto {
  @Field() key: string;
  // @Field(() => ValueUnion) value: any;
}

