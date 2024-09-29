require('dotenv').config()
const chalk = require('chalk')
const uniswap = require('./uniswap')
const { Weth } = require('./HelperFolders/uniswapConstants')
const percentageChange = require('./uniswapApi')
const maximise = require('./maximise')

//Given a filtered transaction, It assess the profitability of the transaction if I were to frontrun it
const isProfitable = async (filteredTransaction) => {
    let etherValue = filteredTransaction.etherValue/1e18;
    let tokenOutAmount = filteredTransaction.amountOutMin/Math.pow(10,filteredTransaction.decimals)

    // returns me the token and pair data
    let { token, pair } = await uniswap.getData(filteredTransaction)

    // calls the uniswap api to calculate how the transaction will affect the overall price and get the data of the liquidity pool
    let { priceIncrease, eth, pairToken } = await percentageChange(pair.liquidityToken.address.toLowerCase(), etherValue, tokenOutAmount)

    // exit if abritrage/calcuation error happens 2% of the time due to include include libraries
    if(priceIncrease <0) return undefined
    let MaximumEtherLoss = etherValue - (eth.price * tokenOutAmount)
    if (MaximumEtherLoss < 0) {
        console.log(chalk.red('undefined slippage'))
        return undefined
    }
    let slippage = 1 + ((MaximumEtherLoss / etherValue) * 0.7);

    let willingToLoseUsd = MaximumEtherLoss * process.env.ETHPRICE

    let GasCost = ((filteredTransaction.gasPrice + 40e9) / 25e8)

    // console longs for me to keep track of KPIs
    console.log(chalk.blue("Price increase : " + priceIncrease))

    console.log(chalk.blue("Maximumu ether loss : " + MaximumEtherLoss))

    console.log(chalk.blue("Etherum value :" + etherValue))

    console.log(chalk.blue(`Willing to lose usd : ${willingToLoseUsd} GasCost  = ${GasCost}`))

    // used for me to calcuate the amount of etherum I should buy in to maximise my profits 
    let x = await maximise(eth, pairToken, slippage, priceIncrease)

    let theoreticalProfit = x * priceIncrease * process.env.ETHPRICE

    console.log(chalk.magenta.bold("theoretical - gascost : " + (theoreticalProfit - GasCost)))

    // final check, if the money I make is minus cost is greater than 70, I purchase
    if (parseFloat(theoreticalProfit) - GasCost > 70) {
        console.log(chalk.green('found profitable transaction, passing back buyObj'))
        let trade = uniswap.getTrade(pair, Weth, x * 1e18)
        return {
            buyObj: await uniswap.getBuyObj(filteredTransaction, trade, token),
            pairAddress : pair.liquidityToken.address.toLowerCase(),
            txHash : filteredTransaction.txHash,
            pair,
            token
        }
    }
    return undefined
}




module.exports = isProfitable