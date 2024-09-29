const trie = require('trie-prefix-tree');
const dbRetrieve = require('../database/tokenAdress')

// Generates the trie using data fetched from the Uniswap GraphQL database 
const getTrie = async () => {
    let myTrie = trie([])
    let data = await dbRetrieve()
    data.forEach(element => {
        myTrie.addWord(element.id)
    });
    return myTrie
}


const trieInit = async () =>{
    const myTrie = await getTrie()
    return myTrie
}

module.exports = trieInit
