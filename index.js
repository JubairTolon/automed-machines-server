const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express()
const port = process.env.PORT || 5000;
const stripe = require('stripe')(process.env.STRIPE_KEY);

app.use(cors());
app.use(express.json());

var SibApiV3Sdk = require('sib-api-v3-sdk');
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.EMAIL_SENDER_SECRET;

// const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

// var nodemailer = require('nodemailer');
// var sendinBlue = require('nodemailer-sendinblue-transport');

// var transporter = nodemailer.createTransport(sendinBlue(options))

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.g8qorjt.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//check anyone has token or not 
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    });
}

function sendOrderEmaill(order) {
    const { _id, user, customer_name, quantity, total, date } = order;
    new SibApiV3Sdk.TransactionalEmailsApi().sendTransacEmail({

        "sender": { "email": "zs.tolon0073@gmail.com", "name": "Automed" },
        "subject": "This is my default subject line",
        "htmlContent": `<!DOCTYPE html><html><body><h1>Your order list</h1><p>${_id}</p></body></html>`,
        "params": {
            "greeting": "This is the default greeting",
            "headline": "This is the default headline"
        },
        "messageVersions": [
            //Definition for Message Version 1 
            {
                "to": [
                    {
                        "email": `${user}`,
                    }
                ],
                "htmlContent": `<!DOCTYPE html>
                <html>
                    <body>
                        <h1>Dear ${customer_name}, here is Your order list</h1>
                        <p>Your ordered ${quantity} items at ${date}</p>
                        <p>Your total amount is $ ${total}</p>
                    </body>
                </html>`,
                "subject": "Here is you order details"
            }

        ]
    });
}
function sendPaymentConfirmationEmaill(order) {
    const { _id, user, customer_name, quantity, total, date } = order;
    new SibApiV3Sdk.TransactionalEmailsApi().sendTransacEmail({

        "sender": { "email": "zs.tolon0073@gmail.com", "name": "Automed" },
        "subject": "This is my default subject line",
        "htmlContent": `<!DOCTYPE html><html><body><h1>Your order list</h1><p>${_id}</p></body></html>`,
        "params": {
            "greeting": "This is the default greeting",
            "headline": "This is the default headline"
        },
        "messageVersions": [
            //Definition for Message Version 1 
            {
                "to": [
                    {
                        "email": `${user}`,
                    }
                ],
                "textContent": `Your payment for order Id: ${_id} is confirmed.`,
                "htmlContent": `<!DOCTYPE html>
                <html>
                    <body>
                        <h1>Dear ${customer_name}, wehave received you payment.</h1>
                        <p>Your ordered ${quantity} items at ${date}</p>
                        <p>Your total payment amount is $ ${total}</p>
                    </body>
                </html>`,
                "subject": `We have received your payment for order Id: ${_id}`
            }

        ]
    });
}

