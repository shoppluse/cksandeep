// ===== IMPORTS =====
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./User");

const app = express();

/* ---------------- CORS FIX ---------------- */
app.use(cors({
    origin: "*",
    methods: ["GET","POST","PUT","DELETE"],
    allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// ⭐ CORS FIX (allows website to access API)
app.use(cors({
    origin: ["https://shoppluse.github.io"],
    methods: ["GET","POST","PUT","DELETE"],
    allowedHeaders: ["Content-Type"]
}));


// ===== MONGODB CONNECTION =====
mongoose.connect(process.env.MONGO_URI, {
    dbName: "cloudkitchen",
    retryWrites: true,
    w: "majority",
    readPreference: "primary",
    serverSelectionTimeoutMS: 30000
})
.then(() => console.log("MongoDB Connected Successfully 🚀"))
.catch(err => console.log("MongoDB FAILED ❌", err.message));


// ===== SCHEMA =====
const dishSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    available: { type: Boolean, default: true }
}, { timestamps: true });

const Dish = mongoose.model("Dish", dishSchema);


// ===== TEST ROUTE =====
app.get("/", (req, res) => {
    res.send("Cloud Kitchen API Running 🍽️");
});


// ===== CREATE DISH =====
app.post("/api/dishes", async (req, res) => {
    try {

        const dish = new Dish({
            name: req.body.name,
            category: req.body.category,
            price: Number(req.body.price), // IMPORTANT FIX
            available: true
        });

        const savedDish = await dish.save();
        res.status(201).json(savedDish);

    } catch (err) {
        console.log("CREATE ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});


// ===== GET ALL DISHES =====
app.get("/api/dishes", async (req, res) => {
    try {
        const dishes = await Dish.find();
        res.json(dishes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ===== GET SINGLE DISH =====
app.get("/api/dishes/:id", async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id);
        res.json(dish);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ===== UPDATE DISH =====
app.put("/api/dishes/:id", async (req, res) => {
    try {

        const updated = await Dish.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                category: req.body.category,
                price: Number(req.body.price) // IMPORTANT FIX
            },
            { new: true }
        );

        res.json(updated);

    } catch (err) {
        console.log("UPDATE ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});


// ===== DELETE DISH =====
app.delete("/api/dishes/:id", async (req, res) => {
    try {
        await Dish.findByIdAndDelete(req.params.id);
        res.json({ message: "Dish deleted 🗑️" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== REGISTER USER =====
app.post("/api/register", async (req,res)=>{

try{

const {name,email,password} = req.body;

const existingUser = await User.findOne({email});

if(existingUser){
return res.status(400).json({message:"User already exists"});
}

const hashedPassword = await bcrypt.hash(password,10);

const user = new User({
name,
email,
password:hashedPassword
});

await user.save();

res.json({message:"User registered successfully"});

}catch(err){
res.status(500).json({message:"Server error"});
}

});
// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} 🔥`));




