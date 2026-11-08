import express from "express"
import cors from "cors";
import 'dotenv/config';
import { MongoClient, ObjectId } from 'mongodb';
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express()
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);

try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    
  } catch (err) {
    console.dir("Failed to connect",err);
  }

const db = client.db("surface-studio")
const studioCollection = db.collection("studio")
const bookingCollection = db.collection("booking")

//middleware
const verifyToken = async(req,res,next) => {
    const authHeader = req.headers.authorization;
    if(!authHeader){
      return res.status(401).send({message: "Unauthorized!"});
    }
   
    const token = authHeader.split(" ")[1];
    if(!token){
      return res.status(401).send({message: "Unauthorized!"});
    }

    const JWKS = createRemoteJWKSet(
      new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
    );

    try{
      const {payload} = await jwtVerify(token, JWKS);
      next();
    }
    catch(error){
      return res.status(500).send({message: "Server Down!"})
    }

    
}

//Health Check Endpoint
app.get('/', (req,res) => {
    res.send({message: "Api is working"})
});

//http://localhost:8000/studio/:id
//post studio data
app.post('/add-studio',verifyToken, async (req, res) => {
  try {
    const data = req.body;
    const result = await studioCollection.insertOne(data);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to add ", error: error.message });
  }
});

// Explore Studio routes
app.get('/studios', async (req, res) => {
  try {
    const result = await studioCollection.find().toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch ", error: error.message });
  }
});

// Get Studio Detials
app.get("/studio/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid  ID format" });
    }
    const result = await studioCollection.findOne({ _id: new ObjectId(id) });
    if (!result) {
      return res.status(404).send({ message: " not found" });
    }
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch ", error: error.message });
  }
});


//Update Studio Details
app.patch("/studio/:id",verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid  ID format" });
    }
    // Remove _id from updateData if present to avoid MongoServerError (immutable field)
    const { _id, ...updateData } = req.body;
    const result = await studioCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    res.json(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to update ", error: error.message });
  }
});

//Delete Studio From my listing
app.delete("/studio/:id",verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid  ID format" });
    }
    const result = await studioCollection.deleteOne({ _id: new ObjectId(id) });
    res.json(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to delete ", error: error.message });
  }
});


//Delete Studio Details
app.delete("/studio/:id",verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid studio ID format" });
    }
    const result = await studioCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "studio details not found" });
    }
    res.json(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to delete studio details", error: error.message });
  }
});


//Post booking details api
app.post('/booking',verifyToken, async (req, res) => {
  try {
    const data = req.body;
    const result = await bookingCollection.insertOne(data);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to booking", error: error.message });
  }
});

// get all booking api
app.get("/bookings",verifyToken, async (req, res) => {
  try {
    const result = await bookingCollection.find().toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: "Failed to get bookings",
    });
  }
});

//Get my bookings 
app.get('/my-bookings/:email',verifyToken, async(req,res) => {
    const {email} = req.params
    const result = await bookingCollection.find({userEmail:email}).toArray()
    res.send(result);
})

//delete my booking api
app.delete("/my-bookings/:id",verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid booking ID format" });
    }
    const result = await bookingCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "booking data not found" });
    }
    res.json(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to delete booking", error: error.message });
  }
}); 

// Top 6 studio
app.get("/top-studios", async (req, res) => {
  try {
    const result = await studioCollection.find().sort({ rating: -1 }).limit(6).toArray();

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: "Failed to get top studios",
      error: error.message,
    });
  }
});


app.listen(PORT, () => {
    console.log(`server is runnig at port ${PORT}`)
})

export default app;