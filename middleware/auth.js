const jwt=require('jsonwebtoken')
const Customer=require('../models/customerInfo')
const Admin=require('../models/adminLogin')

module.exports.verifyUser=function(req,res,next){
    try{
    const token=req.headers.authorization.split(" ")[1]
    const data=jwt.verify(token,'anysecretkey')
    Customer.findOne({_id:data.userid}).then(function(userData){
        req.data=userData
        next()
    }).catch(function(ee){
        res.status(401).json({error:ee})
    })
    }
    catch(e){
    res.status(401).json({error:e})
    }
}


module.exports.verifyToken=function(req,res,next){
    try{
    const token=req.cookies.token
    const data=jwt.verify(token,'anysecretkey')
    Customer.findOne({_id:data.userid}).then(function(userData){
        req.data=userData
        next()
    }).catch(function(ee){
        res.status(401).json({error:ee})
    })
    }
    catch(e){
    res.status(401).json({error:e})
    }
}


module.exports.verifyResetToken=function(req,res,next){
    try{
    const token=req.cookies.resetToken
    const data=jwt.verify(token,'anysecretkey')
    Customer.findOne({_id:data.userid}).then(function(userData){
        req.data=userData
        next()
    }).catch(function(ee){
        res.status(401).json({error:ee})
    })
    }
    catch(e){
    res.status(401).json({error:e})
    }
}


module.exports.verifyAdmin=function(req,res,next){
    try{
    const token=req.cookies.adminToken
    const data=jwt.verify(token,'anysecretkey')
    Admin.findOne({_id:data.userid}).then(function(userData){
        req.data=userData
        next()
    }).catch(function(ee){
        res.status(401).json({error:ee})
    })  
    }
    catch(e){
    res.status(401).json({error:e})
    }
}