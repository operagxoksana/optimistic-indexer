import { Model } from 'mongoose';
import { EventGroupIndexConfig, IndexerChainConfig, IndexerChainConfigDocument } from '../models/indexer-chain-config';
import { InjectModel } from '@nestjs/mongoose';
import { ethers } from 'ethers';
import { Injectable, Logger } from '@nestjs/common';
import { getEventGroupConfigs } from '../configs/indexing-config';
import { calculateBlockTimestamps, canCalculateBlockTimestamp } from '../block-timestamp.utils';

import { EventDocument, EventEntity, Param } from '../models/event-entity';
import { CHUNKED_CHAINS, NO_OF_WORKERS } from '../constants';
import Redlock, { Lock } from 'redlock';
import Client from 'ioredis';

const MONGO_DUPLICATE_KEY_ERROR_CODE = 11000;

@Injectable()
export class IndexerService {
  private logger = new Logger(IndexerService.name);

  private redlock: Redlock;

  private lock: Lock;
  private lockedIndex: number = 0;
  private chainsToIndex: number[];

  constructor(
    @InjectModel(IndexerChainConfig.name)
    private indexerChainConfigModel: Model<IndexerChainConfigDocument>,
    @InjectModel(EventEntity.name) private eventsModel: Model<EventDocument>,
  ) {
    const redisHost = process.env.REDIS_HOST;
    const redisPort = Number(process.env.REDIS_PORT);
    const redis = new Client({ host: redisHost, port: redisPort });
    this.redlock = new Redlock([redis]);
  }

