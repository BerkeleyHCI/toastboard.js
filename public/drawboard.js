// connect to the socket server
var socket = io.connect(); 

// if we get an "info" emit from the socket server then console.log the data we recive
socket.on('info', function (data) {
    console.log(data);
});

var width=500;
var height=700;

function Breadboard(railcolumn,rownum,pinnum,rowspacing,colspacing) {
  this.railcolumn = railcolumn;
  this.rownum = rownum;
  this.pinnum = pinnum;
  this.rowspacing = rowspacing;
  this.colspacing = colspacing;

  var rowPinPositionGrid = function(startX,startY) {
    var positions = [];
    for (var y=0;y<rownum;y++) {
        for(var x=0;x<pinnum;x++) {
            positions.push([x*rowspacing+startX,y*colspacing+startY]);
        }
    }
    return positions;
  };

  var railPinPositionGrid = function(startX,startY) {
    var positions = [];
    for (var x=0;x<railcolumn;x++) {
        for (var y=0;y<rownum;y++)
            positions.push([x*15+startX,y*colspacing+startY]);
    }
    return positions;
  };

    var pinPositions = railPinPositionGrid(10,20);
    pinPositions = pinPositions.concat(rowPinPositionGrid(60,20));
    pinPositions = pinPositions.concat(rowPinPositionGrid(180,20));

    this.pinPositions = pinPositions;

};

//row pins count across
Breadboard.prototype.getRowPin = function(rownumber,pinnumber) {
  return this.pinPositions[(this.railcolumn*this.rownum) + (rownumber*this.pinnum) + pinnumber];
};

//rail pins count down
Breadboard.prototype.getRailPin = function(railnumber,pinnumber) {
  return 0; //this.pinPositions[];
};

Breadboard.prototype.choosePins = function(cnxn) {
  var self = this;
  var newCnxn = [];
  var row1PinNum = 0;
  var row2PinNum = 0;
  var pin = 0, pin2 = 0;
  cnxn.forEach(function(connection) {
    // TODO: special case rail pins
    if (connection.start <= 23 && connection.end <= 23) {
      pin = row1PinNum;
      pin2 = row1PinNum;
      row1PinNum++;
    } else if (connection.start > 23 && connection.end > 23) {
      pin = row2PinNum;
      pin2 = row2PinNum;
      row2PinNum++
    } else {
      pin = 4;
      pin2 = 0;
    }
    newCnxn.push({startPin: self.getRowPin(connection.start,pin),endPin: self.getRowPin(connection.end,pin2)});
  });
  return newCnxn;
};

var chooseColor = function() {
    var colorArray = ["red","orange","yellow","green","blue","purple"];
    var colorIndex = Math.floor(Math.random() * colorArray.length);
    return colorArray[colorIndex];
};

var conflict = function(cnxn1,cnxn2) {
    return (cnxn2.start <= cnxn1.start) || (cnxn2.end >= cnxn1.end);
};

var drawBreadboard = function(cnxn) {
    var svg = d3.select("#breadboard").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    var breadboard = new Breadboard(2,24,5,20,25);
    var pinPositions = breadboard.pinPositions;
    var cnxn = [{start:0,end:2},{start:3,end:4},{start:2,end:6},{start:15,end:23},{start:30,end:32},{start:3,end:25}];
    var connections = breadboard.choosePins(cnxn);
    console.log(connections[0].startPin[0]);

    svg.selectAll("circle")
        .data(pinPositions)
        .enter()
        .append("circle")
        .attr("cx", function(d) { return d[0];} )
        .attr("cy", function(d) { return d[1];} )
        .attr("r", 2.5)
    .style("fill",function(d) { return "gray";});

    svg.selectAll("line")
        .data(connections)
        .enter()
        .append("line")
        .attr("x1",function(d) { return d.startPin[0]; })
        .attr("y1",function(d) { return d.startPin[1]; })
        .attr("x2",function(d) { return d.endPin[0]; })
        .attr("y2",function(d) { return d.endPin[1]; })
        .attr("stroke-width",3)
        .attr("stroke",function (d) { return chooseColor(); });
};

$(document).ready(function() {
  drawBreadboard([]);
});