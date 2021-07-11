const express=require('express');
const path = require("path");
const dotenv = require("dotenv")
const fileupload = require("express-fileupload");
const cors=require("cors")
const cookieparser=require("cookie-parser")


dotenv.config({
    path: "./database/config.env",
});
// Connect to mongoDB database
const connectDB=require('./database/db')

// Load routes files
const customerInfoRoute=require('./routes/customerInfoRoute');
const adminRoute=require('./routes/adminRoute');


const app=express();



//Body parser , which allows to receive body data from postman
app.use(cors({origin: "http://localhost:3000",
credentials: true}))
app.use(express.json());
app.use(express.urlencoded({limit: '50mb',urlencoded:true}))
app.use(cookieparser())

app.use(function(req, res, next) {
    res.header('Content-Type', 'application/json;charset=UTF-8')
    res.header('Access-Control-Allow-Credentials', true)
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    )
    next()
  })
//File upload
app.use(fileupload());
// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// Mount routes
app.use(customerInfoRoute)
app.use(adminRoute)



app.listen(90)

