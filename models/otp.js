const mongoose=require('mongoose');
const Otp=mongoose.model('Otp',{
    email:{
        type:String,
        required:true
    },
    code:{
        type:String
    },
    expireIn:{
        type:Number
    }
})
module.exports=Otp;