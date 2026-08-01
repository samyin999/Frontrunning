# Uniswap V2 Frontrunning Bot

An Ethereum bot that watched the public mempool for pending Uniswap V2 swaps, calculated whether getting in front of one would be profitable after costs, sized the trade, executed it, and unwound the position once the target transaction confirmed.

Built in 2023 when I was year 2 comp sci

Archived. It no longer works due to modern market conditions

## How it worked

| Stage | Module | What happens |
|-------|--------|--------------|
| Stream | `blocknative.js` | Blocknative emitter streams pending transactions from the mempool |
| Filter | `watcher.js`, `watcherValidator.js` | Discards anything not worth evaluating, using a trie lookup over indexed token addresses and a gas comparison |
| Evaluate | `isProfitable.js` | Pulls pool reserves and price data, models price impact, slippage and gas, and decides whether the trade clears the profit threshold |
| Size | `maximise.js` | Solves for the trade size that maximises return under the slippage constraint |
| Execute | `uniswap.js`, `uniswapApi.js` | Builds and submits the buy through the Uniswap SDK against the V2 router |
| Unwind | `watcher.js`, `cancel.js` | Sells once the target transaction confirms, cancels if it is dropped, stuck, cancelled or fails |

Orchestrated by `index.js`.

## The problems worth solving

### Deciding inside the block window

Every pending transaction is a decision with an expiry. Once the target lands, the opportunity is gone, so all filtering and modelling has to complete in the gap between seeing a transaction and it being mined.

Most pending transactions are irrelevant. The cheap rejection path matters more than the expensive evaluation path, so filtering runs first: a trie over token addresses indexed from a local database gives fast prefix matching to determine whether a transaction touches anything worth looking at, before any pool data is fetched or any modelling is done.

### Sizing the trade

Buying too little leaves profit on the table. Buying too much moves the price against yourself, since the price impact of your own trade is a function of the size of the pool you are trading into.

`maximise.js` solves this in closed form rather than searching. The optimal input is derived algebraically from the pool reserves, the slippage coefficient and the expected price increase, so sizing costs one calculation rather than an iterative search that the block window does not have room for.

### Surviving the trade not landing

The unglamorous half. A submitted transaction can be dropped, stuck, cancelled or fail outright, and each of those leaves you holding something you did not intend to hold.

The watcher tracks the lifecycle of every submitted transaction across five states and branches on the outcome: sell on confirmation, cancel on anything else. Failed transactions log their Etherscan URL so the failure can be inspected afterwards.

## Parameters

Values used in live testing:

| Parameter | Value | Reason |
|-----------|-------|--------|
| Gas premium | Target's gas price plus 40 gwei | Enough to sit ahead of the target transaction in the ordering |
| Profit threshold | $70 USD after gas | Below this the trade is not worth the execution risk |
| Slippage coefficient | 0.7 of maximum tolerated loss | Leaves margin against the target's own slippage tolerance |
| Position cap | 2 ETH | Hard limit on exposure while testing with real funds |

## Why this no longer works

The bot competes on gas price in a public mempool. That was the game in early 2023 and it is largely not the game now.

Transaction flow moved private. Services like Flashbots Protect and private RPC endpoints let users submit transactions without ever broadcasting them publicly, so the profitable opportunities stopped appearing in the mempool this bot watches. At the same time, extraction moved from open gas auctions to sealed bundle auctions through block builders, where the competition is over bundles submitted directly to builders rather than over gas price in public.

So the approach did not break because of a bug. The market structure it depended on was deliberately closed off, and any working version today would have to be built against block builders rather than the public mempool.

## Stack

JavaScript, Node.js, Uniswap V2 SDK, Blocknative mempool API, Ethers.
