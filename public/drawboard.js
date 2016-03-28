// // connect to the socket server
// var socket = io.connect(); 

// // if we get an "info" emit from the socket server then console.log the data we receive
// socket.on('info', function (data) {
//   console.log("got data from websocket");
//   var json = JSON.parse(data);
//   drawBreadboard(json);
// });

// TODO draw connections from power rail to rows (?)
// TODO associate highlighting colors with wire colors
// TODO draw oscillo graph
// TODO save status (to local storage????)
// TODO bend wire drawings to see if they read better?
// TODO if we don't really use jquery for anything, rip it out
// TODO put indicator by selected row

// all 0-47 either have real data or f

var width=450;
var height=600;


function Breadboard(railcolumn,rownum,pinnum,rowspacing,colspacing) {
  this.rowData = {};
  this.receivedLeft = false;
  this.receivedRight = false;
  this.drawCallback = null;
  this.railcolumn = railcolumn;
  this.rownum = rownum;
  this.pinnum = pinnum;
  this.rowspacing = rowspacing;
  this.colspacing = colspacing;
  this.groundColor = "gray";
  this.vddColor = "red";
  this.selectedRow = null;
  this.vdd = null;
  this.voltageAttr = null;
  this.connections = null;
  this.labels = null;
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

    var pinPositions = railPinPositionGrid(320,20);
    pinPositions = pinPositions.concat(rowPinPositionGrid(45,20));
    pinPositions = pinPositions.concat(rowPinPositionGrid(180,20));

    this.pinPositions = pinPositions;

};

Breadboard.prototype.processJson = function(json) {
  if (json.rowsLeft) {
    this.receivedLeft = true;
    // reset data
    this.rowData = [];
    for (i=0;i<24;i++) {
      if (json.rowsLeft[i] != "f") {
        var newRow = {};
        var index = "" + i; // WAT
        newRow[index] = json.rowsLeft[i];
        this.rowData.push(newRow);
      }
    }
    console.log("handled left side");
    console.log(this.rowData);
  } else if (json.rowsRight) {
    this.receivedRight = true;
    for (i=0;i<24;i++) {
      if (json.rowsRight[i] != "f") {
        var newRow = {};
        var int_index = i + 24;
        var index = "" + int_index; // again WAT
        newRow[index] = json.rowsRight[i];
        this.rowData.push(newRow);      
      }
    }
    // hardcode these 2 values for now
    this.selectedRow = 0;
    this.vdd = 3.3;
    console.log(this.rowData);
    var hash = this.hashVoltages(this.rowData);
    console.log(hash);
    this.voltageAttr = this.hashToVoltageAttr(hash);
    this.connections = this.hashToCnxn(hash);
    this.labels = this.hashToLabels(this.rowData);
  }
  // make sure we have both sides
  if (this.receivedLeft && this.receivedRight) {
    this.receivedLeft = false;
    this.receivedRight = false;
    return true;
  } else {
    return false;
  }
};

Breadboard.prototype.hashVoltages = function(rowVals) {
    var hash = {}
    rowVals.forEach(function(row) {
      var key = Object.keys(row)[0];
      var val = row[key];
      if (key != "f") { // remove floating rows
        if (hash.hasOwnProperty(val)) {
          hash[val].push(key);
        } else {
          hash[val] = [key];
        }
      }
    });
    return hash;
  };

Breadboard.prototype.hashToCnxn = function(hash) {
  var self = this;
  var cnxn = [];
  Object.keys(hash).forEach(function(hashKey) {
    var connected_rows = hash[hashKey];
    var top_row = connected_rows[0];
    connected_rows.slice(1).forEach(function(row) {
      cnxn.push({start:top_row,end:row});
    });
  });
  return this.choosePins(cnxn);
};

Breadboard.prototype.hashToLabels = function(hash) {
  var self = this;
  var labels = [];
  console.log("checking labels problem");
  console.log(hash);
  hash.forEach(function(row) {
    var key = Object.keys(row)[0];
    var entry =  self.getRowTextCoord(key)
    entry.label = row[key].toFixed(1) + "V";
    labels.push(entry);
  });
  return labels;
};

Breadboard.prototype.numbering = function() {
  var self = this;
  var numbering = [];
  for (var i=1;i<49;i++) {
    var entry = self.getInnerRowTextCoord(i-1);
    if (i > 24){
     row_ind=i-24;
    }
    entry.label = i.toString();
    numbering.push(entry);
  };
  return numbering;
};

Breadboard.prototype.hashToVoltageAttr = function(hash) {
  var colorArray = ["orange","yellow","green","blue","purple","brown","blueviolet","cornflowerblue","crimson",
"forestgreen","deeppink","indigo","lightseagreen","mediumorchid","orangered","yellowgreen","gold","teal",
"firebrick","midnightblue"];
  var self = this;
  var voltageAttr = [];
  Object.keys(hash).forEach(function(hashKey) {
    var color;
    if (hashKey == 0) {
      color = self.groundColor;
    } else if (hashKey == self.vdd) {
      color = self.vddColor;
    } else {
      var colorIndex = Math.floor(Math.random() * colorArray.length);
      color = colorArray[colorIndex];
      colorArray.splice(colorIndex,1);
    }
    hash[hashKey].forEach(function(row) {
      var newVoltage = self.getRowRect(row);
      newVoltage.r = row;
      newVoltage.v = hashKey;
      newVoltage.color = color
      voltageAttr.push(newVoltage);
    });
  });
      // manually add power and ground rails
  if (this.vdd) { // check that power is not floating
    pwrVoltage = self.getRailRect(0);
    pwrVoltage.r = 0;
    pwrVoltage.v = 3.3;
    pwrVoltage.color = self.vddColor;
    voltageAttr.push(pwrVoltage);
  }
  // can't tell if ground is connected, so always display
  grdVoltage = self.getRailRect(1);
  grdVoltage.r = 1;
  grdVoltage.v = 0;
  grdVoltage.color = self.groundColor;
  voltageAttr.push(grdVoltage);
  return voltageAttr;
};


