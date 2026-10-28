import mongoose from "mongoose";


const optScehma=new mongoose.Schema({
    email:{
        type:String,
        required:[true,"Email is required"]
    },
    otpHash:{
        type:Number,
        required:[true,"OTP is required"]
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:[true,"User is required"]

    }
    
},{
    timestamps:true
})

const optModel=mongoose.model('OTP',optScehma)

export default optModel