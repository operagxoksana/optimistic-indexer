import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { EventDto } from '../dtos/event-dto';
import { EventService } from './event-service';
import { Injectable } from '@nestjs/common';
import { SortDirection } from '../sort-direction';

@Resolver(of => EventDto)
@Injectable()
export class EventResolver {
  constructor(private eventService: EventService) {
  }

  @Query(returns => [EventDto])
  queryEvents(
    @Args('chainId', { type: () => Int }) chainId: number,
    @Args('contractAddress') contractAddress: string,
    @Args('eventName', { type: () => String, nullable: true }) eventName?: string,
    @Args('sortDirection', {
      type: () => SortDirection,
      nullable: true,
      defaultValue: SortDirection.ASC,
    }) sortDirection?: SortDirection,
  ): Promise<EventDto[]> {
    return this.eventService.getEvents(chainId, contractAddress, sortDirection, eventName);
  }
}