  async runIndexer(): Promise<void> {
    await this._acquireLock();
    for (const chainId of this.chainsToIndex) {
      await this._indexOldEventsForNewlyAddedGroups(chainId);
    }

    while (true) {
      await this._acquireLock();
      const indexingPromises = this.chainsToIndex.map(
        async (chainId) => await this._indexNewlyProducedEvents(chainId),
      );
      await Promise.all(indexingPromises);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  private async _acquireLock() {
    if (this.lock && this.lock.expiration > Date.now()) {
      this.logger.log(`lock_has_not_expired_yet`);
      return;
    }
    for (let i = this.lockedIndex; ; i++) {
      if (i == NO_OF_WORKERS) {
        i = 0;
      }
      try {
        this.lock = await this.redlock.acquire([`${i}`], 5000);
        this.lockedIndex = i;
        this.chainsToIndex = CHUNKED_CHAINS[i];
        this.logger.log(`lock_acquired(index=${i}, chains=${this.chainsToIndex})`);
        break;
      } catch (e) {
        this.logger.warn(`lock_acquire_failed(index=${i})`);
      }
    }
  }

  private async _indexOldEventsForNewlyAddedGroups(
    chainId: number,
  ): Promise<void> {
    // get event groups for the chain id from config file
    const eventGroupConfigsFromConfig = getEventGroupConfigs(chainId);

    // get config from db
    const indexerChainConfig: IndexerChainConfig =
      await this.indexerChainConfigModel.findOne({
        chainId: chainId,
      });

    // end block number is either last indexed block for the chain by the indexer or latest block number for the chain
    const latestBlockNumber = await this._getLatestBlockNumber(chainId);
    const endBlockNumber =
      indexerChainConfig?.lastIndexedBlock ?? latestBlockNumber;

    // get existing event group ids in db
    const existingEventGroupIdsInDb =
      indexerChainConfig?.eventGroups?.map(
        (eventGroup) => eventGroup.groupId,
      ) ?? [];

    // newly added event groups
    const newlyAddedEventGroups = eventGroupConfigsFromConfig.filter(
      (eventGroup: EventGroupIndexConfig) =>
        !existingEventGroupIdsInDb.includes(eventGroup.groupId),
    );

    if (newlyAddedEventGroups.length == 0) {
      return;
    }

    for (const eventGroup of newlyAddedEventGroups) {
      this.logger.log(
        `indexing_old_events_for_group(${JSON.stringify(eventGroup, null, 2)})`,
      );

      const startTime = performance.now();
      const events = await this._getEventsForEventGroups(
        chainId,
        eventGroup.startBlock,
        endBlockNumber,
        [eventGroup],
      );
      try {
        await this.eventsModel.insertMany(events, {
          ordered: false,
        });
      } catch (error: any) {
        this.logger.error(error);
        if (error.code !== MONGO_DUPLICATE_KEY_ERROR_CODE) {
          throw error;
        }
      }

      const endTime = performance.now();
      this.logger.log(
        `indexed_old_events_for_newly_added_group(chainId=${chainId}, groupId=${
          eventGroup.groupId
        } from=${eventGroup.startBlock}, to=${endBlockNumber}, count=${
          events.length
        } timeTaken=${endTime - startTime} ms)`,
      );
    }

    await this.indexerChainConfigModel.updateOne(
      { chainId: chainId },
      {
        $set: {
          chainId: chainId,
          eventGroups: eventGroupConfigsFromConfig,
          lastIndexedBlock: endBlockNumber,
        },
      },
      {
        upsert: true,
      },
    );
  }

  private async _getLatestBlockNumber(chainId: number): Promise<number> {
    const provider = this._getProvider(chainId);
    return await provider.getBlockNumber();
  }

  private _getProvider(chainId: number): ethers.Provider {
    return new ethers.JsonRpcProvider(process.env[`RPC_URL_${chainId}`]);
  }

  private async _getBlock(
    chainId: number,
    blockNumber: number,
  ): Promise<ethers.Block> {
    const provider = this._getProvider(chainId);
    return await provider.getBlock(blockNumber);
  }

  private async _indexNewlyProducedEvents(chainId: number): Promise<void> {
    try {
      const startTime = performance.now();

      const latestBlockNumber = await this._getLatestBlockNumber(chainId);
      const indexerChainConfig = await this.indexerChainConfigModel.findOne({
        chainId: chainId,
      });

      const fromBlockNumber = indexerChainConfig.lastIndexedBlock + 1;
      const toBlockNumber = latestBlockNumber;

      // edge case when no new blocks have been mined
      if (fromBlockNumber > toBlockNumber) {
        return;
      }

      const events = await this._getEventsForEventGroups(
        chainId,
        fromBlockNumber,
        toBlockNumber,
        indexerChainConfig.eventGroups,
      );

      try {
        await this.eventsModel.insertMany(events, { ordered: false });
      } catch (error: any) {
        if (error.code !== MONGO_DUPLICATE_KEY_ERROR_CODE) {
          throw error;
        }
      }

      await this.indexerChainConfigModel.updateOne(
        { chainId: chainId },
        { $set: { lastIndexedBlock: toBlockNumber } },
      );

      const endTime = performance.now();
      this.logger.log(
        `indexed_new_events(chainId=${chainId}, from=${fromBlockNumber}, to=${toBlockNumber}, count=${
          events.length
        }, timeTaken=${endTime - startTime} ms)`,
      );
    } catch (error: any) {
      this.logger.error(
        `index_new_events_failed(chainId=${chainId}, error=${error.stack})`,
      );
    }
  }

  private async _getEventsForEventGroups(
    chainId: number,
    startBlock: number,
    endBlock: number,
    eventGroups: Array<EventGroupIndexConfig>,
  ): Promise<Array<EventEntity>> {
    const eventGroupsWithContractAddress = eventGroups.filter(
      (eventGroup) => eventGroup.contractAddress,
    );
    const eventGroupsWithoutContractAddress = eventGroups.filter(
      (eventGroup) => !eventGroup.contractAddress,
    );
    const logs = (
      await Promise.all([
        this._getLogsForEventGroups(
          eventGroupsWithContractAddress,
          chainId,
          startBlock,
          endBlock,
          true,
        ),
        this._getLogsForEventGroups(
          eventGroupsWithoutContractAddress,
          chainId,
          startBlock,
          endBlock,
          false,
        ),
      ])
    ).flat();

    const sortedLogs = logs.sort(
      (a, b) => a.blockNumber - b.blockNumber || a.index - b.index,
    );

    const blocks = await this._batchGetBlocks(
      chainId,
      sortedLogs.map((log) => log.blockNumber),
    );

    const events: Array<EventEntity> = [];
    for (const log of sortedLogs) {
      const block = blocks.find((block) => block.number === log.blockNumber);
      const parsedLog = this._getParsedLog(log, eventGroups);
      if (parsedLog == null) {
        continue;
      }
      const data: Array<Param> = parsedLog.fragment.inputs.map(
        (input, index) => {
          const value = parsedLog.args[index];
          return {
            key: input.name,
            value: this._expandRecursively(value, input),
          };
        },
      );
      const event: EventEntity = {
        blockHash: log.blockHash,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        logIndex: log.index,
        chainId: chainId,
        timestamp: block.timestamp,
        contractAddress: log.address,
        eventName: parsedLog.fragment.name,
        eventSignature: parsedLog.signature,
        data: data,
      };
      events.push(event);
    }
    return events;
  }

  private async _getLogsForEventGroups(
    eventGroups: Array<EventGroupIndexConfig>,
    chainId: number,
    startBlock: number,
    endBlock: number,
    contractAddressesAvailable: boolean,
  ) {
    if (eventGroups.length === 0) {
      return [];
    }
    if (
      (contractAddressesAvailable &&
        eventGroups.some((eventGroup) => !eventGroup.contractAddress)) ||
      (!contractAddressesAvailable &&
        eventGroups.some((eventGroup) => eventGroup.contractAddress))
    ) {
      throw new Error('Incorrect value passed for contractAddressesAvailable');
    }
    const eventSignatures = eventGroups
      .map((eventGroup) => eventGroup.eventSignatures)
      .flat();

    const uniqueEventSignatures = [...new Set(eventSignatures)];

    return await this._getLogsWithExponentialBackoff(
      chainId,
      startBlock,
      endBlock,
      contractAddressesAvailable
        ? eventGroups.map((eventGroup) => eventGroup.contractAddress)
        : undefined,
      this._getTopicsFromEventSignatures(uniqueEventSignatures),
    );
  }

  private async _getLogsWithExponentialBackoff(
    chainId: number,
    fromBlock: number,
    toBlock: number,
    contractAddresses: Array<string> | undefined,
    eventSignatureTopics: Array<string>,
  ): Promise<Array<ethers.Log>> {
    const provider = this._getProvider(chainId);

    const logs = new Array<ethers.Log>();
    let blockRange = toBlock - fromBlock;

    this.logger.log(
      `fetching_logs_with_exponential_backoff(chainId=${chainId}, from=${fromBlock}, to=${toBlock}, blockRange=${blockRange})`,
    );

    while (fromBlock <= toBlock) {
      try {
        const _logs = await provider.getLogs({
          fromBlock: BigInt(fromBlock),
          toBlock: BigInt(fromBlock + blockRange),
          address: contractAddresses,
          topics: [eventSignatureTopics],
        });
        logs.push(..._logs);
        fromBlock += blockRange + 1;
      } catch (error: any) {
        if (error.message.includes('not processed yet')) {
          // if block isn't processed yet, wait for 1 second and retry
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        if (!error.message.includes('Log response size exceeded')) {
          throw error;
        }
        blockRange = Math.floor(blockRange / 2);
        this.logger.error(
          `fetch_logs_failed(chainId=${chainId}, from=${fromBlock}, to=${
            fromBlock + blockRange
          }, blockRange=${blockRange}, error=${error.stack}`,
        );
      }
    }
    return logs;
  }

  private _getTopicsFromEventSignatures(eventSignatures: Array<string>) {
    const contractInterface: ethers.Interface = new ethers.Interface(
      eventSignatures,
    );
    const topics: string[] = [];

    for (const eventSignature of eventSignatures) {
      const eventFragment = contractInterface.getEvent(eventSignature);
      topics.push(eventFragment.topicHash);
    }
    return topics;
  }

  private async _batchGetBlocks(
    chainId: number,
    blockNumbers: Array<number>,
  ): Promise<
    Array<{
      number: number;
      timestamp: number;
    }>
  > {
    const uniqueBlockNumbers = [...new Set(blockNumbers)];

    if (canCalculateBlockTimestamp(chainId)) {
      return calculateBlockTimestamps(chainId, uniqueBlockNumbers);
    }

    const blocks: ethers.Block[] = [];

    const batchSize = 100;
    for (let i = 0; i < uniqueBlockNumbers.length; i += batchSize) {
      const batch = uniqueBlockNumbers.slice(i, i + batchSize);
      const promises = batch.map((blockNumber) =>
        this._getBlock(chainId, blockNumber),
      );
      blocks.push(...(await Promise.all(promises)));
    }
    return blocks.map((block) => ({
      number: block.number,
      timestamp: block.timestamp,
    }));
  }

  private _getParsedLog(
    log: ethers.Log,
    eventGroups: Array<EventGroupIndexConfig>,
  ): ethers.LogDescription {
    // Verify whether the log is from known contracts
    for (const eventGroup of eventGroups) {
      const contractInterface = new ethers.Interface(
        eventGroup.eventSignatures,
      );
      const topics = this._getTopicsFromEventSignatures(
        eventGroup.eventSignatures,
      );
      if (topics.includes(log.topics[0])) {
        const validLog =
          !eventGroup.contractAddress ||
          eventGroup.contractAddress === log.address;
        if (validLog) {
          return contractInterface.parseLog(log);
        }
      }
    }
    return null;
  }

  private _expandRecursively(data: any, input: ethers.ParamType): any {
    if (input.baseType === 'tuple') {
      return Object.fromEntries(
        input.components.map((component, index) => [
          component.name,
          this._expandRecursively(data[index], component),
        ]),
      );
    }
    if (input.baseType === 'array') {
      return data.map((element) =>
        this._expandRecursively(element, input.arrayChildren),
      );
    }
    if (typeof data === 'bigint') {
      return data.toString();
    }
    return data;
  }
}
