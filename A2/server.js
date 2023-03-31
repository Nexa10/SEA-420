
const express = require("express");
const app = express();
const HTTP_PORT = process.env.PORT || 8080;
app.use(express.static('assets'))
app.use(express.urlencoded({ extended: true }))
const exphbs = require("express-handlebars");
app.engine(".hbs", exphbs.engine({
  extname: ".hbs",
  helpers: {
      json: (context) => { return JSON.stringify(context) }
  }
}));
app.set("view engine", ".hbs");

//------------------------------------------------------------------------
/*Global Variables*/ 
const database = [{id:"GMCP", productName:"Gaming PC", img:"Gaming-Computer-PNG-Image.png", available:true},
                    {id:"BHPN", productName:"Argentina Football Jersey", img:"jersey.png", available:true},
                    {id:"BGPK", productName:"Adidas Bag Pack", img:"adidasbag.png", available:true},
                    {id:"HEAD", productName:"Beyerdynamics Headphone", img:"headphones.png", available:true},
                    {id:"RBLP", productName:"Razer Blade 15 Laptop", img:"laptop.png", available:true},
                    {id:"PYS5", productName:"Play Station 5", img:"ps5-photo.png", available:true},
                    {id:"PYS4", productName:"Play Station 4", img:"ps4-photo.png", available:true},] 

let ErrorDictionary = {
    "NOTFOUND": "No results found",
    "NOITEMS" : "No rented Items found",
    "NAN": "ERROR: Empty Field Provided",
    "NOCHOICE": "ERROR: Choose a filter type"
}

let returnObject = [] //D: This object is returned to the template.
let errorMsg = undefined //D: Returns the values of a dictionary key
//------------------------------------------------------------------------

const rentProduct = (id) =>{
    for(let i = 0; i < database.length; i++){
        if(id === database[i].id){
            database[i].available = false;
            break;
        } 
    }
}

const returnAllProduct = () =>{
    returnObject = [];
    for(let i = 0; i < database.length; i++){
        if(database[i].available === false){
            database[i].available = true;
            returnObject.push(database[i])
        } 
    }
}

const search = (productNames, keyword) =>{
    let j = 0;
    let arr = [];
    for (let i = 0; i < productNames.length; i++) {
        if (productNames[i] === " "){
            j++;
        } 
        else{
            if (!arr[j]) arr[j] = "";
            arr[j] += productNames[i];
        }
    }
    
    let flag =false;
    for(let i = 0; i < arr.length; i++){
        if (keyword === arr[i]) flag = true;
    }
    return flag;
}

const searchByKeyword = (keyword) =>{
    returnObject = [];
    for(let i = 0; i < database.length; i++){
        if(search(database[i].productName.toLowerCase(), keyword.toLowerCase()) === true){
            returnObject.push(database[i]);
        } 
    }
}

const filterSearch = (searchtype) =>{
    returnObject = [];
    let searchCriteria = undefined;

    if(searchtype === "available")
        searchCriteria = true;

    else if(searchtype === "rentals")
        searchCriteria = false;

    for(let i = 0; i < database.length; i++){
        if(database[i].available === searchCriteria){
            returnObject.push(database[i])
        } 
    }
}

app.get("/", (req, res) =>{
    res.render("homepage", {layout:false, productsItems:database})
})

//NOTE Search
app.post("/search", (req, res)=>{
    const s_keyword = req.body.searchKeyword;
    if(s_keyword == ""){
        errorMsg = ErrorDictionary["NAN"]
        res.render("errorpage", {layout:false, errMsg:errorMsg})
        return
    }
    //D: Search for keyword
    searchByKeyword(s_keyword);

    if(returnObject.length < 1){
        errorMsg = ErrorDictionary["NOTFOUND"]
        res.render("errorpage", {layout:false, errMsg:errorMsg})
        return
    }

    res.render("homepage", {layout:false, productsItems:returnObject})
})

//NOTE Modify
app.post("/modify-results", (req, res)=>{
    const s_type = req.body.resultType;
    if(s_type === undefined){
        errorMsg = ErrorDictionary["NOCHOICE"]
        res.render("errorpage", {layout:false, errMsg:errorMsg})
        return
    }
 
    //D: Modifies the search
    filterSearch(s_type);

    //D: If user has no rented item
    if(returnObject.length < 1){
        errorMsg = ErrorDictionary["NOITEMS"]
        res.render("errorpage", {layout:false, errMsg:errorMsg})
        return
    }
    res.render("homepage", {layout:false, productsItems:returnObject})
})

//NOTE Rent
app.post("/rent", (req, res)=>{
    const p_id = req.body.productId;
    rentProduct(p_id);
    res.render("homepage", {layout:false, productsItems:database})
})

//NOTE Return
app.post("/return", (req, res)=>{
    returnAllProduct();
    if(returnObject.length < 1){
        errorMsg = ErrorDictionary["NOITEMS"]
        res.render("errorpage", {layout:false, errMsg:errorMsg})
        return
    }
    
    res.render("homepage", {layout:false, productsItems:database})
})

const onHttpStart = () => {
    console.log("Express http server listening on: " + HTTP_PORT);
    console.log(`http://localhost:${HTTP_PORT}`);
   }
   app.listen(HTTP_PORT, onHttpStart);