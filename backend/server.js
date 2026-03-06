/* ===== IMPORTS ===== */
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("./User");
const sendVerificationEmail = require("./mailer");

const app = express();

/* ===== MIDDLEWARE ===== /
app.use(cors({
origin: "",
methods: ["GET","POST","PUT","DELETE"],
allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

/* ===== MONGODB CONNECTION ===== */
mongoose.connect(process.env.MONGO_URI,{
dbName:"cloudkitchen",
retryWrites:true,
w:"majority",
readPreference:"primary",
serverSelectionTimeoutMS:30000
})
.then(()=>console.log("MongoDB Connected Successfully 🚀"))
.catch(err=>console.log("MongoDB FAILED ❌",err.message));

/* ===== DISH SCHEMA ===== */
const dishSchema = new mongoose.Schema({
name:{type:String,required:true},
price:{type:Number,required:true},
category:{type:String,required:true},
available:{type:Boolean,default:true}
},{timestamps:true});

const Dish = mongoose.model("Dish",dishSchema);

/* ===== TEST ROUTE ===== */
app.get("/",(req,res)=>{
res.send("Cloud Kitchen API Running 🍽️");
});

/* ===== CREATE DISH ===== */
app.post("/api/dishes",async(req,res)=>{
try{

const dish = new Dish({
name:req.body.name,
category:req.body.category,
price:Number(req.body.price),
available:true
});

const savedDish = await dish.save();

res.status(201).json(savedDish);

}catch(err){
console.log("CREATE ERROR:",err);
res.status(500).json({error:err.message});
}
});

/* ===== GET ALL DISHES ===== */
app.get("/api/dishes",async(req,res)=>{
try{

const dishes = await Dish.find();
res.json(dishes);

}catch(err){
res.status(500).json({error:err.message});
}
});

/* ===== GET SINGLE DISH ===== */
app.get("/api/dishes/:id",async(req,res)=>{
try{

const dish = await Dish.findById(req.params.id);
res.json(dish);

}catch(err){
res.status(500).json({error:err.message});
}
});

/* ===== UPDATE DISH ===== */
app.put("/api/dishes/:id",async(req,res)=>{
try{

const updated = await Dish.findByIdAndUpdate(
req.params.id,
{
name:req.body.name,
category:req.body.category,
price:Number(req.body.price)
},
{new:true}
);

res.json(updated);

}catch(err){
console.log("UPDATE ERROR:",err);
res.status(500).json({error:err.message});
}
});

/* ===== DELETE DISH ===== */
app.delete("/api/dishes/:id",async(req,res)=>{
try{

await Dish.findByIdAndDelete(req.params.id);
res.json({message:"Dish deleted 🗑️"});

}catch(err){
res.status(500).json({error:err.message});
}
});

/* ===== REGISTER USER ===== */
app.post("/api/register",async(req,res)=>{

try{

const {name,email,password} = req.body;

const existingUser = await User.findOne({email});

if(existingUser){
return res.status(400).json({message:"User already exists"});
}

const hashedPassword = await bcrypt.hash(password,10);

const token = crypto.randomBytes(32).toString("hex");

const user = new User({
name,
email,
password:hashedPassword,
verificationToken:token
});

await user.save();

await sendVerificationEmail(email,token);

res.json({message:"Verification email sent"});

}catch(err){
res.status(500).json({message:"Server error"});
}

});

/* ===== LOGIN USER ===== */
app.post("/api/login",async(req,res)=>{

try{

const {email,password} = req.body;

const user = await User.findOne({email});

if(!user){
return res.status(400).json({message:"User not found"});
}

const validPassword = await bcrypt.compare(password,user.password);

if(!validPassword){
return res.status(400).json({message:"Invalid password"});
}

if(!user.verified){
return res.status(400).json({message:"Please verify your email first"});
}

const token = jwt.sign(
{userId:user._id},
"secretkey",
{expiresIn:"1d"}
);

res.json({
message:"Login successful",
token
});

}catch(err){
res.status(500).json({message:"Server error"});
}

});

/* ===== VERIFY EMAIL ===== */
app.get("/api/verify/:token",async(req,res)=>{

try{

const user = await User.findOne({verificationToken:req.params.token});

if(!user){
return res.send("Invalid verification link");
}

user.verified = true;
user.verificationToken = undefined;

await user.save();

res.send("Account verified successfully. You can now login.");

}catch(err){
res.status(500).send("Verification failed");
}

});

/* ===== START SERVER ===== */
const PORT = process.env.PORT || 5000;

app.listen(PORT,()=>{
console.log("Server running on port ${PORT} 🔥");
});
