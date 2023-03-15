const express = require("express")
const app = express()
const HTTP_PORT = process.env.PORT || 8080
const path = require("path")
app.use(express.urlencoded({extended: true}))
app.use('/Files', express.static(__dirname + '/assets'))

let payment = [
    {license_plate: "hhdjee", amt_paid: 102},
]

let admins = [{username: "admin", password: "0000"}]

const parking_lot = [
    {name: "Parking_Lot_A", hourly_rate: 2.50},
    {name: "Parking_Lot_B", hourly_rate: 1.00},
    {name: "Underground_Garage_Parking", hourly_rate: 5.00}
]

const calcTotal = (lot_name, hours)=>{
    let rate = undefined;

    for(let i = 0; i < parking_lot.length; i++){
        if(lot_name === parking_lot[i].name){
            rate = parking_lot[i].hourly_rate
            break;
        }
    }

    let total = rate * hours;
    let tax = (13/100) * total;
    let subTotal = total + tax;
    return {total: total, tax: tax, subTotal: subTotal}
}

// http://localhost:8080/
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"))
})

app.post("/pay", (req, res)=>{
    console.log(req.body)
    res.send("Paid!!")
})

app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"))
})

app.post("/login", (req, res)=>{
    console.log(req.body)
    res.send("Logged in!!")
})

const onHttpStart = () => {
    console.log(`Express web server running on port: ${HTTP_PORT}`)
    console.log(`Press CTRL+C to exit`)
}

app.listen(HTTP_PORT, onHttpStart)