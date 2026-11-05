import express from "express"
import cors from "cors";
import 'dotenv/config';
import { MongoClient, ObjectId } from 'mongodb';

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

//Health Check Endpoitn
app.get('/', (req,res) => {
    res.send({message: "Api is working"})
});

//http://localhost:8000/add-studio
//post studio data
app.post('/add-studio', async (req, res) => {
  try {
    const data = req.body;
    const result = await studioCollection.insertOne(data);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to add destination", error: error.message });
  }
});

// Explore Studio routes
app.get('/studios', async (req, res) => {
  try {
    const result = await studioCollection.find().toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch destinations", error: error.message });
  }
});

// Get Studio Detials
app.get("/studio/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid destination ID format" });
    }
    const result = await studioCollection.findOne({ _id: new ObjectId(id) });
    if (!result) {
      return res.status(404).send({ message: "Destination not found" });
    }
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch destination", error: error.message });
  }
});


app.listen(PORT, () => {
    console.log(`server is runnig at port ${PORT}`)
})