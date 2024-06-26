import { registerEnumType } from '@nestjs/graphql';

export enum SortDirection {
  ASC,
  DESC
}

registerEnumType(SortDirection, {
  name: 'SortDirection',
});