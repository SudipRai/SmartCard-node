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
const fetch = require('isomorphic-fetch');
const graph = require('@microsoft/microsoft-graph-client');
const request = require("request");

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


router.get('/graph',asyncHandler(async (req, res, next) => {
    const accessToken ="EwBwA8l6BAAUkj1NuJYtTVha+Mogk+HEiPbQo04AAXGT4vVPsQ7uFjtTY4i3ptoYZqv5gx/ThnxmPifPSEEnILJa0oquTQjb2Q/+85igCkP8RP98MY/Qo37ViX4S4gOS34TpZTRlMfn8GNItikn533vdeMKKkrOsiqfzeLnIQfmUOu4gR4K7Vdi20+mWsTgVI09aIigpNeeVkoVVNeHZq0DoWqxt0m9D24/2dttpxD1v90Yyqehms2UmObAN6NRs11iTjQiXHt4guv8GEr7+XrW8BJndvVAJg3Exs/yBkbt8/No73GAHZK89m9bNxg9ctiIWBl2bm8Fq1o+PLDlSqyMApsbFf78MAM4kgi11+h9oWfh7drxti1jvxK1iRw8DZgAACOq+G/BhymOoQALsoszx9R4BmP4BsZlecyB96e/I8JAu8UwxBEnynYLM0ZWMsjxYMjisQta2rsfZokGiNpVTyiuftKGQICfmbaAgfx1rk6HrFU9CrTfm8GfWq155fu5ykswmBEEoSETUwraMjL92lv0zJHJgzmC9/zJWWLVNPmWJLgNCIaXjeZ7R5KPLZ7yoQXD37SS15btCthPSA1CvpfPD+BQGmGOyOjc/rfpqdottt+t9BZ1I+kUjeso1sGSVgunc/iRwV/xSvMav4W85I7YciofcDwfc+vOABt7PJpfEL9pXvfTVesdfpcatFzfFSUliCBN/bafqzsxg8GqGnVGLybtE10nqVDK0OGWibkOTRNO/C4gSZjsNKPszBHS6j0j8e7oA3y3zM1lO90sorG6jrr3k0t4bohXY/x/EnrRVpPnAHaTQkdqj41SFF6ehcxBRiZ7x8vEC3Myr4Ib03KVOgwNmKd54RbF2p5NNN+Bv62ftC44ggoZkr1lbkn11yrNBYop1OylHTvNu+NqqWNBqx2HKV2XLAbGbaq3WUn6UdcwrlV21yKhjtbByws6MipXX7R16i0AoBbDpEMhlNogqMX2+e+Fuace5s5y9N0i88qQGhBwKjqmCp9Xup5N0K0eLsJMR47yvvlwIqHoyn/C/te45v3ENYkCxbomVmYGZft9Lv2J2iIfdwEGn6cIDqKmnGUuY0xskKT0hmvHnKK3Fo4qcZ4Nkwj+WQzWw6yiRAmZzBiR5Iu/aLkLlbAmy6OmuV8XSbZGkO2SAAg=="
    const endpoint= "https://graph.microsoft.com/v1.0/me/calendarview?$select=subject,organizer,start,end&$orderby=start/dateTime&$top=25&startDateTime=2022-04-30T18:15:00.000Z&endDateTime=2022-05-07T18:14:59.999Z"
    const options = {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    };
    
    console.log('request made to web API at: ' + new Date().toString());

    try {
        const response = await fetch(endpoint, options);
        console.log(response)
        res.status(200).json({
            message: "success",
            data: response,
          });
        
    } catch(error) {
        console.log(error)
        return error;
    }
   }));

// callAPI = async(endpoint, accessToken) => {

//     if (!accessToken || accessToken === "") {
//         throw new Error('No tokens found')
//     }
    
//     const options = {
//         headers: {
//             Authorization: `Bearer ${accessToken}`
//         }
//     };
    
//     console.log('request made to web API at: ' + new Date().toString());

//     try {
//         const response = await fetch(endpoint, options);
//         return response.json();
//     } catch(error) {
//         console.log(error)
//         return error;
//     }
// }


// getAuthenticatedClient = (accessToken) => {
//     // Initialize Graph client
//     const client = graph.Client.init({
//         // Use the provided access token to authenticate requests
//         authProvider: (done) => {
//             done(null, accessToken);
//         }
//     });

