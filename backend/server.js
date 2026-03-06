/* ===== IMPORTS ===== */
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./User");

const app = express();

/* ===== MIDDLEWARE ===== */
app.use(cors({
origin:"*",
methods:["GET","POST","PUT","DELETE"],
allowedHeaders:["Content-Type","Authorization"]
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

/* ===== AUTH MIDDLEWARE ===== */
function auth(req,res,next){

const token = req.headers.authorization;

if(!token){
return res.status(401).json({message:"No token provided"});
}

try{

const decoded = jwt.verify(token,process.env.JWT_SECRET);

req.userId = decoded.userId;

next();

}catch(err){

return res.status(401).json({message:"Invalid token"});

}

}

/* ===== DISH SCHEMA ===== */
const dishSchema = new mongoose.Schema({

name:{type:String,required:true},
price:{type:Number,required:true},
category:{type:String,required:true},
available:{type:Boolean,default:true},

userId:{
type:mongoose.Schema.Types.ObjectId,
ref:"User",
required:true
}

},{timestamps:true});

const Dish = mongoose.model("Dish",dishSchema);

/* ===== TEST ROUTE ===== */
app.get("/",(req,res)=>{
res.send("Cloud Kitchen API Running 🍽️");
});

/* ===== CREATE DISH ===== */
app.post("/api/dishes",auth,async(req,res)=>{
try{

const dish = new Dish({
name:req.body.name,
category:req.body.category,
price:Number(req.body.price),
available:true,
userId:req.userId
});

const savedDish = await dish.save();

res.status(201).json(savedDish);

}catch(err){

console.log("CREATE ERROR:",err);
res.status(500).json({error:err.message});

}
});

/* ===== GET USER DISHES ===== */
app.get("/api/dishes",auth,async(req,res)=>{
try{

const dishes = await Dish.find({userId:req.userId});

res.json(dishes);

}catch(err){

res.status(500).json({error:err.message});

}
});

/* ===== UPDATE DISH ===== */
app.put("/api/dishes/:id",auth,async(req,res)=>{
try{

const updated = await Dish.findOneAndUpdate(
{_id:req.params.id,userId:req.userId},
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
app.delete("/api/dishes/:id",auth,async(req,res)=>{
try{

await Dish.findOneAndDelete({_id:req.params.id,userId:req.userId});

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

const user = new User({
name,
email,
password:hashedPassword,
verified:true
});

await user.save();

res.json({message:"User registered successfully"});

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

const token = jwt.sign(
{userId:user._id},
process.env.JWT_SECRET,
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

/* ===== START SERVER ===== */
const PORT = process.env.PORT || 5000;

app.listen(PORT,()=>{
console.log(`Server running on port ${PORT} 🔥`);
});