//row pins count across
Breadboard.prototype.getRowPin = function(rownumber,pinnumber) {
  return this.pinPositions[(this.railcolumn*this.rownum) + (rownumber*this.pinnum) + pinnumber];
};

Breadboard.prototype.getRowTextCoord = function(rownumber) {
  if (rownumber<24) {
    pins = this.pinPositions[(this.railcolumn*this.rownum) + (rownumber*this.pinnum)];
    return {x:pins[0] - 45,y:pins[1]};
  } else {
    pins = this.pinPositions[(this.railcolumn*this.rownum) + (rownumber*this.pinnum) + 4];
    return {x:pins[0] + 15,y:pins[1]};
  }
}

Breadboard.prototype.getInnerRowTextCoord = function(rownumber) {
  if (rownumber<24) {
    pins = this.pinPositions[(this.railcolumn*this.rownum) + (rownumber*this.pinnum) + 4];
    return {x:pins[0] + 10,y:pins[1]};
  } else {
    pins = this.pinPositions[(this.railcolumn*this.rownum) + (rownumber*this.pinnum)];
    return {x:pins[0] - 20,y:pins[1]};
  }
}

//rail pins count down
Breadboard.prototype.getRailPin = function(railnumber,pinnumber) {
  return 0; //this.pinPositions[];
};

Breadboard.prototype.choosePins = function(cnxn) {
  var colorArray = ["orange","yellow","green","blue","purple","brown","blueviolet","cornflowerblue","crimson",
"forestgreen","deeppink","indigo","lightseagreen","mediumorchid","orangered","yellowgreen","gold","teal",
"firebrick","midnightblue"];
  var self = this;
  var newCnxn = [];
  var row1PinNum = 0;
  var row2PinNum = 0;
  var pin = 0, pin2 = 0;
  var color = null;
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
    var colorIndex = Math.floor(Math.random() * colorArray.length);
    color = colorArray[colorIndex];
    colorArray.splice(colorIndex,1);
    newCnxn.push({startPin: self.getRowPin(connection.start,pin),endPin: self.getRowPin(connection.end,pin2),color:color});
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

var conflict = function(cnxn1,cnxn2) {
    return (cnxn2.start <= cnxn1.start) || (cnxn2.end >= cnxn1.end);
};

var getTimeStampString = function() {
  var now = new Date();
  var date = [ now.getMonth() + 1, now.getDate(), now.getFullYear() ];
  var time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];
  return date.join("/") + " " + time.join(":")
};

Breadboard.prototype.drawEmptyBreadboard = function() {
  d3.select("#board")
    .remove();

  var svg = d3.select("#breadboard").append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("id","board")
  .append("g");

  svg.selectAll("circle")
  .data(this.pinPositions)
  .enter()
  .append("circle")
  .attr("cx", function(d) { return d[0];} )
  .attr("cy", function(d) { return d[1];} )
  .attr("r", 2.5)
  .style("fill",function(d) { return "gray";});

    var numbers = this.numbering();
  console.log(numbers);
  svg.selectAll(".numbers")
    .data(numbers)
    .enter()
    .append("text")
    .attr("x",function(d) { return d.x; })
    .attr("y",function(d) { return d.y; })
    .attr("dy",".30em")
    .attr("font-size","0.7em")
    .text(function(d) { return d.label; });
};

Breadboard.prototype.drawBreadboard = function(json) {
  console.log("called into drawBreadboard");
  var hasData = this.processJson(json);

  if (hasData) {
    // we've received both sides & can redraw

  // always refresh pin positions
  d3.select("#board")
    .remove();

  var svg = d3.select("#breadboard").append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("id","board")
  .append("g");

  svg.selectAll("circle")
  .data(this.pinPositions)
  .enter()
  .append("circle")
  .attr("cx", function(d) { return d[0];} )
  .attr("cy", function(d) { return d[1];} )
  .attr("r", 2.5)
  .style("fill",function(d) { return "gray";});

  var numbers = this.numbering();
  console.log(numbers);
  svg.selectAll(".numbers")
    .data(numbers)
    .enter()
    .append("text")
    .attr("x",function(d) { return d.x; })
    .attr("y",function(d) { return d.y; })
    .attr("dy",".30em")
    .attr("font-size","0.7em")
    .text(function(d) { return d.label; });

    var timestring = getTimeStampString();
    $("#timestamp").html("<p><i>last synched " + timestring + "</i></p>");

    svg.selectAll(".label")
      .data(this.labels)
      .enter()
      .append("text")
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; })
      .attr("dy", ".30em")
      .text(function(d) { return d.label; });

    svg.append("text")
      .attr("x",280)
      .attr("y",390)
      .attr("dy",".30em")
      .text("VDD: " + this.vdd.toFixed(1) + "V");

    svg.selectAll("rect")
      .data(this.voltageAttr)
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

    svg.selectAll("line")
        .data(this.connections)
        .enter()
        .append("line")
        .attr("x1",function(d) { return d.startPin[0]; })
        .attr("y1",function(d) { return d.startPin[1]; })
        .attr("x2",function(d) { return d.endPin[0]; })
        .attr("y2",function(d) { return d.endPin[1]; })
        .attr("stroke-width",3)
        .attr("stroke",function (d) { return d.color; });

    $("#selected-row").html("<p>Selected Row: " + json.selected);
    if (this.drawCallback) {
      this.drawCallback();
    }
  } else {
    console.log("no real data");
  }

};

