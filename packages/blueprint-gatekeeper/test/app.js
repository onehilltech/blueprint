var express      = require ('express'),
    bodyParser   = require ('body-parser'),
    mongoose     = require ('mongoose'),
    passport     = require ('passport'),
    morgan       = require ('morgan'),
    config       = require ('./app-config');

var app = express ();

// Connect to the database. The database configuration comes from a 
// configuration file. Setup the callback for different events on the 
// connection.
var connect = function () {
  mongoose.connect (config.connstr, config.mongodb);
}

connect ();

mongoose.connection.on ('error', function (err) {
  console.log (err);
});

// Create the application, and set the default configuration.
var app = express ();
app.use (morgan (config.morgan));
app.use (bodyParser (config.bodyParser));
app.use (passport.initialize ());

module.exports = exports = app;
