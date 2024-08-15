const express = require('express');
require('dotenv').config()
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    // await client.connect();


    // Collections
    const menuCollection = client.db('bitewaveDb').collection('menu');
    const cartCollection = client.db('bitewaveDb').collection('cart');
    const userCollection = client.db('bitewaveDb').collection('users');


    /* ------------ Route --------------- */
    // User related api
    app.get('/users', async(req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    })

    app.post('/users', async(req, res) => {
      const user = req.body;

      /** Insert email is user dosen't exists:
       * You can do this many ways
          1. email: unique
          2. use mongoose
          3. upsert
          4. simple checking -> using database
       */

      const query = { email: user.email};
      const existingUser = await userCollection.findOne(query);
      if(existingUser){
        return res.send({message : 'User already exist!', insertedId : null});
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    

    app.delete('/users/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    app.patch('/users/admin/:id', async(req, res) => {
      const id = req.params.id;
      const filter = { _id : new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role : 'admin'
        }
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    
    // menu related api
    app.get('/menu', async(req, res) => {
        const result = await menuCollection.find().toArray();
        res.send(result);
    });



    // cart related api
    app.get('/cart', async(req, res) => {
        const email = req.query.email;
        const query = { email : email };
        const result = await cartCollection.find(query).toArray();
        res.send(result);
    })
    app.post('/cart', async(req, res) => {
        const cartItem = req.body;
        const result = await cartCollection.insertOne(cartItem);
        res.send(result);
    });
    app.delete('/cart/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await cartCollection.deleteOne(query);
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