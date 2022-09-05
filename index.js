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
        const messageCollection = client.db('automed-mechines').collection('messages');
        const productReviewCollection = client.db('automed-mechines').collection('productReviews');


        /************  All gets **************/

        //for store all products data
        app.get('/product', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            // const cursorReview = productReviewCollection.find(query);
            // const reviews = await cursorReview.toArray();
            // const updatedProduct = products?.map(p => {
            //     const sprs = reviews.filter(review => review.productId === p._id);
            //     console.log(sprs)
            //     let totalRating = 0;
            //     sprs?.map(element => totalRating = totalRating + element.rating);
            //     const rating = (Math.round(totalRating / sprs?.length));
            //     // if (isNaN(rating)) {
            //     //     p.rating = 1;
            //     // }
            //     // else {
            //     //     p.rating = rating;
            //     // }
            //     return p
            // })
            res.send(products);
        })
        //for get all orders
        app.get('/orders', async (req, res) => {
            const query = {};
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders)
        })
        //get orders for specific users
        app.get('/userOrders', async (req, res) => {
            const userEmail = req.query.user; //here .user is query perameter to receive user email from clien site
            const query = { user: userEmail };
            const orders = await orderCollection.find(query).toArray();
            res.send(orders);
        })
        //for get all messages to ui
        app.get('/message', async (req, res) => {
            const query = {};
            const cursor = messageCollection.find(query);
            const messages = await cursor.toArray();
            res.send(messages)
        })
        //get message for specific users
        app.get('/userMessage', async (req, res) => {
            const userEmail = req.query.user; //here .user is query perameter to receive user email from clien site
            const query = { user: userEmail };
            const message = await messageCollection.find(query).toArray();
            res.send(message);
        })
        app.get('/productReview', async (req, res) => {
            const query = {};
            const cursor = productReviewCollection.find(query);
            const productReviews = await cursor.toArray();
            res.send(productReviews)
        })


        /****************  All posts ******************/

        //for add a product to product collection
        app.post('/addProduct', async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result);
        })

        //for add a messages to message collection
        app.post('/message', async (req, res) => {
            const message = req.body;
            const result = await messageCollection.insertOne(message);
            res.send(result);
        })

        //for store orders for all users
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })

        //for store orders for all users
        app.post('/productReview', async (req, res) => {
            const productReview = req.body;
            const result = await productReviewCollection.insertOne(productReview);
            res.send(result);
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