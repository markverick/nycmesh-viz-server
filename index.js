const express = require("express");
const bodyParser = require("body-parser");
const { google } = require("googleapis");
const csv = require('csv-parser');
const fs = require('fs');
const fastPriorityQueue = require('fastpriorityqueue');

// Loading edges
let adj;
edgeLoader('scripts/edges_set.csv', updateAdj);
console.log('edge cost loaded');

// Initilize express
const app = express();

// Set CORS policy
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3001");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


// Set app view engine
app.set("view engine", "ejs");

// Set bodyparser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/path_finding", async (req, res) => {
  let x = req.query['node1'];
  let y = req.query['node2'];
  let badNodes = req.query['disabled_node'] == undefined? []: req.query['disabled_node'].split(',');
  result = pathFinding(x, y, badNodes);
  res.send(result);
});

app.get("/fetch_nodes", async (req, res) => {
  const auth = new google.auth.GoogleAuth({
    keyFile: "keys.json", //the key file
    //url to spreadsheets API
    scopes: "https://www.googleapis.com/auth/spreadsheets.readonly", 
  });

  // Auth client Object
  const authClientObject = await auth.getClient();

  // Google sheets instance
  const googleSheetsInstance = google.sheets({ version: "v4", auth: authClientObject });

  const spreadsheetId = "1gEnDuwqIQtm-uWsF7ZlXEDZWEyrGtqpj-mGXhQldSK4";

  // Read front the spreadsheet
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
    row['active'] = row['nn'] !== "";
    if (readData.data.values[i][4].toLowerCase().includes("hub")) {
      row['type'] = "hub";
    } else if (readData.data.values[i][3].toLowerCase().includes("supernode")) {
      row['type'] = "supernode";
    } else {
      row['type'] = "node";
    }
    data.push(row);
  }
  // Send the data reae with the response
  // console.log(readData.data.values);
  res.send(data)
})

const port = 3000;
app.listen(port, ()=>{
    console.log(`server started on ${port}`)
});

class Vertex {
  constructor(v, w) {
    this.v = v;
    this.w = w;
  }
}

// Return adjacency list
function edgeLoader(filename, callback) {
  let edgeSet = new Set();
  // let edges = [];
  let adj = {};
  
  fs.createReadStream(filename)
  .pipe(csv(['x', 'y', 'cost']))
  .on('data', (data) => {
    // Eliminate duplicates
    const str1 = data['x'] + data['y'];
    const str2 = data['y'] + data['x'];
    if (!edgeSet.has(str1) && !edgeSet.has(str2)) {
      edgeSet.add(str1);
      let cost = 20;
      cost = data['cost']
      // data['cost'] = EDGE_COST[data['type']];
      // edges.push(data);
      if (adj[data['x']] == undefined) {
        adj[data['x']] = [];
      }
      if (adj[data['y']] == undefined) {
        adj[data['y']] = [];
      }
      adj[data['x']].push(new Vertex(data['y'], cost));
      adj[data['y']].push(new Vertex(data['x'], cost));
    }
  })

  .on('end', () => {
    // console.log(adj);
    callback(adj);
    return;
  });
}

// Callback function to update adjacency list
function updateAdj(val) {
  adj = val;
}



// Using Dijkstra Algorithm
// Swapped x and y because backtracking makes the path inversed
function pathFinding(y, x, badNodes) {
  let pq = new fastPriorityQueue(function(a, b) {
    return a.w < b.w;
  });
  let dist = {};
  let prev = {};
  let result = [];
  // console.log(badNodes)
  for (let v in adj) {
    dist[v] = Number.MAX_VALUE;
    // console.log(v);
  }
  dist[x] = 0;
  pq.add(new Vertex(x, 0));
  while (!pq.isEmpty()) {
    let u = pq.poll();
    if (badNodes.includes(u.u)) {
      continue;
    }
    // console.log(adj[u.v]);
    for (let v of adj[u.v]) {
      if (badNodes.includes(v.v)) {
        continue;
      }
      if (u.w + v.w < dist[v.v] ) {
        dist[v.v] = u.w + v.w;
        pq.add(new Vertex(v.v, dist[v.v]));
        prev[v.v] = u.v;
      }
    }
  }
  if (dist[y] != Number.MAX_VALUE) {
    let v = y;
    result.push(v);
    while (v != x) {
      v = prev[v];
      result.push(v);
    }
  }
  // console.log(result, dist[y]);
  return result;
}
