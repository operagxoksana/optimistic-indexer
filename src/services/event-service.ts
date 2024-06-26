import { InjectModel } from '@nestjs/mongoose';
import { EventDocument, EventEntity } from '../models/event-entity';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { SortDirection } from '../sort-direction';

@Injectable()
export class EventService {
  constructor(@InjectModel(EventEntity.name) private eventModel: Model<EventDocument>) {
  }

  async getEvents(chainId: number, contractAddress: string, sortDirection: SortDirection, eventName?: string): Promise<EventEntity[]> {
    const query = {
      chainId,
      contractAddress,
    };

    if (eventName) {
      query['eventName'] = eventName;
    }
    const sort = sortDirection === SortDirection.ASC ? 1 : -1;

    return this.eventModel.find(query).sort({ blockNumber: sort, logIndex: sort }).exec();
  }
}