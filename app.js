var express = require("express");
var cors = require("cors");
var morgan = require("morgan");
var path = require("path");
var app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

//Middleware to parse JSON request bodies
app.use(express.json());
//Enable CORS for cross origin requests
app.use(cors());

//Import properties reader to read configuration
let propertiesReader = require("properties-reader");
let propertiesPath = path.resolve(__dirname, "conf/db.properties");
let properties = propertiesReader(propertiesPath);

//Database connection string construction from properties
let dbPprefix = properties.get("db.prefix");
let dbUsername = encodeURIComponent(properties.get("db.user"));
let dbPwd = encodeURIComponent(properties.get("db.pwd"));
let dbName = properties.get("db.dbName");
let dbUrl = properties.get("db.dbUrl");
let dbParams = properties.get("db.params");


//MongoDB connection URI
const uri = dbPprefix + dbUsername + ":" + dbPwd + dbUrl + dbParams;

//MongoDB client initialization
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
let db = client.db(dbName);

//Middleware to handle dynamic collection name
app.param('collectionName', function(req, res, next, collectionName) {
    req.collection = db.collection(collectionName);
    return next();
});

//Endpoint to list all documents in a collection
app.get('/collections/:collectionName/list', function(req, res, next) {
    req.collection.find({}).toArray(function(err, results) {
    if (err) {
        return next(err); //Pass error to next middleware
    }
    res.send(results); //Send the document as a response
    });
});

//Endpoint to insert a document into a collection
app.post('/collections/:collectionName/confirm', function(req, res, next) {
    req.collection.insertOne(req.body, function(err, results) {
    if (err) {
        return next(err); //Pass error to next middleware
    }
    res.send(results); //Send the insertion result as a response
    });
});

//Search endpoint with dynamic query matching multiple fields
app.get('/collections/:collectionName/search', function(req, res) {
    let { query } = req.query;
    query = query || '';  //Default empty query

    req.collection.aggregate([
        {
            //Convert 'price' and 'availability' fields to string for regex matching
            $addFields: {
                priceAsString: { $toString: "$price" },
                availabilityAsString: { $toString: "$availability" }
            }
        },
        {
            $match: {
                //Match query against multiple fields using case-insensitive regex
                $or: [
                    { subject: { $regex: query, $options: "i" } },
                    { location: { $regex: query, $options: "i" } },
                    { priceAsString: { $regex: query, $options: "i" } },
                    { availabilityAsString: { $regex: query, $options: "i" } }
                ]
            }
        }
    ]).toArray(function(err, results) {
        if (err) {
            console.error("Error in search:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        res.json(results); //Send matching documents as a response
    });
});

//Update endpoit  to decrement product availability for items bought
app.put('/collections/:collectionName/update', function(req, res, next) {
    let productIds = req.body.cart; //array of product IDs from the cart 

    req.collection.updateMany(
        { id: { $in: productIds } }, // Match all products in the array
        { $inc: { availability: -1 } }, // Decrement `availability` by 1
        function(err, result) {
            if (err) {
                return next(err); //Pass error to next middleware
            }
            res.send({ message: "Products updated successfully", result }); //Send success response
        }
    );
});

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

//start the server on port 3000
app.listen(3000, function() {
 console.log("App started on port 3000");
});

