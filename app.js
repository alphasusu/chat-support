
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

var agents = {};

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function(req, res) {
    crypto.randomBytes(48, function(ex, buf) {
        var token = buf.toString('hex');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.json({room: token});
    });
});

app.post('/', function(req, res) {
    var handlers = agents[req.body.group];
    if (handlers.length == 0) {
    } else {
        var socket = handlers.shift();
        handlers.push(socket);
        console.log("Sending support request for group: " + req.body.group);
        socket.emit('request', { chat_id: req.body.id });
    }
});

app.get('/online', function(req, res) {
    res.json(Object.keys(agents));
});

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

io.sockets.on('connection', function (socket) {

    socket.on('join', function(data) {
        console.log("Socket joining room " + data.room);
        socket.room = data.room;
        socket.join(data.room);
    });

    socket.on('support', function(data) {
        if (!(data.group in agents)) {
            agents[data.group] = [];
        }
        agents[data.group].push(socket);
        console.log("Socket now supporting group: " + data.group);
    });

    socket.on('message', function(data) {
        io.sockets.in(socket.room).emit('message', data);
    });

    socket.on('disconnect', function() {
        socket.leave(socket.room);
    });

});
