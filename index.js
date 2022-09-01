const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express')
const cors = require('cors');
require('dotenv').config();
const app = express()
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.g8qorjt.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const productCollection = client.db('automed-mechines').collection('products');
        const orderCollection = client.db('automed-mechines').collection('orders');

        //for store all products data
        app.get('/product', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products)
        })

        //for store orders for all users
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })

        //get orders for specific users
        app.get('/userOrders', async (req, res) => {
            const userEmail = req.query.user; //here .user is query perameter to receive user email from clien site
            const query = { user: userEmail };
            const orders = await orderCollection.find(query).toArray();
            res.send(orders);
        })

    }
    finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello from Automed Machines')
})

app.listen(port, () => {
    console.log(`Automed app listening on port ${port}`)
})