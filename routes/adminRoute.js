const express=require('express');
const router=express.Router();
const {check, validationResult}=require('express-validator')
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const app=express();
const bcryptjs=require('bcryptjs')
const Admin=require('../models/adminLogin')
const jwt=require('jsonwebtoken')
const Customer=require('../models/customerInfo')
const auth=require('../middleware/auth')


router.post("/addAdmin",[
    check('fullname',"Username is required").not().isEmpty(),
    check('password',"Password is required").not().isEmpty()
], (req, res) => {
    const errors=validationResult(req);
    if(errors.isEmpty()){
        const fullname=req.body.fullname
        const password=req.body.password
        bcryptjs.hash(password,10,function(err,hash){
            const myData = new Admin({fullname:fullname,password:hash});
            myData.save().then(function(result){
                res.status(201).json({
                   message:"success",
                   data : result
                });
        }).catch(function(err){
            res.status(500).json({message:"err"}) 
        })
    })
}     
    else{
        res.status(400).json(errors.array());
    }
});


//--------------------------ADMIN LOGIN-----------------
router.post("/adminLogin",function(req,res){
    const fullname=req.body.fullname
    const password=req.body.password
    Admin.findOne({fullname:fullname})
    .then(function(data){
        if(data===null){
            return res.status(401).json({message:"Invalid"})
        }
        bcryptjs.compare(password,data.password,function(err,result){
            if(result===false){
                return res.status(401).json({message:"Invalid"})
            }
            const token=jwt.sign({userid:data._id},'anysecretkey')
            res.cookie("adminToken",token,{maxAge:new Date().getTime()+300*1000,httpOnly:true})
            return res.status(200).json({message:"success",user:data._id})
        })
    })
    .catch(function(e){
        res.status(500).json({message:e})
    })
})
//-------------------------------------------------------------------//


//-------------------------------------Get all users--------------------------------//
router.get("/users",auth.verifyAdmin, asyncHandler(async (req, res, next) => {
    const users = await Customer.find({});
    res.status(201).json({
      message: "success",
      data: users,
    });
  }));

//----------------------------------------------------------------------------------//


//---------------------------------------Admin Logout-----------------------------//
  router.get('/adminLogout',asyncHandler(async (req, res, next) => {
    res.cookie("adminToken", "none",{maxAge:new Date().getTime()+300*1000,httpOnly:true})   
     res.status(200).json({
       success: true,
       data: "User Logged out",
     });
   }));
//-------------------------------------------------------------------------------------//
module.exports=router;