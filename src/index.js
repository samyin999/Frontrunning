const chalk = require('chalk')
const blocknative = require('./blocknative')
const { watcher, txWatcher } = require('./watcher')
const isProfitable = require('./isProfitable')
const uniswap = require('./uniswap')
const emitter = blocknative.createEmitter()
const trieInit = require('./HelperFolders/trie')
const { getGas } = require('./HelperFolders/watcherValidator')
const { checkApprove, insertApprove } = require('./database/approvedToken')


//init function to start the script
const init = async () => {

    //loading all async varaibles
    let myTrie = await trieInit();
    let compareGas = await getGas()

    console.log("Starting Emitter")

    //Using the emmiter to watch from transactions in the mempool, Each transaction is sent out as an emmit

    emitter.on("txPool", async (event) => {
        // fillter the transactions base on preset conditions in watcher
        let filteredTransaction = await watcher(event, myTrie, compareGas)

        if (filteredTransaction !== undefined) {

            //calcualte if transaction is profitable
            let buyObj = await isProfitable(filteredTransaction);

            if (buyObj !== undefined) {

                //Once profitable transaction is found, terminate the emmiter so that the code doesnt get overloade
                blocknative.stopWatcher()

                // create a secondary emmiter on the transaction that I am frontunning so that I know when the tx finishes
                let txEmitter = await blocknative.createTransactionWatcher(filteredTransaction.txHash);
                let realBuyObj = buyObj.buyObj

                // filter for transactions above 6eth
                if(filteredTransaction.etherValue <= 6e18) {
                    console.log(chalk.red(`ether value less than 10, return 0`))
                    return 
                }

                console.log(chalk.green('Found profitable transaction, begin front running'))
                txEmitter.on("all", event => txWatcher(event, buyObj, buyObj.pairAddress, realBuyObj.gasPrice))

                // initiate purchase
                let buyTx = await uniswap.buyTokens(realBuyObj, buyObj.txHash)
                console.log(chalk.green('Purchase Complete! Checking for approve'))

                //checks to see if the token is approved
                if(!checkApprove(buyObj.pairAddress)){
                    await uniswap.getApprove(buyObj.token.address)
                    await insertApprove(buyObj.pairAddress)
                    console.log(chalk.green('Approved and insterted'))
                }
            }
        }
    })
}

init()

