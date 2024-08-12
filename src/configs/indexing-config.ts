import { arbitrum, base, mainnet, optimism, optimismSepolia } from 'viem/chains';
import { EventGroupIndexConfig } from '../models/indexer-chain-config';
import { configBase } from './indexing-config-example-base';
import { configOptimism } from './indexing-config-example-optimism';
import { configArbitrum } from './indexing-config-example-arbitrum';
import { configMainnet } from './indexing-config-example-mainnet';

export function getEventGroupConfigs(
  chainId: number,
): Array<EventGroupIndexConfig> {
  switch (chainId) {
    case base.id:
      return configBase;
    case optimism.id:
      return configOptimism;
    case arbitrum.id:
      return configArbitrum;
    case mainnet.id:
      return configMainnet;
    default:
      throw new Error("Chain not supported");
  }
}
