var connect = require('connect');
var serveStatic = require('serve-static');
var open = require('open');

open('http://localhost:8080');
connect().use(serveStatic(process.argv[2])).listen(8080);
console.log('Started local webserver at http://localhost:8080');