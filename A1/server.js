const express = require("express")
const app = express()
const HTTP_PORT = process.env.PORT || 8080
const path = require("path")
app.use(express.urlencoded({extended: true}))
app.use('/Files', express.static(__dirname + '/assets'))

let inventory = {num_cars: 0, amt_paid: 0}
let adminLog = [{username: "admin", password: "0000"},
                {username: "messi", password: "2023"}]

const calcTotal = (rate, hours)=>{
    let subTotal = rate * hours;
    let tax = (13/100) * subTotal;
    let total = subTotal + tax;;
    return {total: total, tax: tax, subTotal: subTotal}
}

const printReciept = (rate, hours, cost) =>{
    //cost is an object literal
    const receipt_html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt: Ticket Hub</title>
        <link rel="icon" href="Files/favicon.ico">
      </head>
      <body>
        <a style="font-family: calibri;" href="http://localhost:8080/">Home Page</a>
        <h1 style="font-family: calibri;">Your Receipt</h1>
        <p style="font-family: calibri;">Hours requested: ${hours} hours</p>
        <p style="font-family: calibri;">Hourly rate: $${rate} per hour</p>
        <p style="font-family: calibri;">Subtotal: ${cost.subTotal.toFixed(2)}</p>
        <p style="font-family: calibri;">Total: ${cost.total.toFixed(2)}</p>
        <p style="font-family: calibri;">Tax: ${cost.tax.toFixed(2)}</p>
        <p style="font-weight: bold; font-family: calibri;">You must pay: $${cost.total.toFixed(2)}</p>
      </body>
    </html>
  `
  return receipt_html
}

const errorMsg = (prompt) =>{
    //prompt -> string, gets value of the error
    let dictionary = {
        "empty": "ERROR: Field cannot be left empty",
        "nan" : "ERROR: Hours must be a number",
        "max num exceeded": "ERROR: The Maximum number of hours is 8",
        "min num exceeded": "ERROR: The Minimum number of hours is 1",
        "login failed": "ERROR: Login Failed"
    }

    let msg = dictionary[prompt.toLowerCase()];

    const errorMsg_html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Error: Ticket Hub</title>
        <link rel="icon" href="Files/favicon.ico">
      </head>
      <body>
        <a style="font-family: calibri;" href="http://localhost:8080/">Home Page</a>
        <h2 style="font-family: calibri; color: red; background-color: yellow;">${msg}</h1>
      </body>
    </html>
  `
  return errorMsg_html
}

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"))
})

app.post("/pay", (req, res)=>{
    if(req.body.license_plate === "" || req.body.hours === ""){
        res.send(errorMsg("empty"))
        return
    }
        
    if(isNaN(req.body.hours)){
        res.send(errorMsg("NaN"))
        return
    }
        
    //convert to numbers
    const rate = parseFloat(req.body.parking_rate)
    const hour = parseInt(req.body.hours)

    if(hour > 8){
        res.send(errorMsg("max num exceeded"))
        return
    }
        
    if(hour < 1){
        res.send(errorMsg("min num exceeded"))
        return
    }    
    
    //calcTotal - calculates the cost and returns an object literal
    const receiptObject = calcTotal(rate, hour);
    inventory['num_cars'] += 1;
    inventory['amt_paid'] += receiptObject.total;
    res.send(printReciept(rate, hour, receiptObject))
})

app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"))
})

app.post("/login", (req, res)=>{
    if(req.body.admin_username === "" || req.body.admin_password === ""){
        res.send(errorMsg("empty"))
        return
    }

    const username = req.body.admin_username
    const password = req.body.admin_password
    let found = false
    for(let i = 0; i < adminLog.length; i++){
        if(username === adminLog[i].username && password === adminLog[i].password){
            found = true;
        }
    }

    if(found === false){
        res.send(errorMsg("Login failed"))
        return
    }

    const inventoryInfoHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Info: Ticket Hub</title>
        <link rel="icon" href="Files/favicon.ico">
      </head>
      <body>
        <a style="font-family: calibri;" href="http://localhost:8080/">Home Page</a>
        <p style="font-family: calibri;">Total Cars: ${inventory.num_cars}</p>
        <p style="font-family: calibri;">Total amount collected: $${inventory.amt_paid.toFixed(2)}</p>
      </body>
    </html>
  `
    res.send(inventoryInfoHtml)
})

const onHttpStart = () => {
    console.log(`Express web server running on port: ${HTTP_PORT}`)
    console.log("http://localhost:8080/")
    console.log(`Press CTRL+C to exit`)
}

app.listen(HTTP_PORT, onHttpStart)