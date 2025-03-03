<div align="center">
    <h1 align="center">Iris Cardano DEX Indexer</h1>
</div>

## What is Iris?

Iris is a Cardano DEX data aggregator, which indexes all DEX related data such as the following :

- Swaps
- Deposits
- Withdraws
- Zaps
- Order cancellations of the above
- Liquidity Pools
- Liquidity Pool states
- Pooled assets
- Order books
- Order book orders & cancellations
  <br>
  <br>
  For all of this data, Iris also supplies a uniform API & websocket feed.

## Requirements

- MySQL database for storing indexed DEX operations
- Ogmios instance for indexing Cardano transactions

## Setup

1. Build the project.

```
npm run build
```

2. Copy the `.env.example` file to `.env`
3. Set up a new MySQL database & supply the connection info in the created `.env` file.
4. Set up an [Ogmios](https://ogmios.dev/) instance & supply the connection info in the created `.env` file.

## Running

#### Indexer

Run just the Iris indexer.

```
npm run indexer
```

#### API

Run just the Iris API.

```
npm run api
```

#### Tests

Run the automated tests.

```
npm run test
```

## Notes

- Liquidity pools often change addresses on-chain, however Iris will automatically update the liquidity pool to the updated address. This also applies to order addresses.
- Some assets have registered metadata for their logos, ticker, etc. You can supply a `GITHUB_ACCESS_TOKEN` in the `.env` file so this metadata can be fetched from the [Cardano Token Registry](https://github.com/cardano-foundation/cardano-token-registry).
- You may see some errors thrown in the error logs related to database inserting - This is done to prevent race-cases duplicating data in the database & should not cause any issues.
- Orderbook DEXs still need some validating & testing.

## Components

#### Indexers (/src/indexers/)

Indexers simply take in a raw transaction from Ogmios, format it, and sends it over all the DEX analyzers.
<br>

#### Analyzers (/src/dex/)

Each DEX has its own analyzer, which filters out related transactions & operations like swaps, deposits, etc.
<br>
Depending on the type of DEX, they inherit the BaseAnalyzer of their type: AMM, Order Book, Hybrid.
Hybrid analyzers are strictly used for DEXs that support both liquidity pools & order books, such as MuesliSwap.
<br>
<br>
The route for a transaction in which has a swap order for example, follows this flow :

1. Transaction is sent to each analyzer
2. Swap order is picked up by the appropriate DEX analyzer (Others will ignore)
3. Order is sent back the operation indexer, which is then pushed out to its handler
4. Order is linked to the appropriate pool & saved in the DB, and sent over the websocket
   <br>

#### Handlers (/src/handlers/)

For each DEX type (AMM, Order Book, Hybrid), there is a corresponding handler. Handlers take in found DEX operations,
and handle linking the operation to a liquidity pool or order book. Then, the fully built operation is pushed over the websocket.

#### API (/src/api/)

Iris contains many API controllers & endpoint resources to handle REST API calls. Each entity type has its own resource file to correctly
format the entity for JSON and websocket responses. To mitigate the data sent over the websocket feed, the attributes for the entities use a shorthand name. You dont have to worry about this using the [SDK](https://github.com/IndigoProtocol/iris-sdk) as the entities are rebuilt client side.
<br>
<br>
You can find API endpoint documentation in the `openapi.yaml` file here `docs/openapi.yaml` or by visiting the [OpenAPI](https://app.swaggerhub.com/apis/zsluder/Iris/1.0.0) spec.

## Expanding Iris

After each operation creation or update, an event is pushed out to all event listeners supplied to Iris at boot time.
With that, you can supply your own listeners & act on specific events that have occured within Iris.

Iris supports custom indexers and event listeners. Below is an example snippet on how you can supply your own logic with Iris as a subproject :

```js
const app: IndexerApplication = new IndexerApplication(
  new CustomCacheService(),
  [new CustomIndexer()]
);

app.withEventListeners([new CustomEventListener(app)]);

await app
  .start()
  .then(() => {
    logInfo('Indexer started');
  })
  .catch((reason) => {
    logError(`Indexer failed to start : ${reason}`);
  });
```

Iris also supports you supplying your own API controllers :

```js
const app: ApiApplication = new ApiApplication([
  new CustomController('/custom'),
]);
```

Iris also has a [TypeScript SDK](https://github.com/IndigoProtocol/iris-sdk), which you can install & easily interact with the Iris API or websocket.

## Websocket Feed

Iris provides a real-time websocket feed for DEX related operations. Event types you can listen for
are provided in `src/events.types.ts`. These events are sent over the feed are minified, however are 're-humanified' through
the [Iris SDK](https://github.com/IndigoProtocol/iris-sdk).

Default port for the websocket feed is `8080`, and can be overwritten through the `OPERATION_WEBSOCKET_PORT` variable
specified in the `.env` file.
