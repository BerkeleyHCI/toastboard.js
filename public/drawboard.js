// connect to the socket server
var socket = io.connect(); 

// if we get an "info" emit from the socket server then console.log the data we recive
socket.on('info', function (data) {
    console.log(data);
});

// TODO how to handle floating voltages? only display selected row?
// TODO move power rail from left to right
// TODO draw connections from power rail to rows
// TODO make highlighting colors unique to each voltage level
// TODO associate highlighting colors with wire colors
// TODO layout and style
// TODO draw oscillo graph
// TODO save status (to local storage????)

var width=500;
var height=600;

function Breadboard(railcolumn,rownum,pinnum,rowspacing,colspacing) {
  this.railcolumn = railcolumn;
  this.rownum = rownum;
  this.pinnum = pinnum;
  this.rowspacing = rowspacing;
  this.colspacing = colspacing;
  this.voltageColors = {"0": "gray","3.3":"red"};

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
    // TODO: special case rail to row connections
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

Breadboard.prototype.getRectAttr = function(firstPin,lastPin) {
  var padding = 8;
  var x = firstPin[0] - padding;
  var y = firstPin[1] - padding;
  var width = (lastPin[0] - firstPin[0]) + (padding*2);
  var height = (lastPin[1] - firstPin[1]) + (padding*2);
  return {x: x, y: y, height: height, width: width};
}

Breadboard.prototype.getRailRect = function(railIndex) {
  // rails are only 0 or 1
  var firstPin = this.pinPositions[railIndex*this.rownum];
  var lastPin = this.pinPositions[railIndex*this.rownum + (this.rownum - 1)];
  return this.getRectAttr(firstPin,lastPin);
};

Breadboard.prototype.getRowRect = function(rowIndex) {
  // rows are numbered 0 through 47
  var firstPin = this.pinPositions[(this.rownum*this.railcolumn) + (rowIndex*this.pinnum)];
  var lastPin = this.pinPositions[(this.rownum*this.railcolumn) + (rowIndex*this.pinnum) + (this.pinnum - 1)];
  return this.getRectAttr(firstPin,lastPin);
};

Breadboard.prototype.processVoltages = function(voltages) {
  var self = this;
  var processedVoltages = [];
  voltages.forEach(function(voltage) {
    var newVoltage = {};
    if (voltage.r == 0 || voltage.r == 1) {
      newVoltage = self.getRailRect(voltage.r);
    } else {
      newVoltage = self.getRowRect(voltage.r - 2);
    }
    newVoltage.r = voltage.r; // retain original info
    newVoltage.v = voltage.v;
    newVoltage.color = self.chooseVoltageColor(voltage);
    processedVoltages.push(newVoltage);
  });
  return processedVoltages;
}

Breadboard.prototype.chooseVoltageColor = function(voltage) {
  var voltageString = voltage.v.toString();
  if (voltageString in this.voltageColors) {
    return this.voltageColors[voltageString];
  } else {
    var color = chooseColor(); // ideally this would be unique though
    this.voltageColors[voltageString] = color;
    return color;
  }
}

var chooseColor = function() {
    var colorArray = ["orange","yellow","green","blue","purple"];
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

    var breadboard = new Breadboard(2,24,5,20,15);
    var pinPositions = breadboard.pinPositions;

    var voltages = [{r:0,v:3.3},{r:1,v:0.0},{r:32,v:1.1},{r:34,v:1.1},{r:2,v:3.3},{r:4,v:3.3},{r:8,v:3.3},{r:17,v:0.0},{r:25,v:0.0}];
    var voltages_attr = breadboard.processVoltages(voltages);
    var cnxn = [{start:0,end:2},{start:3,end:4},{start:2,end:6},{start:15,end:23},{start:30,end:32},{start:3,end:25}];
    var connections = breadboard.choosePins(cnxn);

    svg.selectAll("rect")
      .data(voltages_attr)
      .enter()
      .append("rect")
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; })
      .attr("height", function(d) { return d.height; })
      .attr("width", function(d) { return d.width; })
      .attr("rx", 5)
      .attr("ry",5)
      .attr("fill", function(d) { return d.color})
      .attr("fill-opacity", 0.5)
      .append("title").text(function(d) { return d.v.toString() + "V" });

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