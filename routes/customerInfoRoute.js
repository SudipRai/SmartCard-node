const express=require('express');
const router=express.Router();
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const {check, validationResult}=require('express-validator')
const auth=require('../middleware/auth')
const app=express();
const path = require("path");
const bcryptjs=require('bcryptjs')
const Customer=require('../models/customerInfo')
const Otp=require('../models/otp')
const jwt=require('jsonwebtoken');


//-----Register the customer-------//
router.post("/register",auth.verifyAdmin,[
    check('fullname',"Username is required").not().isEmpty(),
    check('password',"Password is required").not().isEmpty(),
    check('email',"Email is required").isEmail()
    ], (req, res) => { 
    const errors=validationResult(req);
    if(errors.isEmpty()){
        const fullname=req.body.fullname
        const email=req.body.email
        const password=req.body.password
        bcryptjs.hash(password,10,function(err,hash){
            const myData = new Customer({
                fullname:fullname,
                email:email,
                password:hash
            });
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
        res.status(400).json({message:"Invalid email format"});
    }
});
//-------------------------------------------------------------//


//--------------------Customer Login---------------------------//
router.post('/userLogin',function(req,res){
    const email=req.body.email
    const password=req.body.password
    Customer.findOne({email:email})
    .then(function(data){
        if(data===null){
            return res.status(401).json({message:"Invalid Credentials"})
        }
        bcryptjs.compare(password,data.password,function(err,result){
            if(result===false){
                return res.status(401).json({message:"Invalid credentials"})
            }
            const token=jwt.sign({userid:data._id},'anysecretkey')
            res.cookie("token",token,{maxAge:new Date().getTime()+300*1000,httpOnly:true})
            res.cookie("userID",data._id,{maxAge:new Date().getTime()+300*1000,httpOnly:true})
            return res.status(200).json({message:"success",token:token,user:data})
        })
    })
    .catch(function(e){
        res.status(500).json({message:e})
    })
})
//------------------------------------------------------------------------///


//-----------------------------------Edit Profile By customer---------------------------------//
router.put("/profileUpdate",auth.verifyToken, asyncHandler(async(req,res,next)=>{
    const id=req.cookies.userID
    const customer = await Customer.findById(id);
    const fullname=req.body.fullname
    const phone=req.body.phone
    const email=req.body.email
    const password=req.body.password
    const companyname=req.body.companyname
    const bio=req.body.bio
    const address=req.body.address
    const website=req.body.website
    const facebook=req.body.facebook
    const instagram=req.body.instagram
    const twitter=req.body.twitter
    const youtube=req.body.youtube
    if (!customer) {
      return next(new ErrorResponse(`No user found with ${req.params.id}`), 404);
    }
    if (!req.files) {
      await Customer.findByIdAndUpdate(id, {
        fullname:fullname,
        phone:phone,
        email:email,
        companyname:companyname,
        bio:bio,
        address:address,
        website:website,
        facebook:facebook,
        instagram:instagram,
        twitter:twitter,
        youtube:youtube,
        password:password
      });
    }
    else{
    const file = req.files.file;
    if (file.size > process.env.MAX_FILE_UPLOAD) {
      return next(
        new ErrorResponse(
          `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
          400
        )
      );
    }
    file.name = `photo_${customer.id}${path.parse(file.name).ext}`;
    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`,async (err)=> {
      if (err) {
        return next(new ErrorResponse(`Problem with file upload`, 500));
      }
      await Customer.findByIdAndUpdate(id, {
        image: file.name,
        fullname:fullname,
        phone:phone,
        email:email,
        companyname:companyname,
        bio:bio,
        address:address,
        website:website,
        facebook:facebook,
        instagram:instagram,
        twitter:twitter,
        youtube:youtube,
        password:password
      });
    });  
  }      
    res.status(200).json({
      success: true,
      data: customer,
    });   
 }));
 //------------------------------------------------------------------//


 //-------------------Show user detail---------------//
 router.get('/customerData',auth.verifyToken, asyncHandler(async(req,res)=>{
  const id=req.cookies.userID
    const user = await Customer.findById(id);
    if (!user) {
      return next(new ErrorResponse("User not found"), 404);
    }
    res.status(200).json({
      message: "success",
      data: user,
    });
}))
//-----------------------------------------------------//

//--------------------Show profile---------------------//
router.get('/userProfile/:id', asyncHandler(async(req,res)=>{
  const user = await Customer.findById(req.params.id);
  if (!user) {
    return next(new ErrorResponse("User not found"), 404);
  }
  res.status(200).json({
    message: "success",
    data: user,
  });
}))
//------------------------------------------------------// 


//-----------------------VCF File------------------------//
router.get('/download/:id', asyncHandler(async(req, res, next) =>{
  const user = await Customer.findById(req.params.id);
  var vCard = require('vcards-js');
  vCard = vCard();
  vCard.firstName = user.fullname;
  vCard.lastName = user.fullname;
  vCard.organization = user.companyname;
  vCard.workPhone=user.phone;
  vCard.url=user.website;
  vCard.email=user.email;
  vCard.photo.attachFromUrl(`http://localhost:90/public/uploads/${user.image}`, 'JPEG');
  //set content-type and disposition including desired filename
  res.set('Content-Type', 'text/vcard; name="enesser.vcf"');
  res.set('Content-Disposition', 'inline; filename="enesser.vcf"');
  //send the response
  res.send(vCard.getFormattedString());
}));
//---------------------------------------------------------//



//------------------Sending OTP----------------//
router.post('/forgot-password',(req,res)=>{
const email=req.body.email;
if(!email){
  return res.status(401).json({message:"Enter email address"})
}
Customer.findOne({email:email})
    .then(function(user){
        if(user===null){
            return res.status(401).json({message:"Email not registered"})
        }
        else{
          let otpcode=Math.floor((Math.random()*100000)+1)
          let otpData=new Otp({
            email:email,
            code:otpcode,
            expireIn: new Date().getTime()+300*1000
          })
          mailer(email,otpcode)
          otpData.save().then(function(result){
            res.cookie("resetEmail",email,{maxAge: 3600000,httpOnly:true})
            res.status(200).json({
               message:"Check your email for OTP",
               data : result
            });           
          })   
          .catch(function(err){
            res.status(500).json({message:"err"}) 
        })
        }
    }).catch(function(err){
        res.status(500).json({message:"err"}) 
    })
})
//--------------------------------------------------//

//----------------------email sending-------------//
const mailer=(email,otp)=>{
  var nodemailer=require('nodemailer')
  var transporter=nodemailer.createTransport({
    service:'gmail',
    port:507,
    secure:false,
    auth:{
      user:'raisudip0005@gmail.com',
      pass:'helpmejesus1'
    }
  });
  var mailOptions={
    from:'raisudip0005@gmail.com',
    to:`${email}`,
    subject:'ORANZE OTP-CODE',
    text:`Dear Sir/Madam,
    ATTN : Please do not reply to this email.This mailbox is not monitored and you will not receive a response.
    Your OTP code is ${otp}

    If you have any queries, Please contact us at,

    Oranze Innovation,
    Kumaripati,Lalitpur, Nepal.
    Phone # 9808278098
    Email Id: support@nchl.com.np

    Warm Regards,
    Oranze Innovation.
        `,
  };
  transporter.sendMail(mailOptions,function(error,info){
    if(error){
    }
    else{
      console.log('Email sent:'+info.response)
    }
  })
}
//---------------------------------------------------//

//-------------Authenticate OTP-----------------------//
router.post('/checkOTP',function(req,res){
  const email=req.cookies.resetEmail
  const code=req.body.code
  Otp.findOne({email:email, code:code})
  .then(function(data){
      if(data===null){
          return res.status(401).json({message:"Invalid OTP"})
      }
      let currentTime=new Date().getTime()
      let diff=data.expireIn-currentTime
      if(diff < 0){
        return res.status(401).json({message:"OTP Expired"})
      }
      const token=jwt.sign({userid:data._id},'anysecretkey')
      res.cookie("resetToken",token)
      res.status(200).json({
        message: "success"
      });
  })
  .catch(function(e){
      res.status(500).json({message:e})
  })
})//------------------------------------------------//


//-------------------------Password Reset----------------------//
router.put('/reset-password',auth.verifyResetToken, function(req,res){
  const email=req.cookies.resetEmail
  const password=req.body.password
  bcryptjs.hash(password,10,function(err,hash){
Customer.updateOne({email:email},{password:hash})
.then(function(data){
  console.log(data)
      })
    })
    res.status(200).json({
      message: "success"
    });
})
//------------------------------------------------------------------//


//-------------------------Removing Token---------------------------//
router.delete('/delete-token',asyncHandler(async(req,res,next)=>{
  const email=req.cookies.resetEmail
  Otp.findOneAndDelete({email:email})
  .then((response)=>{
    console.log(response)
  })
  .catch((err)=>{
    console.log(err)
  })
    res.clearCookie("resetEmail")
    res.clearCookie("resetToken")
    res.status(200).json({
      success: true,
    });
  }));
//------------------------------------------------//


//---------------------------------User Logout---------------------------//
  router.get('/logout',asyncHandler(async (req, res, next) => {
   res.cookie("token", "none",{maxAge:new Date().getTime()+300*1000,httpOnly:true})
   res.cookie("userID", "none",{maxAge:new Date().getTime()+300*1000,httpOnly:true})
    res.status(200).json({
      success: true,
      data: "User Logged out",
    });
  }));
//----------------------------------------------------------------------------//



//---------------------------------Change Password-----------------------------------//
  router.put('/change-password',auth.verifyToken, function(req,res){
    const id=req.cookies.userID
    const opassword=req.body.opassword
    const npassword=req.body.npassword
    Customer.findOne({_id:id})
    .then(function(data){
        if(data===null){
            return res.status(401).json({message:"Invalid"})
        }
        bcryptjs.compare(opassword,data.password,function(err,result){
            if(result===false){
                return res.status(401).json({message:"Invalid recent password"})
            }
            else{
              bcryptjs.hash(npassword,10,function(err,hash){
                Customer.updateOne({id:id},{password:hash})
                .then(function(data){
                      }).catch((err)=>{
                        console.log(err)
                      })
                    })
                    res.status(200).json({
                      message: "Password updated"
                    });
            }
        })
    })
    .catch(function(e){
        res.status(500).json({message:e})
    })
  }) 
  //----------------------------------------------------------------------///

module.exports=router;