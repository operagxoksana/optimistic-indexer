export const configOptimismSepolia = [
  {
    groupId: 'BridgingEvents',
    eventSignatures: [
      'event MessageOutbound(uint32 localChainSlug, address localPlug, uint32 dstChainSlug, address dstPlug, bytes32 msgId, uint256 minMsgGasLimit, bytes32 executionParams, bytes32 transmissionParams, bytes payload, (uint128 transmissionFees, uint128 executionFee, uint128 switchboardFees) fees)',
    ],
    contractAddress: '0xEA59E2b1539b514290dD3dCEa989Ea36279aC6F2',
    startBlock: 10766817,
  },
];
