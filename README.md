
## Indexer
This is a simple indexer which can index events from multiple chains and expose a GraphQL API to query indexed events.

## Installation

```bash
$ npm install
```

## Setting up the indexer
1. Create a `indexer.env` file in the root directory of the project by making a copy of `indexer.env.example` and provide values of the following
   > 1. `MONGO_URI` - Indexer uses MongoDB to store indexed events. Provide the connection string of the MongoDB instance you want to use.
   > 2. `DB_NAME` - database that indexer will use to store indexed events (optional, if not provided, `indexer` will be used)
   > 3. `RPC_URL_<CHAIN_ID>` - RPC URL of the chain you want to index events from. Replace `<CHAIN_ID>` with the id of the chain. You must provide RPC URL for each chain you want to index events from.


For each of the chains you want to index events from, there are 4 steps that need to be completed
1. Add a config file in `src/configs` directory, it should follow the format similar to examples provided (indexing-config-example-base.ts, indexing-config-example-optimism-sepolia.ts)
2. Add an event group for each contract you want to index events for in the config file (refer to examples provided in src/configs/indexing-config-example-base.ts and src/configs/indexing-config-example-optimism-sepolia.ts)
3. Add the chain in `indexing-config.ts` file (in switch case)
4. Add RPC URL for the chain in `indexer.env` file (described above)

## Building the indexer
```bash
$ npm run build
```

## Running the indexer
After adding an `indexer.env` file, you can run the indexer using the following command(s)
```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Support

Indexer is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please create an issue in the github repo.


## License

Indexer is [MIT licensed](LICENSE).
