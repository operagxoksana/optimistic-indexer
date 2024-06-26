import { arbitrumSepolia, base, baseSepolia, optimismSepolia } from 'viem/chains';
import { EventGroupIndexConfig } from '../models/indexer-chain-config';
import { configBase } from './indexing-config-base';
import { configBaseSepolia } from './indexing-config-base-sepolia';
import { configOptimismSepolia } from './indexing-config-optimism-sepolia';
import { configArbitrumSepolia } from './indexing-config-arbitrum-sepolia';

export function getEventGroupConfigs(
  chainId: number,
): Array<EventGroupIndexConfig> {
  switch (chainId) {
    case baseSepolia.id:
      return configBaseSepolia;
    case base.id:
      return configBase;
    case optimismSepolia.id:
      return configOptimismSepolia;
    case arbitrumSepolia.id:
      return configArbitrumSepolia;
  }
}
