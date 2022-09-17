const express = require('express');
require('dotenv').config()
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');

const port =process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9hokh.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
// const uri = "mongodb+srv://<username>:<password>@cluster0.9hokh.mongodb.net/?retryWrites=true&w=majority";


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
app.get("/", (req, res) => {
    res.send('xyz')
});

async function run() {
    
    try {
        const database = client.db("DoctorsPortal");
        const haiku = database.collection("Service");
        // create a document to insert
        const doc = {
            title: "Record of a Shriveled Datum",
            content: "No bytes, no problem. Just insert a document, in MongoDB",
        }
        const result = await haiku.insertOne(doc);
        console.log(`A document was inserted with the _id: ${result.insertedId}`);
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log("listenin at",port);
})