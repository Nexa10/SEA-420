const express = require("express")
const app = express()
const HTTP_PORT = process.env.PORT || 8080

app.use(express.urlencoded({ extended: true }))
app.use(express.static("assets"))

const exphbs = require("express-handlebars");
app.engine(".hbs", exphbs.engine({
    extname: ".hbs",
    helpers: {
        json: (context) => { return JSON.stringify(context) }
    }
   }));
app.set("view engine", ".hbs")

const session = require('express-session')
app.use(session({
   secret: "the quick brown fox jumped over the lazy dog 1234567890",  
   resave: false,
   saveUninitialized: true
}))

const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://Nexa10:0987654321Messi@cluster0.lu9g8kk.mongodb.net/?retryWrites=true&w=majority");

const db = mongoose.connection
db.on("error", console.error.bind(console, "Error connecting to database: "));
db.once("open", () => {
  console.log("Mongo DB connected successfully.");
});

const Schema = mongoose.Schema
const gymClassSchema = new Schema({classname:String, classimg:String, length:Number})
const userSchema = new Schema({username:String, password:String})
const paymentSchema = new Schema({username:String, classname: String, price:Number, hstPrice: Number,  date: Date})

// --------- GLOBAL VARIABLES ---------
const gymclass = mongoose.model("classes_collection", gymClassSchema)    
const users = mongoose.model("users_collection", userSchema) 
const payments = mongoose.model("payments_collection", paymentSchema) 

let ErrorDictionary = {
    "NOTLOGIN": "Oops, You have to login or create an account",
    "FAILEDLOGIN" : "Username or Password is incorrect",
    "TOOSHORT": "Username/Password must be at least 6 characters",
    "EXISTING": "Username is unavailable, Choose another one",
    "NAN": "Fields cannot be left empty",
    "NOTADMIN": "You must be an Admin to view this page"
}

const ErrorMsg = {isError:undefined, msg:undefined};
//D: Constructor 
const init_ErrorMsg = (truthval, typeofError)=>{
    ErrorMsg.isError = truthval;
    ErrorMsg.msg = ErrorDictionary[typeofError];
}
const bookingRate = 0.65;


// --------- FUNCTIONS ---------
const bookClass = async (class_id, _username) =>{
    try{
        const findClass = await gymclass.findOne({_id: class_id});

        if(findClass != undefined){
            const subtotal = findClass.length * bookingRate;
            const totalPrice = subtotal + (0.13 * subtotal);

            const newPayment = payments({username: _username, classname: findClass.classname, price: subtotal, hstPrice: totalPrice, date: new Date()});
            newPayment.save();
        }    
    }
    catch(error){
        console.log(error)
    }   
}

//D: Calculates the price of each gym class
const mapPrices = (listFromDB) =>{
    const localList = []
    for(let i = 0; i < listFromDB.length; i++){
       const _price = listFromDB[i].length * 0.65;
       
       localList.push({id: listFromDB[i]._id, classname: listFromDB[i].classname, classimg: listFromDB[i].classimg, length: listFromDB[i].length, price: _price});
    }
    return localList;
}

//D: takes a list of payment_collection type, and produces the cart summary
const getUserBookings = (listFromDB) =>{
    const localList = []
    for(let i = 0; i < listFromDB.length; i++){
        const _len = listFromDB[i].price/bookingRate //D: converting the price to length
       localList.push({idx: i + 1, classname: listFromDB[i].classname,  length: _len, price: listFromDB[i].hstPrice});
    }
    return localList;
}

// --------- ENDPOINTS ---------
app.get("/", async (req, res) =>{
    try{
        const classes = await gymclass.find().lean()
        res.render("homepage", {layout:"pageTemplate", isLoggedin:req.session.userLoggedIn, gymclasses:mapPrices(classes)})
    }
    catch(error){
        console.log(error)
    }
})

//NOTE Book class
app.post("/book-class:class_id", async(req, res) =>{
    const id = req.params.class_id
    if(req.session.userLoggedIn === undefined){
        init_ErrorMsg(true, "NOTLOGIN")
        res.render("msgprompt", {layout:"pageTemplate", isLoggedin:req.session.userLoggedIn, errormsg:ErrorMsg})
        return
    }

    bookClass(id, req.session.username);
    init_ErrorMsg(false, "");

    res.render("msgprompt", {layout:"pageTemplate", isLoggedin:req.session.userLoggedIn, errormsg:ErrorMsg})
})