async function run() {
    try {
        await client.connect();
        const productCollection = client.db('automed-mechines').collection('products');
        const orderCollection = client.db('automed-mechines').collection('orders');
        const messageCollection = client.db('automed-mechines').collection('messages');
        const productReviewCollection = client.db('automed-mechines').collection('productReviews');
        const userCollection = client.db('automed-mechines').collection('users');
        const subscriptionCollection = client.db('automed-mechines').collection('subscriber');
        const paymentCollection = client.db('automed-mechines').collection('payments');

        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
                next();
            }
            else {
                res.status(403).send({ message: 'Forbidden' });
            }
        }


        /************  All gets **************/

        //for store all products data
        app.get('/product', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();

            res.send(products);
        })

        //for get all orders
        app.get('/orders', verifyJWT, verifyAdmin, async (req, res) => {
            const query = {};
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders)
        })

        //for get all orders for specific user by id
        app.get('/order/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = await orderCollection.findOne(query);
            res.send(order);
        })

        //get orders for specific users
        app.get('/userOrders', verifyJWT, async (req, res) => {
            const userEmail = req.query.user; //here .user is query perameter to receive user email from clien site
            const decodedEmail = req.decoded.email;
            if (userEmail === decodedEmail) {
                const query = { user: userEmail };
                const orders = await orderCollection.find(query).toArray();
                res.send(orders);
            }
            else {
                return res.status(403).send({ message: 'Forbidden access' })
            }
        })

        // app.get('/available', async (req, res) => {
        //     const products = await productCollection.find().toArray();
        //     const orders = await orderCollection.find().toArray();
        //     const singleOrder = orders.map(order => order.cart);
        //     const ids = singleOrder[0]?.map(item => products?.filter(product => product._id === item._id))
        //     console.log(ids)

        //     res.send(ids);

        // })


        //for get all messages to ui
        app.get('/message', verifyJWT, verifyAdmin, async (req, res) => {
            const query = {};
            const cursor = messageCollection.find(query);
            const messages = await cursor.toArray();
            res.send(messages)
        })
        //get message for specific users
        app.get('/userMessage', verifyJWT, async (req, res) => {
            const userEmail = req.query.user; //here .user is query perameter to receive user email from clien site
            const query = { user: userEmail };
            const message = await messageCollection.find(query).toArray();
            res.send(message);
        })
        //for get all product review to ui
        app.get('/productReview', async (req, res) => {
            const query = {};
            const cursor = productReviewCollection.find(query);
            const productReviews = await cursor.toArray();
            res.send(productReviews)
        })

        //for get all user
        app.get('/user', verifyJWT, verifyAdmin, async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        });

        //for check admin role and get the admin if admin
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        });

        //for get all subscription
        app.get('/subscription', verifyJWT, verifyAdmin, async (req, res) => {
            const subscribers = await subscriptionCollection.find().toArray();
            res.send(subscribers);
        });


        /****************  All posts ******************/

        //for add a product to product collection
        app.post('/addProduct', verifyJWT, verifyAdmin, async (req, res) => {
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
            sendOrderEmaill(order);
            res.send(result);
        })

        //for store orders for all users
        app.post('/productReview', async (req, res) => {
            const productReview = req.body;
            const result = await productReviewCollection.insertOne(productReview);
            res.send(result);
        })

        //for store subscription for all users
        app.post('/subscription', async (req, res) => {
            const subscriber = req.body;
            const result = await subscriptionCollection.insertOne(subscriber);
            res.send(result);
        })

        // for payment calculation 
        app.post('/create-payment-intent', verifyJWT, async (req, res) => {
            const order = req.body;
            const total = order.total;
            const amount = total * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            })
            res.send({ clientSecret: paymentIntent.client_secret })
        });

        /* ******** All patch*********** */

        //for update payment 
        app.patch('/order/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId,
                }
            };
            const result = await paymentCollection.insertOne(payment);
            const updatedOrder = await orderCollection.updateOne(filter, updatedDoc);
            // sendPaymentConfirmationEmaill(updatedOrder);

            res.send(updatedOrder)

        })

        /* **********put********* */

        //for update or insert user
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5d' });

            res.send({ result, token });
        });

        //for make user admin
        app.put('/user/admin/:email', verifyJWT, verifyAdmin, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const updateDoc = {
                $set: { role: 'admin' },
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

        /* ******** All Delete Api's *********/

        //for delete single product data 
        app.delete('/product/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(filter);
            res.send(result);
        })
        //for delete single order data 
        app.delete('/order/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(filter);
            res.send(result);
        })

        //for delete single user message data 
        app.delete('/message/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await messageCollection.deleteOne(filter);
            res.send(result);
        })

        //for delete single user 
        app.delete('/user/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await userCollection.deleteOne(filter);
            res.send(result);
        })

        //for delete single subscription 
        app.delete('/subscription/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await subscriptionCollection.deleteOne(filter);
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