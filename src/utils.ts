import { EventEntity } from './models/event-entity';

export function getParamValue(
  event: EventEntity,
  paramKey: string,
  defaultValue?: any,
): any {
  const param = event.data.find((p) => p.key === paramKey);
  if (param) {
    return param.value;
  } else if (defaultValue !== undefined) {
    return defaultValue;
  }
  return;
}