/* jshint quotmark: single */

var http = require('http');
var compiler = require('./compiler.js');

var port = process.env.PORT || 1337;

http.createServer(function(req, res) {
	res.writeHead(200, { 'Content-Type': 'text/html' });	
    res.end('Running');
}).listen(port);