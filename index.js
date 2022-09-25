const express = require('express');

require('dotenv').config()

const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId


app.use(cors());
app.use(express.json());
const admin = require("firebase-admin");

const port = process.env.PORT || 5000;


const serviceAccount = {
    type: process.env.FIREBASE_ADMIN_TYPE,
    project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
    private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
    auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI,
    token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL
};

admin.initializeApp({
    credential: admin.credential.cert((serviceAccount))
})






const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9hokh.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const tokenVerify = async (req, res, next) => {

    if (req.headers?.authorization?.startsWith("Bearer ")) {
        const token = req.headers.authorization.split(' ')[1];
        // console.log('verify TOken')

        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            // console.log("decodeUser", decodedUser)
            req.decodedEmail = decodedUser.email;
            // console.log("from tokenVerify ", req.decodedEmail);

        }
        catch {

        }
    }
    next()
}
async function run() {

    const database = client.db("DoctorsPortal");
    const service = database.collection("Service");
    const appointmentCollecton = database.collection("appointment");
    const usersCollecton = database.collection("users");

    try {

        // ...........................................
        // Added Service  from modal submit
        // ...........................................
        app.post('/appointment', async (req, res) => {
            const appointment = req.body;
            const result = await appointmentCollecton.insertOne(appointment)
            // console.log(result);
            res.json(result)
        })

        // ...........................................
        // modal added Service showing other Route 
        // ...........................................
        app.get('/appointments', tokenVerify, async (req, res) => {
            const email = req.query.email
            // console.log(date)
            // console.log('get method',req.decodedEmail, email);4
            if (req.decodedEmail === email) {
                const date = new Date(req.query.date).toLocaleDateString()
                const query = { email: email, date: date }

                const cursor = await appointmentCollecton.find(query)
                const result = await cursor.toArray()
                res.json(result)
            }
            // console.log(result)
            else {
                res.status(401).send('un-authorize')
            }
        })

        // ...........................................
        // Register new user Save to DB
        // ...........................................
        app.post('/users', async (req, res) => {
            const user = req.body
            // console.log(req.body);
            const result = await usersCollecton.insertOne(user)
            res.
                json(result)
        })

        // ...........................................
        // Checking Googlelog in user  new or Existing user. 
        // ...........................................
        app.put('/users', async (req, res) => {
            const user = req.body
            console.log(req.body);
            const filter = { email: user.email }
            const options = { upsert: true };
            const updatedoc = { $set: user }
            const result = await usersCollecton.updateOne(filter, updatedoc, options)
            res.json(result)
        })

        // ...........................................
        // Admin can make a new Admin 
        // ...........................................
        app.put('/make/admin', tokenVerify, async (req, res) => {


            const requesterEmail = req.decodedEmail;
            // console.log('requsterEmail ', requesterEmail)
            if (requesterEmail) {

                const requester = { email: requesterEmail }
                const requesterAccount = await usersCollecton.findOne(requester)
                if (requesterAccount.email === requesterEmail && requesterAccount.role === "admin") {
                    const user = req.body
                    const filter = { email: user.email }
                    const updatedoc = { $set: { role: 'admin' } }
                    const result = await usersCollecton.updateOne(filter, updatedoc)
                    res.json(result)
                }
            } else {
                res.status(403).json({ messeage: "don't  accecss this route" })
            }
        })

        // ...........................................
        // checking logging user isAdmin or not Admin 
        // ...........................................
        app.get('/checkuser/admin/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            // console.log(query)
            const user = await usersCollecton.findOne(query)

            let isAdmin = false
            if (user?.role) {
                isAdmin = true
            }
            res.json({ isAdmin })
        })


        app.delete('/delete/appointments', async (req, res) => {
            const id = (req.body.id)
            const query = { _id: ObjectId(id) }

            const result = await appointmentCollecton.deleteOne(query);
            // console.log(result);
            if (result.deletedCount === 1) {
                res.status(202).json(result)
            }
            else {
                res.status(400)
            }
        })
    }

    finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send({ Message: 'HELLO WORLD' })
});
app.listen(port, () => {
    console.log("listen at", port);
})