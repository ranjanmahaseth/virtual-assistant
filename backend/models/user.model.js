import mongoose from "mongoose";

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true,
        minlength:[2, 'Name must be at least 2 characters']
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password:{
        type:String,
        required:true,
        minlength:[6, 'Password must be at least 6 characters']
    },
    assistantName:{
        type:String,
        trim:true
    },
     assistantImage:{
        type:String
    },
    history:{
        type:[String],
        default:[]
    }

},{timestamps:true})

const User=mongoose.model("User",userSchema)
export default User