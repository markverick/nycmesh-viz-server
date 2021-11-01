const express = require("express");
const { google } = require("googleapis");

//initilize express
const app = express();

//set app view engine
app.set("view engine", "ejs");

app.get("/", async (req, res) => {
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
    range: "Form Responses 1!A1:AO10", //range of cells to read from.
  })

  //send the data reae with the response
  res.send(readData.data)
})

const port = 3000;
app.listen(port, ()=>{
    console.log(`server started on ${port}`)
});