# FrontRuning

Extremely outdated frontrunning bot, do not use.

old description:

This script was designed to frontrun transactions from the Uniswap V2 Router. 

It spys on the mempool using blocknative and calcualtes a best buy to maximise revenue. 

The sequence of events are outlined in the index.js which is the centre of the entire script.

A blocknative emitter emmits out transactions from the mempool. These are then filtered by the watcher, which only allows in transactions that meet certain criterias. 

These transactions are then passed through an isProfitable function, which calcates if the transaction is worth frontrunning. 

Finally, the data is passed through to the Uniswap router and using their SDK is able to initialise purchases and selling. 