//NOTE Cart
app.get("/cart", async(req, res) =>{
    if(req.session.userLoggedIn === undefined){
        init_ErrorMsg(true, "NOTLOGIN")
        res.render("msgprompt", {layout:"pageTemplate", isLoggedin:req.session.userLoggedIn, errormsg:ErrorMsg})
        return
    }

    try{
        const findClasses = await payments.find({username: req.session.username});
        const listofclasses = getUserBookings(findClasses);
        res.render("cartpage", {layout:"pageTemplate", isLoggedin:req.session.userLoggedIn, userBookings:listofclasses})
    }
    catch(error){
        console.log(error)
    }
   
})

//NOTE Admin
app.get("/admin", async(req, res) =>{
    if(req.session.userLoggedIn === undefined){
        init_ErrorMsg(true, "NOTLOGIN")
        res.render("msgprompt", {layout:"pageTemplate", isLoggedin:req.session.userLoggedIn, errormsg:ErrorMsg})
        return
    }
    else if(req.session.userLoggedIn === true){
        const _username = req.session.username

        //D: Admins access is granted if a username begins with the word "admin"
        if(_username.substring(0, 5) != "admin"){
            init_ErrorMsg(true, "NOTADMIN")
            res.render("msgprompt", {layout:"pageTemplate", isLoggedin:req.session.userLoggedIn, errormsg:ErrorMsg})
            return
        }
    }

    const paymentSummary = await payments.find({date:{$lt: new Date()}}).lean()

    res.render("adminpage", {layout:"pageTemplate", isLoggedin:req.session.userLoggedIn, inventory: paymentSummary})
})

app.get("/login", (req, res) =>{
    //returns login / create
    res.render("login", {layout:"pageTemplate"})
})

//NOTE Login
app.post("/login-account", async(req, res) =>{
    const formUsername = req.body.username;
    const formPassword = req.body.password;

    if(formUsername.length < 1 || formPassword.length < 1){
        init_ErrorMsg(true, "NAN");
        res.render("login", {layout:"pageTemplate", errormsg:ErrorMsg});
        return
    }

    if(formUsername.length < 6 || formPassword.length < 6){
        init_ErrorMsg(true, "TOOSHORT");
        res.render("login", {layout:"pageTemplate", errormsg:ErrorMsg});
        return
    }

    try{
        const existingUser = await users.findOne({username: formUsername})
        if(existingUser === null || existingUser.password != formPassword){
            init_ErrorMsg(true, "FAILEDLOGIN");
            res.render("login", {layout:"pageTemplate", errormsg:ErrorMsg});
            return
        }
        req.session.userLoggedIn = true;
    }
    catch(error){
        console.log(error)
    }

    req.session.username = formUsername;

    res.redirect(302, '/'); //D: returns to home
})

//NOTE Create
app.post("/create-account", async(req, res) =>{
    const formUsername = req.body.username;
    const formPassword = req.body.password;

    if(formUsername.length < 1 || formPassword.length < 1){
        init_ErrorMsg(true, "NAN");
        res.render("login", {layout:"pageTemplate", errormsg:ErrorMsg});
        return
    }

    if(formUsername.length < 6 || formPassword.length < 6){
        init_ErrorMsg(true, "TOOSHORT");
        res.render("login", {layout:"pageTemplate", errormsg:ErrorMsg});
        return
    }

    //D: Checks if username exists
    try{
        const existingUser = await users.findOne({username: formUsername})
        if(existingUser != null){
            init_ErrorMsg(true, "EXISTING");
            res.render("login", {layout:"pageTemplate", errormsg:ErrorMsg});
            return
        }
    }
    catch(error){
        console.log(error)
    }

    try{
        const newUser = users({username: formUsername, password: formPassword})
        await newUser.save()
        req.session.username = formUsername;
    }
    catch(error){
        console.log(error)
    }

    req.session.userLoggedIn = true;
    res.redirect(302, '/'); //D: returns to home
})

app.get("/logout", (req, res) =>{
    req.session.destroy()
    res.redirect(302, '/');
})

// start server
const onHttpStart = () => {
    console.log("Express http server listening on: " + HTTP_PORT);
    console.log(`http://localhost:${HTTP_PORT}`);
   }
   app.listen(HTTP_PORT, onHttpStart);
   