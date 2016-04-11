var width=450;
var height=600;
var railcolumn = 2;
var rownum = 24;
var pinnum = 5;
var rowspacing = 20;
var colspacing = 15;

var vdd = 3.3;
var vddColor = "#e31a1c";
var groundColor = "gray";

function Breadboard() {
  this.rowData = {};
  this.receivedLeft = false;
  this.receivedRight = false;
  this.drawCallback = null; // what is this callback thing for?

  this.rawVoltages = [];
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
        var v = thresholdVoltage(json.rowsLeft[i]);
        newRow[index] = v;
        this.rawVoltages[i] = v;
        this.rowData.push(newRow);
      } else {
        this.rawVoltages[i] = json.rowsLeft[i];
      }
    }
  }
  if (json.rowsRight) {
    this.receivedRight = true;
    for (i=0;i<24;i++) {
      if (json.rowsRight[i] != "f") {
        var newRow = {};
        var int_index = i + 24;
        var index = "" + int_index; // again WAT
        var v = thresholdVoltage(json.rowsRight[i]);
        this.rawVoltages[int_index] = v;
        newRow[index] = v;
        this.rowData.push(newRow);      
      } else {
        this.rawVoltages[i+24] = json.rowsRight[i];
      }
    }
  }
  return true;
};

var thresholdVoltage = function(voltage) {
  if (voltage < 0.100) {
    return 0.0;
  } else if (voltage > 3.0) {
    return 3.3;
  } else {
    return voltage;
  }
};

Breadboard.prototype.attachPinClickEvents = function(pintype) {
  if (pintype == "start") {
    var methodName = "setStartPin";
  } else if (pintype == "end") {
    var methodName = "setEndPin";
  }
  console.log("attaching pin events");
  d3.select("#board").selectAll("pinclick")
  .data(this.pinPositions)
  .enter()
  .append("rect")
  .attr("x",function(d) { return d[0] - 5; })
  .attr("y",function(d) { return d[1] - 5; })
  .attr("width",10)
  .attr("height",10)
  .attr("class","pinclick")
  .attr("onclick",function(d,i) { return methodName + "(" + i + ");"});
}

var isPinLegal = function(i) {
  var randp = getRowAndPinFromPinIndex(i);
  if (holder.type != null) {
    if (holder.startRow != null) {
      // choose pins that are legal given type and start row/pin
      if (holder.type == "wire") {
        if ((holder.startPin == "v" || holder.startPin == "g") && (randp[1] == "v" || randp[1] == "g")) {
          return false;
        } else {
          return true;
        }
      } else if (holder.type == "diode" || holder.type == "resistor" || holder.type == "button") {

        if (holder.startPin == randp[1] && ((holder.startRow < 24) == (randp[0] < 24))) {
          return true;
        } else {
          return false;
        }
      }
    } else {
      // choose pins that are legal given type
      if (holder.type == "ina128") {
        if (randp[0] < 21 && randp[1] == 4) {
          return true;
        } else {
          return false;
        }
      } else if (holder.type == "diode" || holder.type == "resistor" || holder.type == "button") {
        if (randp[1] == "v" || randp[1] == "g") {
          return false;
        } else {
          return true;
        }
      } else {
        return true;
      }
    }
  } else {
    // not in the midst of placing a component
    // don't highlight any pin
    return false;
  }
}

var isSamePin = function(i) {
  var randp = getRowAndPinFromPinIndex(i);
  return (holder.startRow == randp[0] && holder.startPin == randp[1]);
};

Breadboard.prototype.drawEmptyBreadboard = function() {
  console.log(holder);
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
  .style("fill",function(d,i) 
    { if (isSamePin(i)) { return "red"; } else { if (isPinLegal(i)) { return "blue"; } else { return "gray"; }}});

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

  var lettering = col_letters(self);

  svg.selectAll(".col_letters")
    .data(lettering)
    .enter()
    .append("text")
    .attr("x",function(d) { return d.x; })
    .attr("y",function(d) { return d.y; })
    .attr("dy",".30em")
    .attr("font-size","0.7em")
    .text(function(d) { return d.label; });

  return svg;
};

Breadboard.prototype.redrawBoard = function(svg) {
  // this.labels and this.voltageAttr are fully populated
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

    // we used to automatically draw wires
    /*
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
    */
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
    this.redrawBoard(svg);

  } else {
    console.log("no real data");
  }

};

//row pins count across
Breadboard.prototype.getRowPin = function(rownumber,pinnumber) {
  if (pinnumber == "g") {
    return this.pinPositions[rownumber + 24];
  } else if (pinnumber == "v") {
    return this.pinPositions[rownumber];
  } else {
    return this.pinPositions[(railcolumn*rownum) + (rownumber*pinnum) + pinnumber];
  }
};

Breadboard.prototype.getVoltage = function(rownumber,pinnumber) {
  if (pinnumber == "v") {
    return 3.3;
  } else if (pinnumber == "g") {
    return 0.0;
  } else {
    return this.rawVoltages[rownumber];
  }
}

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

var getRowAndPinFromPinIndex = function(pinIndex) {
  if (pinIndex < 24) {
    return [pinIndex,"g"];
  } else if (pinIndex < 48) {
    return [pinIndex - 24, "v"];
  } else {
    var row = Math.floor( (pinIndex - (rownum*railcolumn)) / pinnum);
    var pin = (pinIndex - rownum*railcolumn) % pinnum;
    return [row,pin];
  }
}

var getVoltageColor = function(voltage) {
  var color;
  if (voltage >= 3.1) {
    color = vddColor;
  } else if (voltage >= 2.5) {
   // color = "firebrick";
    color = "#fc4e2a";
  } else if (voltage >= 2.0) {
    //color = "orangered";
    color = "#fd8d3c";
  } else if (voltage >= 1.5) {
    //color = "gold";
    color = "#feb24c";
  } else if (voltage >= 1.0) {
    //color = "forestgreen";
    color = "#fed976";
  } else if (voltage >= 0.5) {
    //color = "teal";
    color = "#ffeda0";
  } else if (voltage >= 0.1) {
    //color = "purple";
    color = "#ffffcc";
  } else {
    color = "gray";
  }
  return color;
}

var hashToVoltageAttr = function(hash,breadboard) {

  //var self = this;
  var voltageAttr = [];
  Object.keys(hash).forEach(function(hashKey) {
    /*
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
    */
    hash[hashKey].forEach(function(row) {
      var newVoltage = getRowRect(row,breadboard);
      newVoltage.r = row;
      newVoltage.v = hashKey;
      newVoltage.color = getVoltageColor(hashKey);
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
  var numbering = [];
  var row_ind;
  for (var i=1;i<49;i++) {
    var entry = getInnerRowTextCoord(i-1,breadboard);
    if (i > 24){
     row_ind=i-24;
    } else {
      row_ind = i;
    }
    entry.label = row_ind.toString();
    numbering.push(entry);
  };
  return numbering;
};

var col_letters = function(breadboard) {
  var lettering = [];
  var labels = ["a","b","c","d","e","f","g","h","i","j"];
  for (var i=0;i<10;i++) {
    if (i>4) {
      var pin = breadboard.pinPositions[i + 48 + rownum*pinnum - 5];
    } else {
      var pin = breadboard.pinPositions[i + 48];
    }
    var entry = {x:pin[0] - 3,y:pin[1] - 15};
    entry.label = labels[i];
    lettering.push(entry);
  }
  return lettering;
}

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
