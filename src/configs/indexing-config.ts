import { base, optimismSepolia } from 'viem/chains';
import { EventGroupIndexConfig } from '../models/indexer-chain-config';
import { configBase } from './indexing-config-example-base';
import { configOptimismSepolia } from './indexing-config-example-optimism-sepolia';

export function getEventGroupConfigs(
  chainId: number,
): Array<EventGroupIndexConfig> {
  switch (chainId) {
    case base.id:
      return configBase;
    case optimismSepolia.id:
      return configOptimismSepolia;
  }
}
