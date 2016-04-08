var leftCols = ["a","b","c","d","e"];
var rightCols = ["f","g","h","i","j"];

var makeComponent = function(breadboard,component_type,startrow,startpin,endrow,endpin,failedTest) {
  if (component_type == "resistor") {
    var c = new Resistor(breadboard,startrow,startpin,endrow,endpin);
  } else if (component_type == "diode") {
    var c = new Diode(breadboard,startrow,startpin,endrow,endpin);
  } else if (component_type == "wire") {
    var c = new Wire(breadboard,startrow,startpin,endrow,endpin);
  } else if (component_type == "component") {
    var c = new Component(breadboard,startrow,startpin,endrow,endpin);
  }
  return c;
};

var saveComponent = function(comp) {
  var jstate = sessionStorage.getItem("boardstate");
  var state = JSON.parse(jstate);
  state.components.push(comp.serialize());
  sessionStorage.setItem("boardstate",JSON.stringify(state));
};

var makeComponentId = function(type,startrow,startpin,endrow,endpin) {
  return type[0] + "r" + startrow + "p" + startpin + "r" + endrow + "p" + endpin;
};

var redrawComponents = function(breadboard,removeId) {
  var boardstate = JSON.parse(sessionStorage.getItem("boardstate"));
  var newcomp = [];
  boardstate.components.forEach(function(d) {
    var c = JSON.parse(d);
    if (c.id != removeId) {
      newcomp.push(d);
      var cobj = makeComponent(breadboard,c.type,c.startRow,c.startPinNum,c.endRow,c.endPinNum);
      cobj.draw();
    }
  });
  boardstate.components = newcomp;
  sessionStorage.setItem("boardstate",JSON.stringify(boardstate));
};

var testComponents = function(breadboard) {
  var boardstate = JSON.parse(sessionStorage.getItem("boardstate"));
  var failedTests = [];
  boardstate.components.forEach(function(d) {
    var c = JSON.parse(d);
    var cobj = makeComponent(breadboard,c.type,c.startRow,c.startPinNum,c.endRow,c.endPinNum);
    var msg = cobj.test(breadboard.rawVoltages);
    if (msg) failedTests.push(msg)
    cobj["failedTest"] = true;
  });
  return failedTests;
}

var getDisplayRow = function(rownum,pinnum) {
  var returntext = "";
  if (rownum > 24) {
    returntext += (rownum + 24 + 1);
    returntext += rightCols[pinnum];
  } else {
    returntext += (rownum + 1);
    returntext += leftCols[pinnum];
  }
  return returntext;
}

var Component = function(breadboard, startRow, startPinNum, endRow, endPinNum) {
  this.breadboard = breadboard;
  this.startRow = startRow;
  this.startPinNum = startPinNum;
  this.startPin = this.breadboard.getRowPin(this.startRow,this.startPinNum);
  this.endRow = endRow;
  this.endPinNum = endPinNum;
  this.endPin = this.breadboard.getRowPin(this.endRow,this.endPinNum);
  this.failedTest = null;
};

Component.prototype.draw = function() {
  var svg = d3.select("svg");

  svg.append("line")
    .attr("x1",this.startPin[0])
    .attr("y1",this.startPin[1])
    .attr("x2",this.endPin[0])
    .attr("y2",this.endPin[1])
    .attr("stroke-width",4)
    .attr("stroke","black");

  svg.append("rect")
    .attr("x",this.startPin[0] - 8)
    .attr("y",this.startPin[1] + 10)
    .attr("width",16)
    .attr("height",this.endPin[1] - this.startPin[1] - 20)
    .attr("fill","black");

};

Component.prototype.getId = function() {
  return "cr" + this.startRow + "p" + this.startPinNum + "r" + this.endRow + "p" + this.endPinNum;
}

Component.prototype.serialize = function() {
  var c = {};
  c["id"] = this.getId();
  c["type"] = "component";
  c["startRow"] = this.startRow;
  c["startPinNum"] = this.startPinNum;
  c["endRow"] = this.endRow;
  c["endPinNum"] = this.endPinNum;
  return JSON.stringify(c);
}

Component.prototype.test = function(voltages) {
  return null;
}

var Wire = function(breadboard,startRow,startPinNum,endRow,endPinNum) {
  this.breadboard = breadboard;
  this.startRow = startRow;
  this.startPinNum = startPinNum;
  this.startPin = this.breadboard.getRowPin(this.startRow,this.startPinNum);
  this.endRow = endRow;
  this.endPinNum = endPinNum;
  this.endPin = this.breadboard.getRowPin(this.endRow,this.endPinNum);
  this.failedTest = null;
};

Wire.prototype.draw = function() {
  var svg = d3.select("svg");

  var line = svg.append("line")
    .attr("x1",this.startPin[0])
    .attr("y1",this.startPin[1])
    .attr("x2",this.endPin[0])
    .attr("y2",this.endPin[1])
    .attr("stroke-width",4)
    .attr("stroke","black")

  var msg = this.test();
  console.log("check text");
  console.log(msg);
  if (msg) {
    line.append("title").text(msg);
    this.failedTest = msg;
  }

};

