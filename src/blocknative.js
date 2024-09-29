require('dotenv').config()


//Initialises all the blockNative constants that I work with in this project

const BlocknativeSdk = require('bnc-sdk');
const WebSocket = require('ws');

const options = {
    dappId: process.env.DAPPID9,
    networkId: 1,
    transactionHandlers: [],
    ws: WebSocket
}

const blocknative = new BlocknativeSdk(options)


// creates emitter for uniswap
const createEmitter = () => {
    const {
        emitter,
        details
    } = blocknative.account(process.env.UNISWAP)

    return emitter
}


// creates emitter for the account that I am frontrunning 
const createTransactionWatcher = async (hash) => {

    const {
        emitter,
        details
    } = blocknative.transaction(hash)

    return emitter
}

// stops emmit 
const stopWatcher = () => {
    blocknative.unsubscribe(process.env.UNISWAP)
}
module.exports = {
    createEmitter,
    createTransactionWatcher,
    stopWatcher
}
