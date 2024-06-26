import { base, baseSepolia, optimismSepolia } from 'viem/chains';

const chainIdToKnownBlockTimestampMapping = [
  {
    chainId: base.id,
    blockNumber: 0,
    timestamp: 1686789347,
    blockInterval: 2,
  },
  {
    chainId: baseSepolia.id,
    blockNumber: 0,
    timestamp: 1695768288,
    blockInterval: 2,
  },
  {
    chainId: optimismSepolia.id,
    blockNumber: 0,
    timestamp: 1691802540,
    blockInterval: 2,
  },
];

export function canCalculateBlockTimestamp(chainId: number) {
  return chainIdToKnownBlockTimestampMapping.some(
    (chain) => chain.chainId === chainId,
  );
}

export function calculateBlockTimestamps(
  chainId: number,
  blockNumbers: number[],
) {
  const chain = chainIdToKnownBlockTimestampMapping.find(
    (chain) => chain.chainId === chainId,
  );
  return blockNumbers.map((blockNumber) => ({
    number: blockNumber,
    timestamp:
      chain.timestamp + (blockNumber - chain.blockNumber) * chain.blockInterval,
  }));
}
