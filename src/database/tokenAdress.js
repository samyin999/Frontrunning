const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/";
const axios = require("axios")
const client = new MongoClient(url,{useUnifiedTopology: true})


// Sends a query to the uniswap api to get the most traded tokens of each day that has a daily trade volume of above 50000

const getData = async (pairID) => {
  let x = new Date()
  let UTCseconds = Math.floor((x.getTime() + x.getTimezoneOffset()*60*1000)/1000)

  let response = await axios({
    url: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2',
    method: 'post',
    data: {
      query:
  `  query test {
    tokenDayDatas (first: 1000 ,orderBy : dailyVolumeUSD , orderDirection : desc , 
    where : {
      date_gt : ${UTCseconds},
      dailyVolumeUSD_gt : 50000
    }){
      token{
        name
        id
      }
      dailyVolumeUSD
    }
  }`
    }
  })

  response = response.data.data.tokenDayDatas;

  for (let i = 0; i < response.length; i++) {
    response[i] = {
      id: response[i].token.id,
      name: response[i].token.name
    }
  }

  return response

}

// initailise a the database using getData

const dbInit = async () => {
  let data = await getData()
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("frontRun");
    dbo.collection("tokenWatchAddress").insertMany(data, function (err, res) {
      if (err) throw err;
      console.log("Number of documents inserted: " + res.insertedCount);
      db.close();
    });
  });
}

// Clears the colection

const dbClear = async () => {
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("frontRun");
    var myquery = { id: /\w+/ };
    dbo.collection("tokenWatchAddress").deleteMany(myquery, function (err, obj) {
      if (err) throw err;
      console.log(obj.result.n + " document(s) deleted");
      db.close();
    });
  });
}

//Retrieves and returns all elements of the collection as an array

const dbRetrieve = async () => {
  try {
    await client.connect();
    let dbo =  client.db("frontRun");
    let collection =  dbo.collection("tokenWatchAddress")
    let ret = await collection.find({}, { projection: { _id: 0, id: 1 } }).toArray();
    return ret
  } finally {
    await client.close();
  }

}

// Sometimes ran to resert the databases
const test = async () => {
  dbClear();
  dbInit();
}

// test()


module.exports = dbRetrieve;