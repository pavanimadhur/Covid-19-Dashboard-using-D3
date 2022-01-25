// create an express app
const express = require("express")
const app = express()

const path = require("path")
const fs = require('fs')
const bodyParser = require('body-parser')

let jsonParser = bodyParser.json()
let urlencodedParser = bodyParser.urlencoded({ extended: false })
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// use the express-static middleware
app.use(express.static("public"))

// define the first route
app.get("/hello", function (req, res) {
    res.send("<h1>Hello World!</h1>")
})

// To get the  values from  top15countries.json for the d3 elements
app.get('/flags', (req,res)=> {
  let jdata = JSON.parse(fs.readFileSync('public/top15countries.json'));
  res.json(jdata)
})

// To write the updated count values in JSON file when we hover on the particular country on the map
// Get the data from client Javascript and update top15countries.json
app.post("/update",(req, res) =>{
    fs.writeFile("public/top15countries.json", JSON.stringify(req.body), (err) => {
        if (err)
        {
          console.log(err);
          res.sendStatus(500);
        }
        else {
          console.log("File written successfully\n");
          res.sendStatus(200)
        }
      });
    
})


// start the server listening for requests
let listener = app.listen(process.env.PORT || 3000, 
	() => console.log(`Pavani's CRUD is running...${listener.address().port}`));
