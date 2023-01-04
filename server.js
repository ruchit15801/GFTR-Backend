require('dotenv').config({ path: './config/.env' })
require('./config/mongodb')
const express = require("express");
const http = require('http');
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();
const Emitter = require('events')
const passport = require('passport')
//importing the routes
const userRouter = require('./app/routes/user.route')
const adminRouter = require('./app/routes/admin.route')


var mung = require('express-mung');
const { decodeReqData, encodeResData } = require('./public/partials/cryptoJS')

const { updateMetarate, checkSessionExpiration } = require('./public/partials/utils')

//passport config
app.use(passport.initialize())
require('./config/passport')

//render image from public directory
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

app.use(express.json());
// app.use(cors());
// app.use(cors({credentials: true, origin: 'http://localhost:3031'}));
//parse cookies
app.use(cors({credentials: true, origin: true}));
// app.use(cors({credentials: true, origin: 'http://localhost:3000'}));


app.use(cookieParser());


// routes for encode and decode data (for development purpose only)
const userControllers = require("./app/controllers/user.controller")
app.post('/encodeData', userControllers.encodeReqData)
app.post('/decodeData', userControllers.decodeResData)


//decode the request body for every request
app.use(decodeReqData)

//encode the response body for every request
app.use(mung.json(encodeResData));

//accessing the routes
app.use(userRouter);
app.use(adminRouter);

//Expire user session 
checkSessionExpiration()

//default route
app.all('*', (req, res) => {
    return res.status(404).send("URL not found server.js")
})

// server port define
const PORT = process.env.PORT || 5100;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});