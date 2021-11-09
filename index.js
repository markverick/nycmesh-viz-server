const express = require("express");
const { google } = require("googleapis");

//initilize express
const app = express();

//set app view engine
app.set("view engine", "ejs");

app.get("/fetch_nodes", async (req, res) => {
  const auth = new google.auth.GoogleAuth({
    keyFile: "keys.json", //the key file
    //url to spreadsheets API
    scopes: "https://www.googleapis.com/auth/spreadsheets.readonly", 
  });

  //Auth client Object
  const authClientObject = await auth.getClient();

  //Google sheets instance
  const googleSheetsInstance = google.sheets({ version: "v4", auth: authClientObject });

  const spreadsheetId = "1gEnDuwqIQtm-uWsF7ZlXEDZWEyrGtqpj-mGXhQldSK4";

  //Read front the spreadsheet
  const readData = await googleSheetsInstance.spreadsheets.values.get({
    auth, //auth object
    spreadsheetId, // spreadsheet id
    range: "Form Responses 1!P2:AO10487", //range of cells to read from.
  })
  let data = [];
  for (let i = 0; i < readData.data.values.length; i++) {
    if (readData.data.values[i][0] != 'Installed') continue;
    let row = {};
    row['id'] = readData.data.values[i][8];
    row['nn'] = readData.data.values[i][9];
    row['lat'] = readData.data.values[i][23];
    row['lng'] = readData.data.values[i][24];
    row['alt'] = readData.data.values[i][25];
    data.push(row);
  }
  //send the data reae with the response
  // console.log(readData.data.values);
  res.send(data)
})

const port = 3000;
app.listen(port, ()=>{
    console.log(`server started on ${port}`)
});

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3001");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
