//var WebSocket = require('ws');
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

var serialport = require("serialport");
var SerialPort = serialport.SerialPort;

var serialPort = new SerialPort("/dev/cu.usbserial-cc3101B", {
//var serialPort = new SerialPort("COM4",  {
  baudrate: 115200,
//    baudrate: 9600,
    parser: serialport.parsers.readline("\n")
}, false);

io.sockets.on("connection",openSocket);

function openSocket(socket) {
  serialPort.open(function(error) {
    if ( error ) {
      console.log("no serial port");
    } else {
      socket.on("d",function(data,flag) {
        console.log("web client requested one scan");
        serialPort.write("d\n", function(err,res) {
          if (err !== undefined) {
            console.log("error on writing to serial " + err);
          }
          if (res !== undefined) {
            console.log("successfully wrote " + res + " characters");
          }
        });
      });

      socket.on("s",function(data,flag) {
        console.log("web client requested continuous scan");
        serialPort.write("s\n", function(err,res) {
          if (err !== undefined) {
            console.log("error on writing to serial " + err);
          }
          if (res !== undefined) {
            console.log("successfully wrote " + res + " characters");
          }
        });
      });

      socket.on("t",function(data,flag) {
        console.log("web client requested stop continuous scan");
        serialPort.write("t\n", function(err,res) {
          if (err !== undefined) {
            console.log("error on writing to serial " + err);
          }
          if (res !== undefined) {
            console.log("successfully wrote " + res + " characters");
          }
        });
      });

      socket.on("o",function(data,flag) {
        console.log("asking for graph of row " + data);
        serialPort.write("o," + data + "\n", function(err,res) {
          if (err !== undefined) {
            console.log("error on writing to serial " + err);
          }
          if (res !== undefined) {
            console.log("successfully wrote " + res + " characters");
          }
        });
      });

      serialPort.on("data", function(data) {
        console.log("data from board");
        console.log(data);
        socket.emit("info",data);
      });
    }
  });
};
/*
io.sockets.on("connection",openSocket);

function openSocket(socket) {
  serialPort.open(function(error) {
    if ( error ) {
      console.log("no serial port");
    } else {
      socket.on("d",function(data,flag) {
        console.log("web client requested data");
        serialPort.write("start\n", function(err,res) {
          if (err !== undefined) {
            console.log("error on writing to serial " + err);
          }
          if (res !== undefined) {
            console.log("successfully wrote " + res + " characters");
          }
        });
      });

      socket.on("s",function(data,flag) {
        console.log("web client requested continuous scan");
        serialPort.write("s\n", function(err,res) {
          if (err !== undefined) {
            console.log("error on writing to serial " + err);
          }
          if (res !== undefined) {
            console.log("successfully wrote " + res + " characters");
          }
        });

      socket.on("t",function(data,flag) {
        console.log("web client requests stop continuous scan");
        serialPort.write("t\n", function(err, res) {
          if (err !== undefined) {
            console.log("error on writing to serial " + err);
          }
          if (res !== undefined) {
            console.log("successfully wrote " + res + " characters");
          }
        })
      });

      serialPort.on("data", function(data) {
        console.log("data from board");
        console.log(data);
        socket.emit("info",data);
      });
    });
    }
  });
};
*/
