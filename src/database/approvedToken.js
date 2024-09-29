const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/";
const axios = require("axios")


// Inserts tokens that Have been approved into the a database so that the code knows it doesnt have to be reapproved

const insertApprove = async (obj) => {

    const client = new MongoClient(url, { useUnifiedTopology: true })

    try {
        await client.connect();
        let dbo = client.db("frontRun");
        let collection = dbo.collection("approvedToken")
        await collection.insertOne(obj, async (err) => {
            if (err) throw err;
            console.log('Successfully inserted')
            await client.close()
        })
    } catch {
    }
}

// checks to see if a token as been approved 
const checkApprove = async (id) => {


    const client = new MongoClient(url, { useUnifiedTopology: true })

    try {
        await client.connect();
        let dbo = client.db("frontRun");
        let collection = dbo.collection("approvedToken")
        let ret = await collection.findOne({ id: id });
        if (ret !== null) {
            return true;
        } else {
            return false
        }
    } finally {
        await client.close();
    }

}

module.exports = {
    insertApprove,
    checkApprove
}