# FrontRuning


This script was designed to frontrun transactions from the Uniswap V2 Router. 

It spys on the mempool using blocknative and calcualtes a best buy to maximise revenue. 

The sequence of events are outlined in the index.js which is the centre of the entire script.

A blocknative emitter emmits out transactions from the mempool. These are then filtered by the watcher, which only allows in transactions that meet certain criterias. 

These transactions are then passed through an isProfitable function, which calcates if the transaction is worth frontrunning. 

Finally, the data is passed through to the Uniswap router and using their SDK is able to initialise purchases and selling. 


ISSUES that I am aware of

I had no experiences with emmiters when I started the project. So my two emmiter method in index.js was a probabbly not a good solution.
The reason why I initialised the emitter before the buy is because buying takes time, and I want the emitter to be able to cancel my transaction if something were to go wrong. 

I also has the sell function in the emitter because I had to wait untill their transaction to be finished so that It could affect the sale price before I sold the tokens

A lot of the older code that was writen prior have not been refactored with new knowledge such as the if(condition) return

I was very liberal with my use of async and await methods because I wasnt sure which part of my code would be asyncronous. I am aware that It is more costly than regular functions
