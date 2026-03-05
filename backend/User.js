const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  name:{
    type:String,
    required:true
  },

  email:{
    type:String,
    required:true,
    unique:true,
    match:[/^\S+@\S+\.\S+$/, "Please use a valid email address"]
  },

  password:{
    type:String,
    required:true
  },

  verified:{
    type:Boolean,
    default:false
  },

  verificationToken:{
    type:String
  }

});

module.exports = mongoose.model("User", userSchema);
