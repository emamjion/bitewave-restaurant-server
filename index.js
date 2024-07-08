const express = require('express');
require('dotenv').config()
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;


// Middlewares
app.use(express.json());
app.use(cors());


/* ----------------------------------- MongoDB Code Here ----------------------------------- */


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bjkyc58.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    // Collections
    const menuCollection = client.db('bitewaveDb').collection('menu');


    /* ------------ Route --------------- */
    // menu
    app.get('/menu', async(req, res) => {
        const result = await menuCollection.find().toArray();
        res.send(result);
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


/* ----------------------------------- MongoDB Code Here ----------------------------------- */


app.get('/', (req, res) => {
    res.send('Bitewave server is running...');
});
app.listen(port, () => {
    console.log(`Bitewave server is running on port: ${port}`);
});