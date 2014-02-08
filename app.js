
/**
 * Module dependencies.
 */

var express = require('express');
var app = express();
var routes = require('./routes');
var server = require('http').createServer(app);
var path = require('path');
var io = require('socket.io').listen(server);
var crypto = require('crypto');

// all environments
app.set('port', process.env.PORT || 4000);
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function(req, res) {
    crypto.randomBytes(48, function(ex, buf) {
        var token = buf.toString('hex');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.json({channel: token});
    });
});

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

io.sockets.on('connection', function (socket) {

    socket.on('join room', function(data) {
        console.log("Socket joining room " + data.room);
        socket.room = data.room;
        socket.join(data.room);
    });

    socket.on('message', function(data) {
        io.sockets.in(socket.room).emit('message', data);
    });

    socket.on('disconnect', function() {
        socket.leave(socket.room);
    });

});
