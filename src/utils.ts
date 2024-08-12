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

export function divideArray(arr: any[], noOfSubArrays: number) {
  const result = Array.from({ length: noOfSubArrays }, () => []);
  for (let i = 0; i < arr.length; i++) {
    result[i % noOfSubArrays].push(arr[i]);
  }
  return result;
}