Wire.prototype.getId = function() {
  return "wr" + this.startRow + "p" + this.startPinNum + "r" + this.endRow + "p" + this.endPinNum;
}

Wire.prototype.serialize = function() {
  var c = {};
  c["id"] = this.getId();
  c["type"] = "wire";
  c["startRow"] = this.startRow;
  c["startPinNum"] = this.startPinNum;
  c["endRow"] = this.endRow;
  c["endPinNum"] = this.endPinNum;
  return JSON.stringify(c);
}

Wire.prototype.test = function(voltages) {
  if (voltages[this.startRow] != voltages[this.endRow]) {
    return "The voltage at pin " + getDisplayRow(this.startRow,this.startPinNum)
     + " is not the same as the voltage at pin " + getDisplayRow(this.endRow,this.endPinNum)
      + ". Check this wire for faulty connections."; 
  }
};

var Resistor = function(breadboard,startRow,startPinNum,endRow,endPinNum) {
  this.breadboard = breadboard;
  this.startRow = startRow;
  this.startPinNum = startPinNum;
  this.startPin = this.breadboard.getRowPin(this.startRow,this.startPinNum);
  this.endRow = endRow;
  this.endPinNum = endPinNum;
  this.endPin = this.breadboard.getRowPin(this.endRow,this.endPinNum);
  this.lineData = null;
  this.lineFunction = null;
  this.calcLineData();
  this.failedTest = null;
}

Resistor.prototype.calcLineData = function() {
  var width = 10;
  var spacing = 5;
  var heightOfZigZag = spacing*6;
  var lineData = [];
  var startPin = this.breadboard.getRowPin(this.startRow,this.startPinNum);
  var endPin = this.breadboard.getRowPin(this.endRow,this.endPinNum);
  var margin = ((endPin[1] - startPin[1]) - heightOfZigZag) / 2;
  var x = startPin[0];
  var y = startPin[1];
  lineData.push({x:x,y:y});
  // straight margin segment
  y = y + margin;
  lineData.push({x:x,y:y});
  // half angled segment
  x = x + (width/2);
  y = y + (spacing/2);
  lineData.push({x:x,y:y});
  // five full angled segment
  x = x - width;
  y = y + spacing;
  lineData.push({x:x,y:y});
  x = x + width;
  y = y + spacing;
  lineData.push({x:x,y:y});
  x = x - width;
  y = y + spacing;
  lineData.push({x:x,y:y});
  x = x + width;
  y = y + spacing;
  lineData.push({x:x,y:y});
  x = x - width;
  y = y + spacing;
  lineData.push({x:x,y:y});
  // half angled segment
  x = x + (width/2);
  y = y + spacing/2;
  lineData.push({x:x,y:y});
  // end point!
  lineData.push({x:endPin[0],y:endPin[1]});
  this.lineData = lineData;
  this.lineFunction = d3.svg.line()
                         .x(function(d) { return d.x; })
                         .y(function(d) { return d.y; })
                         .interpolate("linear");
                         console.log(lineData);
};

Resistor.prototype.draw = function() {
  var lineFunction = d3.svg.line()
                         .x(function(d) { return d.x; })
                         .y(function(d) { return d.y; })
                         .interpolate("linear");
  var svg = d3.select("svg");
  var path = svg.append("path")
    .attr("d", lineFunction(this.lineData))
    .attr("stroke", "black")
    .attr("stroke-width", 3)
    .attr("fill", "none");
  var msg = this.test();
  if (msg) {
    path.append("title").text(msg);
    this.failedTest = msg;
  }
};

Resistor.prototype.getId = function() {
  return "rr" + this.startRow + "p" + this.startPinNum + "r" + this.endRow + "p" + this.endPinNum;
}

Resistor.prototype.serialize = function() {
  var c = {};
  c["id"] = this.getId();
  c["type"] = "resistor";
  c["startRow"] = this.startRow;
  c["startPinNum"] = this.startPinNum;
  c["endRow"] = this.endRow;
  c["endPinNum"] = this.endPinNum;
  return JSON.stringify(c);
}

Resistor.prototype.test = function(voltages) {
  if (voltages[this.startRow] == voltages[this.endRow]) {
    return "There is no current through the resistor connected to pin " + getDisplayRow(this.startRow,this.startPinNum) +
      " and " + getDisplayRow(this.endRow,this.endPinNum) + ".";
  }
};

var Diode = function(breadboard,startRow,startPinNum,endRow,endPinNum) {
  this.breadboard = breadboard;
  this.startRow = startRow;
  this.startPinNum = startPinNum;
  this.startPin = this.breadboard.getRowPin(this.startRow,this.startPinNum);
  this.endRow = endRow;
  this.endPinNum = endPinNum;
  this.endPin = this.breadboard.getRowPin(this.endRow,this.endPinNum);
  this.diodeWidth = 20;
  this.calcPoints();
  this.failedTest = null;
};

