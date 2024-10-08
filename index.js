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
    const blogCollection = client.db('bitewaveDb').collection('blogs');


    /* ------------ Route --------------- */
    
    // JWT related api
    app.post('/jwt', async(req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn : '1h'
      });
      res.send( { token } );

    });


    // Middlewares
    const verifyToken = (req, res, next) => {
      // console.log('inside verify token',req.headers.authorization);
      if(!req.headers.authorization) {
        return res.status(401).send({ message : 'unauthorized access'});
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if(err){
          return res.status(401).send({ message : 'unauthorized access'});
        }
        req.decoded = decoded;
        next();
      })
    }

    // use verify admin after verify token
    const verifyAdmin = async(req, res, next) => {
      const email = req.decoded.email;
      const filter = { email : email };
      const user = await userCollection.findOne(filter);
      const isAdmin = user?.role === 'admin';
      if(!isAdmin) {
        return res.status(403).send({ message : 'forbidden access' });
      }
      next();
    }
    
    // User related api
    app.get('/users', verifyToken , verifyAdmin , async(req, res) => {
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
    

    app.delete('/users/:id', verifyToken , verifyAdmin , async(req, res) => {
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    app.patch('/users/admin/:id', verifyToken , verifyAdmin , async(req, res) => {
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

    // 
    app.get('/users/admin/:email', verifyToken , async(req, res) => {
      const email = req.params.email;
      
      // check admin 
      if(email !== req.decoded.email){
        return res.status(403).send({message : 'forbidden access'});
      }
      const filter = { email : email };
      const user = await userCollection.findOne(filter);
      let admin = false;
      if(user) {
        admin = user?.role === 'admin';  
      }
      res.send({ admin });
    })
    
    // menu related api
    app.get('/menu', async(req, res) => {
        const result = await menuCollection.find().toArray();
        res.send(result);
    });

    app.get('/menu/:id', async(req, res) => {
      const id = req.params.id;
      const filter = { _id : new ObjectId(id) };
      const result = await menuCollection.findOne(filter);
      res.send(result);
    })

    app.post('/menu', verifyToken, verifyAdmin, async(req, res) => {
      const menuData = req.body;
      const result = await menuCollection.insertOne(menuData);
      res.send(result);
    });

    app.delete('/menu/:id', verifyToken, verifyAdmin, async(req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await menuCollection.deleteOne(filter);
      res.send(result);
    })


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
    });

    // blog related api
    app.get('/blogs', async(req, res) => {
      const result = await blogCollection.find().toArray();
      res.send(result);
    });

    app.get('/blogs/:id', async(req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id)};
      const result = await blogCollection.findOne(filter);
      res.send(result);
    });



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