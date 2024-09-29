const { Fetcher, Route, Token } = require('@uniswap/sdk');
const { ChainID, Weth, } = require('./uniswapConstants')




/* The uniswap router has 4 different token transfer functiosn 

exact eth to tokens
eth to exact tokens
exact tokens to tokens
tokens to exact tokens

Basically since my script trades in etherum, for me to be able to trade the token to token transactions,
I need to convert the input token to its respective value in this function

However, this script was never used since the process was very inaccuate and slow
*/
const amountMinCalc = (event, decimals) => {
    event = event.contractCall.params
    if(event.amountIn === undefined){
        event.amountIn = 0;
    } else{
        event.amountInMax = 0;
    }

    console.log((event.amountInMax + event.amountIn)/Math.pow(10,decimals))

    return (event.amountInMax + event.amountIn)/Math.pow(10,decimals);
}


const convertToEth = async (event,tokenAdress, decimals) => {

    let amountIn = amountMinCalc(event, decimals)

    let token = new Token(ChainID, tokenAdress, decimals)
    let pair = await Fetcher.fetchPairData(token, Weth);
    let route = new Route([pair], Weth);

    let priceTokenIn = route.midPrice.invert().toSignificant(6);

    let value = priceTokenIn * amountIn
    return value

}

module.exports = convertToEth