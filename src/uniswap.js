const { ChainID, BuyTolerance, SellTolerance, Ethers, Weth, Buy, Sell } = require('./HelperFolders/uniswapConstants')
const { Trade, TokenAmount, Route, Token, TradeType, Pair } = require('@uniswap/sdk');
const EtherscanUrl ='https://etherscan.io/tx/'

/* This file consists of the default constants from the uniswap SDKs that have been modified to suit my needs */



// basically initialises the my input eth and the minimum output tokens I am willing to accept
const getInputOutput = (trade, tolerance) => {
    let amountOutMin = trade.minimumAmountOut(tolerance).raw;
    let amountOutMinHex = Ethers.BigNumber.from(amountOutMin.toString()).toHexString();
    let inputAmount = trade.inputAmount.raw;
    let inputAmountHex = Ethers.BigNumber.from(inputAmount.toString()).toHexString();

    return {
        amountOutMinHex: amountOutMinHex,
        inputAmountHex: inputAmountHex
    }
}

// returns trade object
const getTrade = (pair, token, amount) => {

    let route = new Route([pair], token);
    let trade = new Trade(route, new TokenAmount(token, BigInt(amount)), TradeType.EXACT_INPUT);
    return trade
}

// uses ethers.contract to call a solidity code that allows me to approve a token for selling 
const getApprove = async (address) => {
    const approveFunction = new Ethers.Contract(
        address,
        ['function approve(address _spender, uint256 _value) public returns (bool success)'],
        account
    )
    console.log('Object created')
    await approveFunction.approve(process.env.TO,
        {
            gasPrice: 122e9, // fix
            gasLimit: Ethers.BigNumber.from(500000).toHexString()
        })
    console.log('Approved')
}

// get token and pair data from filtered transaction
const getData = async (filteredTransaction) => {

    let token = new Token(ChainID, filteredTransaction.tokenOut, filteredTransaction.decimals)
    let buyAmount = Math.round(filteredTransaction.amountOutMin*1e5*1.02)
    
    let ethAmount = Math.round(filteredTransaction.etherValue*1e5)

    let buyTA = new TokenAmount(token, BigInt(buyAmount));
    let ethTA = new TokenAmount(Weth, BigInt(ethAmount))
    let pair = new Pair ( ethTA,buyTA)


    return {
        token,
        pair,
    }
}

// sets the trade path
const getPath = (tokenFrom, tokenTo) => {
    return [tokenFrom.address, tokenTo.address]
}

// creates the final buy object
const getBuyObj = async (filteredTransaction, trade, token) => {

    let { inputAmountHex, amountOutMinHex } = getInputOutput(trade, BuyTolerance)
    let path = getPath(Weth, token)

    let txObj = {
        // frontRunningHash : filteredTransaction.txHash,
        amountOutMinHex: amountOutMinHex,
        inputAmountHex: inputAmountHex,
        path: path,
        deadline: Math.floor(Date.now() / 1000) + 60 * 10,
        gasPrice: filteredTransaction.gasPrice + 30e9
    }

    return txObj;

}

// creates the sell object using the buy object
const getSellObj = (token, pair, buyObj) => {
    let trade = getTrade(pair, token, buyObj.buyObj.amountOutMinHex)

    let amountOutMinHex = getInputOutput(trade, SellTolerance)

    let path = getPath(token, Weth)

    let txObj = {
        amountIn: buyObj.buyObj.amountOutMinHex,
        amountOutMinHex: amountOutMinHex.amountOutMinHex,
        path: path,
        deadline: Math.floor(Date.now() / 1000) + 60 * 10,
        gasPrice: buyObj.gasPrice + 10e9
    }

    return txObj;

}

// uses the buyObj to initialise the purchase of token using the uniswap SDk
const buyTokens = async (buyObj,txHash) => {
    console.log('Buying')
    let tx = await Buy.swapExactETHForTokens(
        buyObj.amountOutMinHex,
        buyObj.path,
        process.env.TO,
        buyObj.deadline,
        {
            value: buyObj.inputAmountHex,
            gasPrice: buyObj.gasPrice,
            gasLimit: Ethers.BigNumber.from(500000).toHexString()
        });
    let ret = await tx.wait()
    console.log(`Transaction has Finished\n`)
    console.log(`Their txHash = ${EtherscanUrl}${txHash} \n `)


    return ret
}

// uses the sellObj to initialise the sale of  the bought token using the uniswap SDk
const sellTokens = async (sellObj) => {
    let tx = await Sell.swapExactTokensForETH(
        sellObj.amountIn,
        sellObj.amountOutMinHex,
        sellObj.path,
        process.env.TO,
        sellObj.deadline,
        {
            gasPrice: sellObj.gasPrice,
            gasLimit: Ethers.BigNumber.from(500000).toHexString()
        });

    let reciept = await tx.wait();
    return reciept
}




module.exports = {
    sellTokens,
    buyTokens,
    getData,
    getApprove,
    getTrade,
    getBuyObj,
    getSellObj,
    Weth,
    ChainID,
}

const test = async () => {



    // let glitch = await Fetcher.fetchTokenData(ChainID, '0x09fd164ce0c587b433ab4a7753d4e6e8ed9e8f5f');
    // let dai = await Fetcher.fetchTokenData(ChainID, '0x6b175474e89094c44da98b954eedeac495271d0f')
    // let pair = await Fetcher.fetchPairData(dai, Weth);

    // let trade = getTrade(pair, Weth, 1e15)
    // console.log(trade);

    // let amountOutMin = trade.minimumAmountOut(BuyTolerance).raw;
    // let amountOutMinHex = Ethers.BigNumber.from(amountOutMin.toString()).toHexString();
    
    // let inputAmount = trade.inputAmount(BuyTolerance).raw
    // let inputAmountHex = Ethers.BigNumber.from(inputAmount.toString()).toHexString();

    // let path = getPath(token, Weth)

    // let tx = await Buy.swapExactETHForTokens(
    //     amountOutMinHex,
    //     path,
    //     process.env.TO,
    //     buyObj.deadline,
    //     {
    //         value: inputAmountHex,
    //         gasPrice: 1,
    //         gasLimit: Ethers.BigNumber.from(500000).toHexString()
    //     });

//     await tx.wait()
//     console.log(`Approve token for selling! \n`)



//     process.exit("Transaction FInished")
// }
}

// test()