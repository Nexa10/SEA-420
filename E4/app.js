const cars = [
    {type: "Hatchback", licensePlate: "ESC 124", available: true, rate: 30},
    {type: "Crossover", licensePlate: "532 IT2", available: false, rate: 15},
    {type: "Convertible", licensePlate: "TTQ 330", available: true, rate: 20},
    {type: "Pickup Truck", licensePlate: "IQE 240", available: true, rate: 25}
]

const calcCost = (rate, days, seatNeeded) =>{
    var resvNum, subTotal, total, tax; 

    if (seatNeeded === true){
        subTotal = (rate * days) + (3 * days)   
    }
    else{
        subTotal = (rate * days) 
    }

    tax = (13/100 * subTotal).toFixed(2);
    total =  subTotal + tax;
    resvNum = Math.floor(Math.random() * 9000 + 1000);

    return [resvNum, subTotal, total, tax]
}

const createReservation = (carType, days, seatNeeded) =>{
    var found = false;
    var available = false
        for(let i = 0; i < cars.length; i++){
            if(carType === cars[i].type){
                if (cars[i].available === true){
                                                    //does the calc
                    [resvNum, subTotal, total, tax] = calcCost(cars[i].rate, days, seatNeeded)
    
                    console.log("\n-----------------------",
                                "\nRECEIPT","\n-----------------------")
                    console.log(
                        "Reservation Number: " + resvNum,
                        "\nCar Type: " + cars[i].type,
                        "\nLicense Plate: " + cars[i].licensePlate,
                        "\nSubtotal: " + subTotal,
                        "\nTax: " + tax,
                        "\nTotal: " + total
                    )
                    available = true       
                }
                found = true
                break          
            }        
        }
        if(!available){
            console.log("Vehicle not available")
        }
        else if(!found){
            console.log("A matching vehicle cannot be found")
        }
}

console.log("-------------------------------")
console.log("Welcome to David's Car Rental")
console.log("-------------------------------")


var carType = "Hatchback"
var numDays = 3
var carSeats = true

console.log("Requested car type: " + carType)
console.log("Days: " + numDays)
console.log("Car seat needed?: " + carSeats)

createReservation(carType, numDays, carSeats)