//     return client;
// }

// console.log(getAuthenticatedClient("EwBwA8l6BAAUkj1NuJYtTVha+Mogk+HEiPbQo04AAXGT4vVPsQ7uFjtTY4i3ptoYZqv5gx/ThnxmPifPSEEnILJa0oquTQjb2Q/+85igCkP8RP98MY/Qo37ViX4S4gOS34TpZTRlMfn8GNItikn533vdeMKKkrOsiqfzeLnIQfmUOu4gR4K7Vdi20+mWsTgVI09aIigpNeeVkoVVNeHZq0DoWqxt0m9D24/2dttpxD1v90Yyqehms2UmObAN6NRs11iTjQiXHt4guv8GEr7+XrW8BJndvVAJg3Exs/yBkbt8/No73GAHZK89m9bNxg9ctiIWBl2bm8Fq1o+PLDlSqyMApsbFf78MAM4kgi11+h9oWfh7drxti1jvxK1iRw8DZgAACOq+G/BhymOoQALsoszx9R4BmP4BsZlecyB96e/I8JAu8UwxBEnynYLM0ZWMsjxYMjisQta2rsfZokGiNpVTyiuftKGQICfmbaAgfx1rk6HrFU9CrTfm8GfWq155fu5ykswmBEEoSETUwraMjL92lv0zJHJgzmC9/zJWWLVNPmWJLgNCIaXjeZ7R5KPLZ7yoQXD37SS15btCthPSA1CvpfPD+BQGmGOyOjc/rfpqdottt+t9BZ1I+kUjeso1sGSVgunc/iRwV/xSvMav4W85I7YciofcDwfc+vOABt7PJpfEL9pXvfTVesdfpcatFzfFSUliCBN/bafqzsxg8GqGnVGLybtE10nqVDK0OGWibkOTRNO/C4gSZjsNKPszBHS6j0j8e7oA3y3zM1lO90sorG6jrr3k0t4bohXY/x/EnrRVpPnAHaTQkdqj41SFF6ehcxBRiZ7x8vEC3Myr4Ib03KVOgwNmKd54RbF2p5NNN+Bv62ftC44ggoZkr1lbkn11yrNBYop1OylHTvNu+NqqWNBqx2HKV2XLAbGbaq3WUn6UdcwrlV21yKhjtbByws6MipXX7R16i0AoBbDpEMhlNogqMX2+e+Fuace5s5y9N0i88qQGhBwKjqmCp9Xup5N0K0eLsJMR47yvvlwIqHoyn/C/te45v3ENYkCxbomVmYGZft9Lv2J2iIfdwEGn6cIDqKmnGUuY0xskKT0hmvHnKK3Fo4qcZ4Nkwj+WQzWw6yiRAmZzBiR5Iu/aLkLlbAmy6OmuV8XSbZGkO2SAAg=="
// ))

router.get('/token',asyncHandler(async (req, res, next) => {
const endpoint = "https://login.microsoftonline.com/f8cdef31-a31e-4b4a-93e4-5f571e91255a/oauth2/token";
const requestParams = {
    grant_type: "client_credentials",
    client_id: "fff2056b-a4d4-4a70-afb4-758e810d607b",
    client_secret: "9Ny8Q~PFa4UwN7Oa98Rrvm7iMtC67vKeJLd.2agJ",
    resource: "https://graph.microsoft.com",
    scope: [
        "profile",
        "openid",
        "email",
        "https://graph.microsoft.com/Calendars.Read",
        "https://graph.microsoft.com/Calendars.Read.Shared",
        "https://graph.microsoft.com/Contacts.Read",
        "https://graph.microsoft.com/Contacts.Read.Shared",
        "https://graph.microsoft.com/Contacts.ReadWrite",
        "https://graph.microsoft.com/Contacts.ReadWrite.Shared",
        "https://graph.microsoft.com/Files.Read.All",
        "https://graph.microsoft.com/Mail.Read",
        "https://graph.microsoft.com/Mail.Read.Shared",
        "https://graph.microsoft.com/Mail.ReadWrite",
        "https://graph.microsoft.com/Mail.ReadWrite.Shared",
        "https://graph.microsoft.com/Mail.Send",
        "https://graph.microsoft.com/Mail.Send.Shared",
        "https://graph.microsoft.com/Sites.ReadWrite.All",
        "https://graph.microsoft.com/User.Read",
        "https://graph.microsoft.com/User.ReadBasic.All"
       ]
};

request.post({ url:endpoint, form: requestParams }, function (err, response, body) {
    if (err) {
        console.log("error");
    }
    else {
        console.log("Body=" + body);
        let parsedBody = JSON.parse(body);         
        if (parsedBody.error_description) {
            console.log("Error=" + parsedBody.error_description);
        }
        else {
            console.log("Access Token=" + parsedBody.access_token);
        }
    }
})
}))

