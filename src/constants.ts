import { arbitrum, base, mainnet, optimism } from 'viem/chains';
import { divideArray } from './utils';

export const NO_OF_WORKERS = 3;

export const SUPPORTED_CHAIN_IDS = [base.id, arbitrum.id, mainnet.id, optimism.id];

export const CHUNKED_CHAINS = divideArray(SUPPORTED_CHAIN_IDS, NO_OF_WORKERS);
