var express = require("express");
var cors = require("cors");
var morgan = require("morgan");
var path = require("path");
var app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());

let propertiesReader = require("properties-reader");
let propertiesPath = path.resolve(__dirname, "conf/db.properties");
let properties = propertiesReader(propertiesPath);

let dbPprefix = properties.get("db.prefix");
let dbUsername = encodeURIComponent(properties.get("db.user"));
let dbPwd = encodeURIComponent(properties.get("db.pwd"));
let dbName = properties.get("db.dbName");
let dbUrl = properties.get("db.dbUrl");
let dbParams = properties.get("db.params");

const uri = dbPprefix + dbUsername + ":" + dbPwd + dbUrl + dbParams;

const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
let db = client.db(dbName);

//logger middleware
app.use(morgan("short"));

//static file middleware
var staticPath = path.join(__dirname, "static");
app.use(express.static(staticPath));

//error handler
app.use(function(req, res) {
    res.status(404);
    res.send("Resource not found!");
});

app.listen(3000, function() {
 console.log("App started on port 3000");
});