router.get('/events',asyncHandler(async (req, res, next) => {
    const accessToken="eyJ0eXAiOiJKV1QiLCJub25jZSI6Ik5lUHJMUVBxYVloTm41WlFLS2ljOGlhSEtDV25KNmRFTld6TUZsanpLLUkiLCJhbGciOiJSUzI1NiIsIng1dCI6ImpTMVhvMU9XRGpfNTJ2YndHTmd2UU8yVnpNYyIsImtpZCI6ImpTMVhvMU9XRGpfNTJ2YndHTmd2UU8yVnpNYyJ9.eyJhdWQiOiJodHRwczovL2dyYXBoLm1pY3Jvc29mdC5jb20iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9mOGNkZWYzMS1hMzFlLTRiNGEtOTNlNC01ZjU3MWU5MTI1NWEvIiwiaWF0IjoxNjUxNjQ0ODY5LCJuYmYiOjE2NTE2NDQ4NjksImV4cCI6MTY1MTczMTU2OSwiYWlvIjoiRTJaZ1lQRE5YbEZ4dHBXMXlETG9yNlB4NlZ1bkFBPT0iLCJhcHBfZGlzcGxheW5hbWUiOiJub2RlIiwiYXBwaWQiOiJmZmYyMDU2Yi1hNGQ0LTRhNzAtYWZiNC03NThlODEwZDYwN2IiLCJhcHBpZGFjciI6IjEiLCJpZHAiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9mOGNkZWYzMS1hMzFlLTRiNGEtOTNlNC01ZjU3MWU5MTI1NWEvIiwiaWR0eXAiOiJhcHAiLCJyaCI6IjAuQVhzQU1lX04tQjZqU2t1VDVGOVhIcEVsV2dNQUFBQUFBQUFBd0FBQUFBQUFBQUFCQUFBLiIsInRlbmFudF9yZWdpb25fc2NvcGUiOiJXVyIsInRpZCI6ImY4Y2RlZjMxLWEzMWUtNGI0YS05M2U0LTVmNTcxZTkxMjU1YSIsInV0aSI6IkZobmtJYzctWjBDYjYxb25GbGxZQUEiLCJ2ZXIiOiIxLjAiLCJ3aWRzIjpbIjA5OTdhMWQwLTBkMWQtNGFjYi1iNDA4LWQ1Y2E3MzEyMWU5MCJdLCJ4bXNfdGNkdCI6MTMzODMzNjY4NX0.LiIJwm_0Q_MoHKtuFMDIPLEhgmMrCg7icfznNdXdhPNpDwLyCK3uiZXQMBQ46bEYO7DuNR7xaXmQdUN-twpWXVtpVQHVaRrl7GAZdk15wH9p-mbUS3TKt-b2iaKPFP0YqPt6LUgJ-8aCUVi27Zigy_-K0kiGyFYcdU9HM8QnHz2Vg__mXu9St9Rcvk_HnRpd_PdGrwjgYlkXl8j9joA0HQsCrbXHA7o1L216mC1XjxuLILo9Xd5kiumfOTTk-tOll3-B6_Zf8l136W6Qv-j-YFJOmihQBbP5a4AdsDz0uPi7h7qzRkHfMIRrqFHVHfNYA2C733QEaEcXK0eqfLszjw"
    request.get({
        url:"https://graph.microsoft.com/v1.0/me/events",
        headers: {
          "Authorization": accessToken
        }
    }, function(err, response, body) {
        console.log(body);
    });
}))
module.exports=router;