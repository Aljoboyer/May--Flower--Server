const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const app = express();
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET)
const fileUpload = require('express-fileupload');
const port = process.env.PORT || 5000;

//middleware 
app.use(cors()); 
app.use(express.json({limit: '50mb'}));
app.use(fileUpload());
app.use(express.urlencoded({limit: '50mb'}));
  
const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.USER_PASS}@cluster0.obwta.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run(){
    try{
        await client.connect(); 

        const database = client.db('FlowersShopDB');
        const FlowerCollection = database.collection('FlowerCollection');
        const UserCartCollection = database.collection('UserCartCollection');
        const UserCollection = database.collection('UserCollection');
        const PaymentCollection = database.collection('PaymentCollection');
        const StatusCollection = database.collection('StatusCollection')

        //--------Others-----//
            app.get('/rolecheck', async(req, res) => {
                const email = req.query.email;
                const query = {email: email};
                const result = await UserCollection.findOne(query);
                res.send(result)
            })
        //--------Others End----//

 
// ----------------For Admin----------------//

        //admin adding flower details to data base
        app.post('/flowerpost', async(req, res) => {
            const data = req.body;
            const imgdata = req.files.img.data;
            const img2data = req.files.img2.data;
            console.log('main data',data)
            console.log('image',imgdata)
            const encodedpic1 = imgdata.toString('base64');
            const img = Buffer.from(encodedpic1, 'base64');

            const encodedpic2 = img2data.toString('base64');
            const img2 = Buffer.from(encodedpic2, 'base64');

            const flower = {...data, img, img2};
            const result = await FlowerCollection.insertOne(flower)
            res.json(result) 
        });

        //saving user to database
        app.post('/saveuser', async(req, res) => {
            const data = req.body;
   
            const result = await UserCollection.insertOne(data);
            res.json(result)
        })

        //admin making another admin
        app.put('/makingadmin', async(req, res) => {
            const email = req.query.email;
            console.log(email)
            const query = {email: email};
            const option = {upsert: true};
            const updatedoc = {
                $set:{
                    role: 'admin'
                }
            }
            const result = await UserCollection.updateOne(query, updatedoc, option);
            res.json(result)
        })
        //admin deleting flower 
        app.delete('/admindeleteflower/:id', async (req, res) =>{
            const id = req.params.id;
            const query = {_id : ObjectId(id)};
            const result = await FlowerCollection.deleteOne(query);
            res.json(result)
        })

// ----------------END Admin----------------//

// ------------For user ------------------//

        //geting flower data from databse
        app.get('/getflowers', async (req, res) => {
            const cursor = FlowerCollection.find({});
            const result = await cursor.toArray();
            res.send(result)
        })
          //geting flower data by id for details  from databse
          app.get('/getflowerbyid/:id', async (req, res) => {
            const id = req.params.id;
   
            const query = {_id: ObjectId(id)};
            const result = await FlowerCollection.findOne(query);
            res.send(result)
        })
        //user posting cart to database
        app.post('/cartpost', async(req, res) => {
            const data = req.body; 
            const result = await UserCartCollection.insertOne(data);
            res.json(result)
        })
        //user geting own cart
        app.get('/getcart', async (req, res) => { 
            const email = req.query.email;
            const query = {email: email}
            const result = await UserCartCollection.find(query).toArray()
            res.send(result)
        })
        //Removing cart item from cart
        app.delete('/deletecartitem', async (req, res) => {
            const id = req.query.id;
            console.log(id)
            const query = {_id: ObjectId(id)};
            const result = await UserCartCollection.deleteOne(query)
            res.send(result)
        })
        //clearing cart after payment
        app.delete('/clearcart', async (req, res) => {
            const email = req.query.email;
            const query = {email: email};
            const result = await UserCartCollection.deleteMany(query);
            res.send(result)
        })

        //getting payment data
        app.get('/getpaymentdata', async (req, res) =>{
            const email = req.query.email;
            const query = {email: email};
            const result = await PaymentCollection.find(query).toArray();
            res.send(result)
        })

        //getting payment status
        app.get('/getpaymetstatus', async (req, res) =>{
            const email = req.query.email;
            const query = {email: email};
            const result = await StatusCollection.find(query).toArray();
            res.send(result)
        })
        //admin geting all customer orders
        app.get('/getorders', async(req, res) => {
            const cursor = PaymentCollection.find({})
            const result = await cursor.toArray();
            res.send(result)
        })

        //geting flower by ocassion
        app.get('/ocassionalflower', async (req, res) => {
            const data = req.query.ocassion;
            const query = {ocassion: data};
            const result = await FlowerCollection.find(query).toArray();
            res.send(result)
        })
          //geting flower by ocassion
          app.get('/seasonalcategory', async (req, res) => {
            const data = req.query.season;
            const query = {category: data};
            const result = await FlowerCollection.find(query).toArray();
            res.send(result)
        })
      //-------------Payment System-----------//
        //payment intent
        app.post('/create-payment-intent', async (req, res) => {
            const paymentinfo = req.body
            const payment = parseInt(paymentinfo.totalamount) * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: payment,
                payment_method_types: ['card']
                });
            res.send({
            clientSecret: paymentIntent.client_secret
            }); 
        }) 

        //adding payment details to database
        app.post('/addpayments', async (req , res) => {
            const flowerpayment = req.body;
            const result = await PaymentCollection.insertMany(flowerpayment);
            res.json(result)
        })
        //adding payment status to database
        app.post('/paymentstatus', async (req , res) => {
            const flowerpayment = req.body;
            const result = await StatusCollection.insertOne(flowerpayment);
            res.json(result)
        })
    }
    finally{

    }

}
run().catch(console.dir);
app.get('/', (req, res) => {
    res.send('Flower Shop Server is connected');
})

app.listen(port, (req, res) => {
    console.log('Flower Shop Port is', port)
})