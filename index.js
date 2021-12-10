const express = require("express");
const bodyParser = require("body-parser");
const { google } = require("googleapis");
const { PythonShell } = require('python-shell')
const csv = require('csv-parser');
const fs = require('fs');
const fastPriorityQueue = require('fastpriorityqueue');

// Loading edges
let adj;
let visibleNodes = {};
edgeLoader('scripts/outputs/edges_set.csv', updateAdj);
// Loading nn-ip dictionary
let nnToIp = {}
nnToIpLoader('scripts/outputs/nn_to_ip_dict.csv', updateDict);
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
  if (adj[x] == undefined || adj[y] == undefined) {
    res.status(400).send("Nodes not found")
    return;
  }
  result = pathFinding(x, y, badNodes);
  res.send(result);
});

app.get("/fetch_nodes", async (req, res) => {
  dict = {}
  json = fs.readFileSync('scripts/outputs/nodes.json');
  result = JSON.parse(json);
  fs.createReadStream('scripts/outputs/nn_to_ip_dict.csv')
  .pipe(csv(['nn', 'ip']))
  .on('data', (data) => {
    dict[data.nn] = data.ip;
  })
  .on('end', () => {
    for (let i = 0; i < result.length; i++) {
      if (dict[result[i]['nn']] != undefined) {
        result[i]['ip'] = dict[result[i]['nn']];
      }
    }
    res.send(result);
  })
})

app.get("/fetch_edges", async (req, res) => {
  let v = req.query['node'];
  let result = [];
  if (adj[v] == undefined) {
    res.status(400).send('node not found')
    return;
  }
  dict = {}
  for (data of adj[v]) {
    node = mergeSxt(data.v);
    if (!node.startsWith('sxt')) {
      // Sanitize output
      if (dict[data.v] == undefined && data.v != v) {
        result.push({ "nn": data.v, "cost": data.w });
        dict[data.v] = data.w
      }
    }
  }
  res.send(result);
})

app.get("/fetch_edges_hard", async (req, res) => {
  let v = req.query['node'];
  if (nnToIp[v] == undefined) {
    res.status(400).send('node not found');
    return;
  }
  let result = [];
  let options = {
    mode: 'text',
    pythonOptions: ['-u'],
    scriptPath: 'scripts',
    args: [nnToIp[v]]
  };
  PythonShell.run('edge_request.py', options, function (err, results) {
    if (err) throw err;
    // results is an array consisting of messages collected during execution
    edges = JSON.parse(results)
    for (edge of edges) {
      let node = mergeSxt(edge[1]);
      if (!node.startsWith('sxt')) {
        result.push({ "nn": node, "cost": Number(edge[2])})
      }
    }
    res.send(result);
  });
  
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
  let edges = [];
  let adj = {};
  
  fs.createReadStream(filename)
  .pipe(csv(['x', 'y', 'cost']))
  .on('data', (data) => {
    // Duplicates should already be handled in the script
    if (!data.x.startsWith('sxt')) {
      visibleNodes[data.x] = true
    }
    if (!data.y.startsWith('sxt')) {
      visibleNodes[data.y] = true;
    }
    edges.push(data)
  })
  .on('end', () => {
    for (data of edges) {
      // Need to do dirty work and read twice because the format is not ideal to work
      let x = mergeSxt(data['x']);
      let y = mergeSxt(data['y']);
      let cost = Number(data['cost']);
      if (adj[x] == undefined) {
        adj[x] = [];
      }
      if (adj[y] == undefined) {
        adj[y] = [];
      }
      adj[x].push(new Vertex(y, cost));
      adj[y].push(new Vertex(x, cost));
    }
    // console.log(adj)
    callback(adj);
    return;
  });
}

// Callback function to update adjacency list
function updateAdj(val) {
  adj = val;
}

// Load nn-to-ip dictionary from the csv
function nnToIpLoader(filename, callback) {
  dict = {}
  fs.createReadStream(filename)
  .pipe(csv(['nn', 'ip']))
  .on('data', (data) => {
    dict[data['nn']] = data['ip']
  })
  .on('end', () => {
    callback(dict);
    return;
  });
}

// Callback function to update nn-to-ip dictionary
function updateDict(val) {
  nnToIp = val;
}

function mergeSxt(node) {
  if (node.startsWith('sxt') && visibleNodes[node.slice(5)] != undefined) {
    return node.slice(5)
  }
  return node;
}

// Using Dijkstra Algorithm
// Swapped x and y because backtracking makes the path inversed
function pathFinding(y, x, badNodes) {
  let pq = new fastPriorityQueue(function(a, b) {
    if (a.w[0] == b.w[0]) {
      return a.w[1] < b.w[1];
    } else {
      return a.w[0] < b.w[0];
    }
  });
  let dist = {};
  let prev = {};
  let result = [];
  // console.log(badNodes)
  for (let v in adj) {
    dist[v] = [Number.MAX_VALUE, Number.MAX_VALUE];
  }
  dist[x] = [0, 0];
  pq.add(new Vertex(x, [0, 0]));
  while (!pq.isEmpty()) {
    let u = pq.poll();
    if (badNodes.includes(u.v)) {
      continue;
    }
    // console.log(u.v, u.w);
    for (let v of adj[u.v]) {
      if (badNodes.includes(v.v)) {
        continue;
      }
      if (u.w[0] + v.w < dist[v.v][0] ||  (u.w[0] + v.w == dist[v.v][0] && u.w[1] + 1 < dist[v.v][1])) {
        dist[v.v] = [u.w[0] + v.w, u.w[1] + 1];
        pq.add(new Vertex(v.v, dist[v.v]));
        prev[v.v] = [u.v, v.w];
      }
    }
  }
  if (dist[y][0] != Number.MAX_VALUE) {
    let v = y;
    if (!v.startsWith('sxt')) {
      result.push( {node: v, weight: 0} );
    }
    let cost = 0;
    while (v != x) {
      w = prev[v][1];
      v = prev[v][0];
      // console.log(v, w)
      cost += w;
      if (!v.startsWith('sxt')) {
        result.push( {node: v, weight: cost} );
        cost = 0;
      }
    }
  }
  // console.log(result, dist[y]);
  return result;
}