Diode.prototype.calcPoints = function() {
  var triangleHeight = 15;
  var fullHeight = this.endPin[1] - this.startPin[1];
  this.verticalLineHeight = (fullHeight - triangleHeight) / 2;
  this.triangleData = [{x:this.startPin[0],y:this.endPin[1]-this.verticalLineHeight},
                      {x:this.startPin[0]-10,y:this.endPin[1]-this.verticalLineHeight-triangleHeight},
                      {x:this.startPin[0]+10,y:this.endPin[1]-this.verticalLineHeight-triangleHeight},
                      {x:this.startPin[0],y:this.endPin[1]-this.verticalLineHeight}];
  console.log(this.triangleData);
};

Diode.prototype.draw = function() {
  var lineFunction = d3.svg.line()
                       .x(function(d) { return d.x; })
                       .y(function(d) { return d.y; })
                       .interpolate("linear");

  var svg = d3.select("svg");
  var line = svg.append("line")
    .attr("x1",this.startPin[0])
    .attr("y1",this.startPin[1])
    .attr("x2",this.startPin[0])
    .attr("y2",this.startPin[1] + this.verticalLineHeight)
    .attr("stroke-width",3)
    .attr("stroke","black");
  var path = svg.append("path")
    .attr("d", lineFunction(this.triangleData))
    .attr("stroke", "black")
    .attr("stroke-width", 3)
    .attr("fill", "none");
  var line2 = svg.append("line")
    .attr("x1",this.startPin[0] - (this.diodeWidth/2))
    .attr("y1",this.endPin[1] - this.verticalLineHeight)
    .attr("x2",this.startPin[0] + (this.diodeWidth/2))
    .attr("y2",this.endPin[1] - this.verticalLineHeight)
    .attr("stroke-width",3)
    .attr("stroke","black");
  var line3 = svg.append("line")
    .attr("x1",this.endPin[0])
    .attr("y1",this.endPin[1] - this.verticalLineHeight)
    .attr("x2",this.endPin[0])
    .attr("y2",this.endPin[1])
    .attr("stroke-width",3)
    .attr("stroke","black");
  var msg = this.test();
  if (msg) {
    line.append("title").text(msg);
    path.append("title").text(msg);
    line2.append("title").text(msg);
    line3.append("title").text(msg);
    this.failedTest = msg;
  }
};

Diode.prototype.getId = function() {
  return "dr" + this.startRow + "p" + this.startPinNum + "r" + this.endRow + "p" + this.endPinNum;
}

Diode.prototype.serialize = function() {
  var c = {};
  c["id"] = this.getId();
  c["type"] = "diode";
  c["startRow"] = this.startRow;
  c["startPinNum"] = this.startPinNum;
  c["endRow"] = this.endRow;
  c["endPinNum"] = this.endPinNum;
  return JSON.stringify(c);
}


Diode.prototype.test = function(voltages) {
//  if (voltages[this.startRow] == "f" || voltages[this.endRow] == "f" ||
//      Math.abs(voltages[this.startRow] - voltages[this.endRow]) > 2.0) {
    return "The LED between pin " + getDisplayRow(this.startRow,this.startPinNum) + " and pin " + getDisplayRow(this.endRow,this.endPinNum) +
        " is not connected properly. Check that the pins are connected, that the LED is in the right direction, or that the LED itself is not faulty.";
 // }
}

var Sensor = function(breadboard,startRow) {
  this.breadboard = breadboard;
  this.startRow = startRow;
  this.pins = [];
    this.squareData = null;
  var self = this;
  for (var i=0;i<7;i++) {
    self.pins.push(breadboard.getRowPin(startRow+i,3))
  };
  this.calcPoints();

};

Sensor.prototype.calcPoints = function() {
  var squareData = [{x:this.pins[0][0]-10,y:this.pins[0][1]-10},
                    {x:this.pins[0][0]-100,y:this.pins[0][1]-10},
                    {x:this.pins[0][0]-100,y:this.pins[0][1]+100},
                    {x:this.pins[0][0]-10,y:this.pins[0][1]+100},
                    {x:this.pins[0][0]-10,y:this.pins[0][1]-10}];
  console.log(squareData);
  this.squareData = squareData;
};

Sensor.prototype.draw = function() {
  var lineFunction = d3.svg.line()
                     .x(function(d) { return d.x; })
                     .y(function(d) { return d.y; })
                     .interpolate("linear");
  console.log("sensor is drawing");
  var svg = d3.select("#board");
  var self = this;
  for (var i=0;i<7;i++) {
    svg.append("line")
      .attr("x1",self.pins[i][0]-10)
      .attr("y1",self.pins[i][1])
      .attr("x2",self.pins[i][0])
      .attr("y2",self.pins[i][1])
      .attr("stroke-width",3)
      .attr("stroke","black");
  }
    svg.append("path")
    .attr("d", lineFunction(this.squareData))
    .attr("stroke", "black")
    .attr("stroke-width", 3)
    .attr("fill", "white");

  svg.append("circle")
  .attr("cx", this.pins[0][0]-55 )
  .attr("cy", this.pins[0][1]+45 )
  .attr("r", 30)
  .attr("stroke","black")
  .attr("stroke-width",3)
  .attr("fill","none");

};