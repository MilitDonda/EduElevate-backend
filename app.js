var express = require("express");
var morgan = require("morgan");
var path = require("path");
var app = express();

//logger middleware
app.use(morgan("short"));

app.listen(3000, function() {
 console.log("App started on port 3000");
});

