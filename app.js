var express = require("express");
var cors = require("cors");
var morgan = require("morgan");
var path = require("path");
var app = express();

app.use(cors());

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

