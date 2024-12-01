var express = require("express");
var cors = require("cors");
var morgan = require("morgan");
var path = require("path");
var app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(express.json());
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

app.param('collectionName', function(req, res, next, collectionName) {
    req.collection = db.collection(collectionName);
    return next();
});

app.get('/collections/:collectionName/list', function(req, res, next) {
    req.collection.find({}).toArray(function(err, results) {
    if (err) {
        return next(err);
    }
    res.send(results);
    });
});

app.post('/collections/:collectionName/confirm', function(req, res, next) {
    req.collection.insertOne(req.body, function(err, results) {
    if (err) {
        return next(err);
    }
    res.send(results);
    });
});

app.get('/collections/:collectionName/search', function(req, res) {
    let { query } = req.query;
    query = query || ''; // Default to an empty string

    req.collection.aggregate([
        {
            $addFields: {
                priceAsString: { $toString: "$price" },
                availabilityAsString: { $toString: "$availability" }
            }
        },
        {
            $match: {
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
        res.json(results);
    });
});


app.put('/collections/:collectionName/update', function(req, res, next) {
    let productIds = req.body.cart;

    req.collection.updateMany(
        { id: { $in: productIds } }, // Match all products in the array
        { $inc: { availability: -1 } }, // Decrement `availability` by 1
        function(err, result) {
            if (err) {
                return next(err);
            }
            res.send({ message: "Products updated successfully", result });
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

app.listen(3000, function() {
 console.log("App started on port 3000");
});

