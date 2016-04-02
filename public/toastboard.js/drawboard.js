var width=450;
var height=600;
var railcolumn = 2;
var rownum = 24;
var pinnum = 5;
var rowspacing = 20;
var colspacing = 15;

var vdd = 3.3;
var vddColor = "red";
var groundColor = "gray";

function Breadboard() {
  this.rowData = {};
  this.receivedLeft = false;
  this.receivedRight = false;
  this.drawCallback = null; // what is this callback thing for?

  this.voltageAttr = null;
  this.connections = null;
  this.labels = null;

  var railPinPositionGrid = function(startX,startY) {
    var positions = [];
    for (var x=0;x<railcolumn;x++) {
      for (var y=0;y<rownum;y++)
        positions.push([x*15+startX,y*colspacing+startY]);
      }
    return positions;
  };

  var rowPinPositionGrid = function(startX,startY) {
  var positions = [];
  for (var y=0;y<rownum;y++) {
    for(var x=0;x<pinnum;x++) {
      positions.push([x*rowspacing+startX,y*colspacing+startY]);
    }
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
  }
  if (json.rowsRight) {
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

Breadboard.prototype.drawEmptyBreadboard = function() {
  var self = this;
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

  var numbers = numbering(self);

  svg.selectAll(".numbers")
    .data(numbers)
    .enter()
    .append("text")
    .attr("x",function(d) { return d.x; })
    .attr("y",function(d) { return d.y; })
    .attr("dy",".30em")
    .attr("font-size","0.7em")
    .text(function(d) { return d.label; });

  return svg;
};

Breadboard.prototype.drawBreadboard = function(json) {
  console.log("called into drawBreadboard");
  var self = this;
  var hasData = this.processJson(json);

  if (hasData) {
    // we've received both sides & can redraw
    console.log(this.rowData);
    var hash = hashVoltages(this.rowData);
    console.log(hash);
    this.voltageAttr = hashToVoltageAttr(hash,self);
    this.connections = hashToCnxn(hash,self);
    this.labels = hashToLabels(this.rowData,self);

    var svg = this.drawEmptyBreadboard();

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
      .text("VDD: " + vdd.toFixed(1) + "V");

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

    if (this.drawCallback) {
      this.drawCallback();
    }
  } else {
    console.log("no real data");
  }

};

//row pins count across
Breadboard.prototype.getRowPin = function(rownumber,pinnumber) {
  return this.pinPositions[(railcolumn*rownum) + (rownumber*pinnum) + pinnumber];
};

var hashVoltages = function(rowVals) {
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

var hashToCnxn = function(hash,breadboard) {
  var cnxn = [];
  Object.keys(hash).forEach(function(hashKey) {
    var connected_rows = hash[hashKey];
    var top_row = connected_rows[0];
    connected_rows.slice(1).forEach(function(row) {
      cnxn.push({start:top_row,end:row});
    });
  });
  return choosePins(cnxn,breadboard);
};

var choosePins = function(cnxn,breadboard) {
  var colorArray = ["orange","yellow","green","blue","purple","brown","blueviolet","cornflowerblue","crimson",
"forestgreen","deeppink","indigo","lightseagreen","mediumorchid","orangered","yellowgreen","gold","teal",
"firebrick","midnightblue"];
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
    newCnxn.push({startPin: breadboard.getRowPin(connection.start,pin),endPin: breadboard.getRowPin(connection.end,pin2),color:color});
  });
  return newCnxn;
};

var getTimeStampString = function() {
  var now = new Date();
  var date = [ now.getMonth() + 1, now.getDate(), now.getFullYear() ];
  var time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];
  return date.join("/") + " " + time.join(":")
};

var getRowTextCoord = function(rownumber,breadboard) {
  if (rownumber<24) {
    pins = breadboard.pinPositions[(railcolumn*rownum) + (rownumber*pinnum)];
    return {x:pins[0] - 45,y:pins[1]};
  } else {
    pins = breadboard.pinPositions[(railcolumn*rownum) + (rownumber*pinnum) + 4];
    return {x:pins[0] + 15,y:pins[1]};
  }
}

var getInnerRowTextCoord = function(rownumber,breadboard) {
  if (rownumber<24) {
    pins = breadboard.pinPositions[(railcolumn*rownum) + (rownumber*pinnum) + 4];
    return {x:pins[0] + 10,y:pins[1]};
  } else {
    pins = breadboard.pinPositions[(railcolumn*rownum) + (rownumber*pinnum)];
    return {x:pins[0] - 20,y:pins[1]};
  }
};

var getRectAttr = function(firstPin,lastPin) {
  var padding = 8;
  var x = firstPin[0] - padding;
  var y = firstPin[1] - padding;
  var width = (lastPin[0] - firstPin[0]) + (padding*2);
  var height = (lastPin[1] - firstPin[1]) + (padding*2);
  return {x: x, y: y, height: height, width: width};
};

var getRailRect = function(railIndex,breadboard) {
  // rails are only 0 or 1
  var firstPin = breadboard.pinPositions[railIndex*rownum];
  var lastPin = breadboard.pinPositions[railIndex*rownum + (rownum - 1)];
  return getRectAttr(firstPin,lastPin);
};

var getRowRect = function(rowIndex,breadboard) {
  // rows are numbered 0 through 47
  var firstPin = breadboard.pinPositions[(rownum*railcolumn) + (rowIndex*pinnum)];
  var lastPin = breadboard.pinPositions[(rownum*railcolumn) + (rowIndex*pinnum) + (pinnum - 1)];
  return getRectAttr(firstPin,lastPin);
};

var hashToVoltageAttr = function(hash,breadboard) {
  var colorArray = ["orange","yellow","green","blue","purple","brown","blueviolet","cornflowerblue","crimson",
"forestgreen","deeppink","indigo","lightseagreen","mediumorchid","orangered","yellowgreen","gold","teal",
"firebrick","midnightblue"];
  //var self = this;
  var voltageAttr = [];
  Object.keys(hash).forEach(function(hashKey) {
    var color;
    if (hashKey == 0) {
      color = groundColor;
    } else if (hashKey == vdd) {
      color = vddColor;
    } else {
      var colorIndex = Math.floor(Math.random() * colorArray.length);
      color = colorArray[colorIndex];
      colorArray.splice(colorIndex,1);
    }
    hash[hashKey].forEach(function(row) {
      var newVoltage = getRowRect(row,breadboard);
      newVoltage.r = row;
      newVoltage.v = hashKey;
      newVoltage.color = color
      voltageAttr.push(newVoltage);
    });
  });

  // manually add power and ground rails
  pwrVoltage = getRailRect(0,breadboard);
  pwrVoltage.r = 0;
  pwrVoltage.v = 3.3;
  pwrVoltage.color = vddColor;
  voltageAttr.push(pwrVoltage);

  grdVoltage = getRailRect(1,breadboard);
  grdVoltage.r = 1;
  grdVoltage.v = 0;
  grdVoltage.color = groundColor;
  voltageAttr.push(grdVoltage);
  return voltageAttr;
};

var numbering = function(breadboard) {
  var self = this;
  var numbering = [];
  for (var i=1;i<49;i++) {
    var entry = getInnerRowTextCoord(i-1,breadboard);
    if (i > 24){
     row_ind=i-24;
    }
    entry.label = i.toString();
    numbering.push(entry);
  };
  return numbering;
};

var hashToLabels = function(hash,breadboard) {
  var self = this;
  var labels = [];
  hash.forEach(function(row) {
    var key = Object.keys(row)[0];
    var entry =  getRowTextCoord(key,breadboard)
    entry.label = row[key].toFixed(1) + "V";
    labels.push(entry);
  });
  return labels;
};

// why is this here
var conflict = function(cnxn1,cnxn2) {
    return (cnxn2.start <= cnxn1.start) || (cnxn2.end >= cnxn1.end);
};

// this is not needed either?
var getRailPin = function(railnumber,pinnumber) {
  return 0; //this.pinPositions[];
};