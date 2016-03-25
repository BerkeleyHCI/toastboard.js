var WebSocket = require('ws');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var port = process.env.PORT || 3000;

var io = require('socket.io').listen(server);

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

var ws = new WebSocket('ws://10.0.1.15');

io.sockets.on('connection', function (socket) {
    console.log('A new user connected!');
    ws.on("open",function() {
      console.log("websocket connected");
      ws.send("start");
    });

    ws.on("message",function(data,flag) {
      console.log("got data from websocket");
  // when we get stuff from websocket, sling it over io socket to client
      socket.emit('info', data);
    });

});




