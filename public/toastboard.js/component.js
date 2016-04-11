var leftCols = ["a","b","c","d","e"];
var rightCols = ["f","g","h","i","j"];

var defaultColor = "black";
var highlightedColor = "gold";

var ComponentHolder = function() {
  this.type = null;
  this.startRow = null;
  this.startPin = null;
  this.endRow = null;
  this.endPin = null;
  this.id = null;
  this.highlighted = null;
}

ComponentHolder.prototype.empty = function() {
  this.type = null;
  this.startRow = null;
  this.startPin = null;
  this.endRow = null;
  this.endPin = null;
  this.id = null;
  this.highlighted = null;
}

ComponentHolder.prototype.create = function(breadboard) {
  var c = makeComponent(breadboard,this.type,this.startRow,this.startPin,this.endRow,this.endPin);
  this.empty();
  return c;
}

var makeComponent = function(breadboard,component_type,startrow,startpin,endrow,endpin,highlighted) {
  if (component_type == "resistor") {
    var c = new Resistor(breadboard,startrow,startpin,endrow,endpin,highlighted);
  } else if (component_type == "diode") {
    var c = new Diode(breadboard,startrow,startpin,endrow,endpin,highlighted);
  } else if (component_type == "wire") {
    var c = new Wire(breadboard,startrow,startpin,endrow,endpin,highlighted);
  } else if (component_type == "component") {
    var c = new Component(breadboard,startrow,startpin,endrow,endpin,highlighted);
  } else if (component_type =="button") {
    var c = new Button(breadboard,startrow,startpin,endrow,endpin,highlighted);
  } else if (component_type =="LMC6482") {
    var c = new LMC6482(breadboard,startrow,startpin,endrow,endpin,highlighted);
  } else if (component_type == "pot") {
    var c = new Potentiometer(breadboard,startrow,startpin,endrow,endpin,highlighted);
  } else if (component_type == "sensor") {
    var c = new Sensor(breadboard,startrow,startpin,endrow,endpin,highlighted);
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
      var cobj = makeComponent(breadboard,c.type,c.startRow,c.startPinNum,c.endRow,c.endPinNum,c.highlighted);
      cobj.draw();
    }
  });
  boardstate.components = newcomp;
  sessionStorage.setItem("boardstate",JSON.stringify(boardstate));
};

var highlightStateComponent = function(id,state) {
  var boardstate = JSON.parse(sessionStorage.getItem("boardstate"));
  var newcomp = [];
  boardstate.components.forEach(function(d) {
    var c = JSON.parse(d);
    if (c.id == id) {
      c.highlighted = state;
    }
    newcomp.push(JSON.stringify(c));
  });
  boardstate.components = newcomp;
  sessionStorage.setItem("boardstate",JSON.stringify(boardstate));
};

var deleteAllComponents = function() {
  var boardstate = JSON.parse(sessionStorage.getItem("boardstate"));
  var newcomp = [];
  boardstate.components = newcomp;
  sessionStorage.setItem("boardstate",JSON.stringify(boardstate));
};

var getDisplayCol = function(rownum,pinnum) {
  if (pinnum == "v") {
    return "VDD";
  } else if (pinnum == "g") {
    return "GND";
  } else {
    if (rownum > 24) {
      return rightCols[pinnum];
    } else {
      return leftCols[pinnum];
    }
  }
}

var getDisplayRow = function(rownum,pinnum) {
  var returntext = "";
  if (pinnum == "v" ){
    returntext += "VDD";
  } else if (pinnum == "g"){
    returntext += "GND";
  } else{
    returntext += "row "
    if (rownum > 24) {
      returntext += (rownum - 24 + 1);
      } else {
      returntext += (rownum + 1);
      }
  }
  return returntext;
}

var Component = function(breadboard, startRow, startPinNum, endRow, endPinNum, highlighted) {
  this.breadboard = breadboard;
  this.startRow = startRow;
  this.startPinNum = startPinNum;
  this.startPin = this.breadboard.getRowPin(this.startRow,this.startPinNum);
  this.endRow = endRow;
  this.endPinNum = endPinNum;
  this.endPin = this.breadboard.getRowPin(this.endRow,this.endPinNum);
  this.failedTest = null;
  this.highlighted = highlighted;
};

Component.prototype.draw = function() {
  if (this.highlighted == "true") {
    var color = highlightedColor;
  } else {
    var color = defaultColor;
  }
  var svg = d3.select("svg");

  svg.append("line")
    .attr("x1",this.startPin[0])
    .attr("y1",this.startPin[1])
    .attr("x2",this.endPin[0])
    .attr("y2",this.endPin[1])
    .attr("stroke-width",4)
    .attr("stroke",color)
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");

  svg.append("rect")
    .attr("x",this.startPin[0] - 8)
    .attr("y",this.startPin[1] + 10)
    .attr("width",16)
    .attr("height",this.endPin[1] - this.startPin[1] - 20)
    .attr("fill",color)
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");

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
  c["highlighted"] = this.highlighted;
  return JSON.stringify(c);
}

Component.prototype.test = function(voltages) {
  return null;
}

var Wire = function(breadboard,startRow,startPinNum,endRow,endPinNum,highlighted) {
  this.breadboard = breadboard;
  this.startRow = startRow;
  this.startPinNum = startPinNum;
  this.startPin = this.breadboard.getRowPin(this.startRow,this.startPinNum);
  this.endRow = endRow;
  this.endPinNum = endPinNum;
  this.endPin = this.breadboard.getRowPin(this.endRow,this.endPinNum);
  this.failedTest = null;
  this.highlighted = highlighted;
};

Wire.prototype.draw = function() {
  var self = this;
  var alpha = 30; // amt to skew line for curve

  if (this.highlighted == "true") {
    var wirecolor = highlightedColor;
  } else {
    var wirecolor = defaultColor;
  }

  var svg = d3.select("svg");
  if (this.startPin[0] == this.endPin[0]) {
    var m_x = ((self.startPin[0] + self.endPin[0]) / 2) + alpha;
    var m_y = self.startPin[1];
  } else {
    var m_x = ((self.startPin[0] + self.endPin[0]) / 2);
    var m_y = ((self.startPin[1] + self.endPin[1]) / 2) - alpha;
  }
  var lineData = [{"x": this.startPin[0], "y": this.startPin[1]},
                  {"x": m_x, "y": m_y},
                  {"x": this.endPin[0], "y": this.endPin[1]}];
  var lineFunction = d3.svg.line()
                      .x(function(d) { return d.x; })
                      .y(function(d) { return d.y; })
                      .interpolate("bundle");

  var path = svg.append("path")
      .attr("d",lineFunction(lineData))
      .attr("stroke-width",4)
      .attr("stroke",wirecolor)
      .attr("fill","none")
      .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");

/*

  var line = svg.append("polyline")
    .attr("x1",this.startPin[0])
    .attr("y1",this.startPin[1])
    .attr("x2",this.endPin[0])
    .attr("y2",this.endPin[1])
    .attr("stroke-width",4)
    .attr("stroke","black")
    .interpolate("basis");
*/
  var msg = this.test();

  if (msg) {
   // path.append("title").text(msg);
    addWarningIconAndTooltip(svg,this.startPin[0],this.startPin[1],msg);
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
  c["highlighted"] = this.highlighted;
  return JSON.stringify(c);
}

Wire.prototype.test = function() {
  if (this.breadboard.getVoltage(this.startRow,this.startPinNum) != this.breadboard.getVoltage(this.endRow,this.endPinNum)) {
    var index = this.startRow+1;
    var index_2 = this.endRow+1;
    return "<strong>This wire may not be inserted correctly!</strong><br><i>How I know:</i> The voltage at " + getDisplayRow(this.startRow,this.startPinNum)
     + " is not the same as the voltage at " + getDisplayRow(this.endRow,this.endPinNum) }
  else if (this.breadboard.getVoltage(this.startRow,this.startPinNum) == "f" || this.breadboard.getVoltage(this.endRow,this.endPinNum) == "f"){
    return "<strong>This wire may not be inserted correctly!</strong><br><i>How I know:</i> At least one of the connections is floating"
  }
};

var Resistor = function(breadboard,startRow,startPinNum,endRow,endPinNum,highlighted) {
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
  this.resistance = null;
  this.highlighted = highlighted;
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
  if (this.highlighted == "true") {
    var color = highlightedColor;
  } else {
    var color = defaultColor;
  }
  var lineFunction = d3.svg.line()
                         .x(function(d) { return d.x; })
                         .y(function(d) { return d.y; })
                         .interpolate("linear");
  var svg = d3.select("svg");
  var path = svg.append("path")
    .attr("d", lineFunction(this.lineData))
    .attr("stroke", color)
    .attr("stroke-width", 3)
    .attr("fill", "none")
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var msg = this.test();
  if (msg) {
   // path.append("title").text(msg);
    this.failedTest = msg;
    addWarningIconAndTooltip(svg,this.startPin[0],this.startPin[1],msg);
  } else {
    addInfoIconAndTooltip(svg,this.startPin[0],this.startPin[1],this.resistance + "W");
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
  c["highlighted"] = this.highlighted;
  return JSON.stringify(c);
}

Resistor.prototype.test = function() {
  if (this.breadboard.getVoltage(this.startRow,this.startPinNum) == this.breadboard.getVoltage(this.endRow,this.endPinNum)) {
    return "<strong>There is no current through this resistor!</strong><br><i>How I know:</i> V=IR - there is currently no voltage difference between "+getDisplayRow(this.startRow,this.startPinNum)
    +" and "+getDisplayRow(this.endRow,this.endPinNum);
  } else if (this.breadboard.getVoltage(this.startRow,this.startPinNum) == "f" || this.breadboard.getVoltage(this.endRow,this.endPinNum) == "f"){
    return "<strong>This resistor may not be inserted correctly!</strong><br><i>How I know:</i> At least one of the connections is floating"; 
  }
};

var Diode = function(breadboard,startRow,startPinNum,endRow,endPinNum,highlighted) {
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
  this.highlighted = highlighted;
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
  if (this.highlighted == "true") {
    var color = highlightedColor;
  } else {
    var color = defaultColor;
  }
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
    .attr("stroke",color)
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var path = svg.append("path")
    .attr("d", lineFunction(this.triangleData))
    .attr("stroke", color)
    .attr("stroke-width", 3)
    .attr("fill", "none")
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var line2 = svg.append("line")
    .attr("x1",this.startPin[0] - (this.diodeWidth/2))
    .attr("y1",this.endPin[1] - this.verticalLineHeight)
    .attr("x2",this.startPin[0] + (this.diodeWidth/2))
    .attr("y2",this.endPin[1] - this.verticalLineHeight)
    .attr("stroke-width",3)
    .attr("stroke",color)
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var line3 = svg.append("line")
    .attr("x1",this.endPin[0])
    .attr("y1",this.endPin[1] - this.verticalLineHeight)
    .attr("x2",this.endPin[0])
    .attr("y2",this.endPin[1])
    .attr("stroke-width",3)
    .attr("stroke",color)
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var msg = this.test();
  if (msg) { /*
    line.append("title").text(msg);
    path.append("title").text(msg);
    line2.append("title").text(msg);
    line3.append("title").text(msg); */
    this.failedTest = msg;
    addWarningIconAndTooltip(svg,this.startPin[0],this.startPin[1],msg);
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
  c["highlighted"] = this.highlighted;
  return JSON.stringify(c);
}


Diode.prototype.test = function() {

   if (this.breadboard.getVoltage(this.startRow,this.startPinNum) == "f" || this.breadboard.getVoltage(this.endRow,this.endPinNum) == "f") {
    return "<strong>This LED may not be inserted correctly!</strong><br><i>How I know:</i> At least one of the connections is floating";
  } else if (Math.abs(this.breadboard.getVoltage(this.startRow,this.startPinNum) - this.breadboard.getVoltage(this.endRow,this.endPinNum)) > 2.0){
    return "<strong>This LED may be inserted backwards or broken!</strong><br><i>How I know:</i> The voltage drop across "+getDisplayRow(this.startRow,this.startPinNum)+" and "+getDisplayRow(this.endRow,this.endPinNum)
    +" is unusually large<br><i>Suggested fix:</i> Try reversing the LED; if that doesn't clear this error, get a new LED"; 
  }
}


var Potentiometer = function(breadboard,startRow,startPinNum,endRow,endPinNum,highlighted) {
  this.breadboard = breadboard;
  this.type = "pot";
  this.startRow = startRow;
  this.startPinNum = startPinNum;
  this.startPin = this.breadboard.getRowPin(this.startRow,this.startPinNum);
  this.midRow = startRow + 1;
  this.midPin = this.breadboard.getRowPin(this.midRow,startPinNum);
  this.endRow = startRow + 2;
  this.endPinNum = startPinNum;
  this.endPin = this.breadboard.getRowPin(this.endRow,this.endPinNum);
  this.highlighted = highlighted;
};

Potentiometer.prototype.draw = function() {
  if (this.highlighted == "true") {
    var color = highlightedColor;
  } else {
    var color = defaultColor;
  }

  var svg = d3.select("#board");
  var self = this;
  svg.append("rect")
    .attr("x",this.startPin[0] + 5)
    .attr("y",this.startPin[1] - 5)
    .attr("width",32)
    .attr("height",this.endPin[1] - this.startPin[1] + 10)
    .attr("stroke-width",3)
    .attr("stroke",color)
    .attr("fill","white")
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var line1 = svg.append("line")
    .attr("x1",this.startPin[0])
    .attr("y1",this.startPin[1])
    .attr("x2",this.startPin[0]+5)
    .attr("y2",this.startPin[1])
    .attr("stroke-width",3)
    .attr("stroke",color)
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var line2 = svg.append("line")
    .attr("x1",this.midPin[0])
    .attr("y1",this.midPin[1])
    .attr("x2",this.midPin[0]+5)
    .attr("y2",this.midPin[1])
    .attr("stroke-width",3)
    .attr("stroke",color)
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var line3 = svg.append("line")
    .attr("x1",this.endPin[0])
    .attr("y1",this.endPin[1])
    .attr("x2",this.endPin[0]+5)
    .attr("y2",this.endPin[1])
    .attr("stroke-width",3)
    .attr("stroke",color)
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var circle = svg.append("circle")
    .attr("cx", this.midPin[0] + 5 + 16)
    .attr("cy", this.midPin[1] -2 )
    .attr("r", 10)
    .attr("stroke",color)
    .attr("stroke-width",3)
    .attr("fill","none")
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var text = svg.append("text")
    .attr("x", this.endPin[0]+10 )
    .attr("y", this.endPin[1] +2 )
    .text( function(d) { return "POT"})                                                                                                                                                                                         
    .attr("font-family","sans-serif")
    .attr("font-size" , "8px")
    .attr("fill","black")
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");

};

Potentiometer.prototype.serialize = function() {
  var c = {};
  c["id"] = this.getId();
  c["type"] = "pot";
  c["startRow"] = this.startRow;
  c["startPinNum"] = this.startPinNum;
  c["endRow"] = this.endRow;
  c["endPinNum"] = this.endPinNum;
  c["highlighted"] = this.highlighted;
  return JSON.stringify(c);
};

Potentiometer.prototype.getId = function() {
  return "p" + this.startRow + "p" + this.startPinNum + "r" + this.endRow + "p" + this.endPinNum;
};

Potentiometer.prototype.test = function() {
  return null;
};

var Button = function(breadboard,startRow,startPinNum,endRow,endPinNum,highlighted) {
  this.breadboard = breadboard;
  this.startRow = startRow;
  this.startPinNum = startPinNum;
  this.startPin = this.breadboard.getRowPin(this.startRow,this.startPinNum);
  this.endRow = endRow;
  this.endPinNum = endPinNum;
  this.endPin = this.breadboard.getRowPin(this.endRow,this.endPinNum);
  this.buttonWidth = 20;
  this.calcPoints();
  this.failedTest = null;
  this.highlighted = highlighted;
};



Button.prototype.calcPoints = function() {
  var buttonHeight = 15;
  var fullHeight = this.endPin[1] - this.startPin[1];
  this.verticalLineHeight = (fullHeight - buttonHeight) / 2;
  this.middleSpot = fullHeight / 2;
};




Button.prototype.draw = function() {
  if (this.highlighted == "true") {
    var color = highlightedColor;
  } else {
    var color = defaultColor;
  }
  var lineFunction = d3.svg.line()
                       .x(function(d) { return d.x; })
                       .y(function(d) { return d.y; })
                       .interpolate("linear");

  var svg = d3.select("svg");

  var line1 = svg.append("line")
    .attr("x1",this.startPin[0])
    .attr("y1",this.startPin[1])
    .attr("x2",this.startPin[0])
    .attr("y2",this.startPin[1] + this.verticalLineHeight - 3)
    .attr("stroke-width",3)
    .attr("stroke",color)
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var line2 = svg.append("line")
    .attr("x1",this.endPin[0])
    .attr("y1",this.endPin[1] - this.verticalLineHeight +3)
    .attr("x2",this.endPin[0])
    .attr("y2",this.endPin[1])
    .attr("stroke-width",3)
    .attr("stroke",color)
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var circle1 = svg.append("circle")
    .attr("cx", this.startPin[0] )
    .attr("cy", this.endPin[1] - this.verticalLineHeight )
    .attr("r", 4)
    .attr("stroke",color)
    .attr("stroke-width",3)
    .attr("fill","none")
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var cicle2 = svg.append("circle")
    .attr("cx", this.endPin[0] )
    .attr("cy", this.startPin[1] + this.verticalLineHeight )
    .attr("r", 4)
    .attr("stroke",color)
    .attr("stroke-width",3)
    .attr("fill","none")
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var line3 = svg.append("line")
    .attr("x1",this.endPin[0]+8)
    .attr("y1",this.endPin[1] - this.verticalLineHeight)
    .attr("x2",this.endPin[0]+8)
    .attr("y2",this.startPin[1] + this.verticalLineHeight)
    .attr("stroke-width",3)
    .attr("stroke",color)
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var line4 = svg.append("line")
    .attr("x1",this.endPin[0]+8)
    .attr("y1",this.startPin[1]+this.middleSpot)
    .attr("x2",this.endPin[0]+14)
    .attr("y2",this.startPin[1]+this.middleSpot)
    .attr("stroke-width",3)
    .attr("stroke",color)
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var msg = this.test();
  if (msg) {
    /*
    line1.append("title").text(msg);
    line2.append("title").text(msg);
    line3.append("title").text(msg);
    line4.append("title").text(msg);
    circle1.append("title").text(msg);
    circle2.append("title").text(msg); */
    this.failedTest = msg;
    addWarningIconAndTooltip(svg,this.startPin[0],this.startPin[1],msg);
  }
};


Button.prototype.getId = function() {
  return "dr" + this.startRow + "p" + this.startPinNum + "r" + this.endRow + "p" + this.endPinNum;
}

Button.prototype.serialize = function() {
  var c = {};
  c["id"] = this.getId();
  c["type"] = "button";
  c["startRow"] = this.startRow;
  c["startPinNum"] = this.startPinNum;
  c["endRow"] = this.endRow;
  c["endPinNum"] = this.endPinNum;
  c["highlighted"] = this.highlighted;
  return JSON.stringify(c);
}


Button.prototype.test = function() {
  if (this.breadboard.getVoltage(this.startRow,this.startPinNum) == this.breadboard.getVoltage(this.endRow,this.endPinNum) ) {
    return "<strong>This button may not function correctly!</strong><br><i>How I know:</i> The voltages at "+getDisplayRow(this.startRow,this.startPinNum)+
    " and "+getDisplayRow(this.endRow,this.endPinNum)+" are already the same<br><i>Suggested fix:</i> Make sure the button is not stuck down; if it isn't, try rotating it 90 degrees";
  }
}

var LMC6482 = function(breadboard,startRow,startPinNum,endRow,endPinNum,highlighted) {
  this.breadboard = breadboard;
  this.startRow = startRow;
  this.startPinNum = 4;
  this.startPin = this.breadboard.getRowPin(this.startRow,this.startPinNum);
  this.endRow = endRow;
  this.endPinNum = endPinNum;
  this.endPin = this.breadboard.getRowPin(this.endRow,this.endPinNum);
  this.buttonWidth = 20;
  this.calcPoints();
  this.failedTest = null;
  this.highlighted = highlighted;
};



LMC6482.prototype.calcPoints = function() {
  var buttonHeight = 15;
  var fullHeight = this.endPin[1] - this.startPin[1];
  this.verticalLineHeight = (fullHeight - buttonHeight) / 2;
  this.middleSpot = fullHeight / 2;
};




LMC6482.prototype.draw = function() {
  if (this.highlighted == "true") {
    var color = highlightedColor;
  } else {
    var color = defaultColor;
  }
  var lineFunction = d3.svg.line()
                       .x(function(d) { return d.x; })
                       .y(function(d) { return d.y; })
                       .interpolate("linear");

  var svg = d3.select("svg");

  var line1 = svg.append("line")
    .attr("x1",this.startPin[0])
    .attr("y1",this.startPin[1])
    .attr("x2",this.startPin[0]+5)
    .attr("y2",this.startPin[1])
    .attr("stroke-width",3)
    .attr("stroke",color)
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var line2 = svg.append("line")
    .attr("x1",this.startPin[0])
    .attr("y1",this.startPin[1]+15)
    .attr("x2",this.startPin[0]+5)
    .attr("y2",this.startPin[1]+15)
    .attr("stroke-width",3)
    .attr("stroke",color)
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var line3 = svg.append("line")
    .attr("x1",this.startPin[0])
    .attr("y1",this.startPin[1]+30)
    .attr("x2",this.startPin[0]+5)
    .attr("y2",this.startPin[1]+30)
    .attr("stroke-width",3)
    .attr("stroke",color)
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var line4 = svg.append("line")
    .attr("x1",this.startPin[0])
    .attr("y1",this.startPin[1]+45)
    .attr("x2",this.startPin[0]+5)
    .attr("y2",this.startPin[1]+45)
    .attr("stroke-width",3)
    .attr("stroke",color)
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var line5 = svg.append("line")
    .attr("x1",this.startPin[0]+50)
    .attr("y1",this.startPin[1])
    .attr("x2",this.startPin[0]+55)
    .attr("y2",this.startPin[1])
    .attr("stroke-width",3)
    .attr("stroke",color)
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var line6 = svg.append("line")
    .attr("x1",this.startPin[0]+50)
    .attr("y1",this.startPin[1]+15)
    .attr("x2",this.startPin[0]+55)
    .attr("y2",this.startPin[1]+15)
    .attr("stroke-width",3)
    .attr("stroke",color)
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var line7 = svg.append("line")
    .attr("x1",this.startPin[0]+50)
    .attr("y1",this.startPin[1]+30)
    .attr("x2",this.startPin[0]+55)
    .attr("y2",this.startPin[1]+30)
    .attr("stroke-width",3)
    .attr("stroke",color)
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var line8 = svg.append("line")
    .attr("x1",this.startPin[0]+50)
    .attr("y1",this.startPin[1]+45)
    .attr("x2",this.startPin[0]+55)
    .attr("y2",this.startPin[1]+45)
    .attr("stroke-width",3)
    .attr("stroke",color)
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var package = svg.append("rect")
    .attr("x",this.startPin[0] + 5)
    .attr("y",this.startPin[1] - 5)
    .attr("width",45)
    .attr("height",55)
    .attr("stroke",color)
    .attr("stroke-width",2)
    .attr("fill","white")
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var circle1 = svg.append("circle")
    .attr("cx", this.startPin[0]+40 )
    .attr("cy", this.startPin[1]+1 )
    .attr("r", 4)
    .attr("stroke",color)
    .attr("stroke-width",2)
    .attr("fill","white")
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var text = svg.append("text")
    .attr("x", this.startPin[0]+10 )
    .attr("y", this.startPin[1]+45 )
    .text( function(d) { return "LMC6482"})                                                                                                                                                                                         
    .attr("font-family","sans-serif")
    .attr("font-size" , "8px")
    .attr("fill","black")
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
    
  var msg = this.test();
  if (msg) {
    this.failedTest = msg;
    addWarningIconAndTooltip(svg,this.startPin[0]+30,this.startPin[1]+25,msg);
  }
};


LMC6482.prototype.getId = function() {
  return "dr" + this.startRow;
}

LMC6482.prototype.serialize = function() {
  var c = {};
  c["id"] = this.getId();
  c["type"] = "LMC6482";
  c["startRow"] = this.startRow;
  c["startPinNum"] = this.startPinNum;
  c["endRow"] = this.endRow;
  c["endPinNum"] = this.endPinNum;
  c["highlighted"] = this.highlighted;
  return JSON.stringify(c);
}


LMC6482.prototype.test = function() {

var reasons = ""
var solutions =""
var post = 0;

  if (this.breadboard.getVoltage(this.startRow+27,this.startPinNum) == "f")  {
    reasons += "<br>-V<sub>ref</sub> (pin5) at "+getDisplayRow(this.startRow+27,this.startPinNum)+" is floating";
    solutions +="<br>-In most cases, V<sub>ref</sub> should be connected to GND";
    post = 1;
  }
  if (this.breadboard.getVoltage(this.startRow+3,this.startPinNum) == "f" || this.breadboard.getVoltage(this.startRow+3,this.startPinNum)==this.breadboard.getVoltage(this.startRow+25,this.startPinNum) ) {
    reasons +=  "<br>-The negative supply (pin4) at "+getDisplayRow(this.startRow+3,this.startPinNum)+" is floating or the same as the positive supply";
    solutions += "<br>-To get the full output voltage range, V<sub>-</sub> should be connected to GND or ideally a negative voltage"
  }

  if (post == 1){
return "<strong>This amplifier may not function correctly!</strong><br><i>How I know:</i>"+reasons+"<br><i>Suggested fix:</i>"+solutions;
}
}

var Sensor = function(breadboard,startRow,startPinNum,endRow,endPinNum,highlighted) {
  this.breadboard = breadboard;
  this.startRow = startRow;
  this.startPinNum = 4;
  this.startPin = this.breadboard.getRowPin(this.startRow,this.startPinNum);
  this.endRow = endRow;
  this.endPinNum = endPinNum;
  this.endPin = this.breadboard.getRowPin(this.endRow,this.endPinNum);
  this.buttonWidth = 20;
  this.calcPoints();
  this.failedTest = null;
  this.highlighted = highlighted;
};

Sensor.prototype.calcPoints = function() {
  var buttonHeight = 15;
  var fullHeight = this.endPin[1] - this.startPin[1];
  this.verticalLineHeight = (fullHeight - buttonHeight) / 2;
  this.middleSpot = fullHeight / 2;
};


Sensor.prototype.draw = function() {
  if (this.highlighted == "true") {
    var color = highlightedColor;
  } else {
    var color = defaultColor;
  }
  var lineFunction = d3.svg.line()
                       .x(function(d) { return d.x; })
                       .y(function(d) { return d.y; })
                       .interpolate("linear");

  var svg = d3.select("svg");

  var line1 = svg.append("line")
    .attr("x1",this.startPin[0])
    .attr("y1",this.startPin[1])
    .attr("x2",this.startPin[0]+5)
    .attr("y2",this.startPin[1])
    .attr("stroke-width",3)
    .attr("stroke",color)
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var line2 = svg.append("line")
    .attr("x1",this.startPin[0])
    .attr("y1",this.startPin[1]+15)
    .attr("x2",this.startPin[0]+5)
    .attr("y2",this.startPin[1]+15)
    .attr("stroke-width",3)
    .attr("stroke",color)
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var line3 = svg.append("line")
    .attr("x1",this.startPin[0])
    .attr("y1",this.startPin[1]+30)
    .attr("x2",this.startPin[0]+5)
    .attr("y2",this.startPin[1]+30)
    .attr("stroke-width",3)
    .attr("stroke",color)
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var line4 = svg.append("line")
    .attr("x1",this.startPin[0])
    .attr("y1",this.startPin[1]+45)
    .attr("x2",this.startPin[0]+5)
    .attr("y2",this.startPin[1]+45)
    .attr("stroke-width",3)
    .attr("stroke",color)
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var line5 = svg.append("line")
    .attr("x1",this.startPin[0])
    .attr("y1",this.startPin[1]+60)
    .attr("x2",this.startPin[0]+5)
    .attr("y2",this.startPin[1]+60)
    .attr("stroke-width",3)
    .attr("stroke",color)
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var line6 = svg.append("line")
    .attr("x1",this.startPin[0])
    .attr("y1",this.startPin[1]+75)
    .attr("x2",this.startPin[0]+5)
    .attr("y2",this.startPin[1]+75)
    .attr("stroke-width",3)
    .attr("stroke",color)
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var line7 = svg.append("line")
    .attr("x1",this.startPin[0])
    .attr("y1",this.startPin[1]+90)
    .attr("x2",this.startPin[0]+5)
    .attr("y2",this.startPin[1]+90)
    .attr("stroke-width",3)
    .attr("stroke",color)
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var package = svg.append("rect")
    .attr("x",this.startPin[0] + 5)
    .attr("y",this.startPin[1] - 5)
    .attr("width",70)
    .attr("height",100)
    .attr("stroke",color)
    .attr("stroke-width",2)
    .attr("fill","white")
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var circle1 = svg.append("circle")
    .attr("cx", this.startPin[0]+42 )
    .attr("cy", this.startPin[1]+45 )
    .attr("r", 25)
    .attr("stroke",color)
    .attr("stroke-width",2)
    .attr("fill","white")
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
  var text = svg.append("text")
    .attr("x", this.startPin[0]+30 )
    .attr("y", this.startPin[1]+54 )
    .text( function(d) { return "sensor"})                                                                                                                                                                                         
    .attr("font-family","sans-serif")
    .attr("font-size" , "8px")
    .attr("fill","black")
    .attr("onclick","highlightComponentAndRedraw('" + this.getId() + "');");
    
  var msg = this.test();
  if (msg) {
    this.failedTest = msg;
    addWarningIconAndTooltip(svg,this.startPin[0]+10,this.startPin[1]+5,msg);
  }
};

Sensor.prototype.getId = function() {
  return "s" + this.startRow;
}

Sensor.prototype.serialize = function() {
  var c = {};
  c["id"] = this.getId();
  c["type"] = "sensor";
  c["startRow"] = this.startRow;
  c["startPinNum"] = this.startPinNum;
  c["endRow"] = this.endRow;
  c["endPinNum"] = this.endPinNum;
  c["highlighted"] = this.highlighted;
  return JSON.stringify(c);
}


Sensor.prototype.test = function() {

var reasons = "";
var solutions ="";
var post = 0;

  if (this.breadboard.getVoltage(this.startRow+6,this.startPinNum) != 0.0)  {
    reasons += "<br>-GND input (pin7) at "+getDisplayRow(this.startRow+6,this.startPinNum)+" is not at ground";
    solutions +="<br>-Connect "+getDisplayRow(this.startRow+6,this.startPinNum)+" to ground";
    post = 1;
  }
  if (this.breadboard.getVoltage(this.startRow+5,this.startPinNum) < 5.0)  {
    reasons +=  "<br>-PWR input (pin6) at "+getDisplayRow(this.startRow+5,this.startPinNum)+" is less than the suggested 5V";
    solutions += "<br>-Either supply 5V to "+getDisplayRow(this.startRow+5,this.startPinNum)+" or the datasheet scale factor may be incorrect";
    post = 1;
  }

if (post==1){
return "<strong>This sensor may not function correctly!</strong><br><i>How I know:</i>"+reasons+"<br><i>Suggested fix:</i>"+solutions;
}
}

var addWarningIconAndTooltip = function(svg, x, y, message) {
  var foWidth = 275;
  var anchor = {'w': 125, 'h': 80};
  var t = 50, k = 15;
  var tip = {'w': (3/4 * t), 'h': k};
  svg.append("svg:image")
  .attr('x',x)
  .attr('y',y - 10)
  .attr('width', 24)
  .attr('height', 24)
  .attr("xlink:href","Warning-128.png")
  .on('mouseover', function() {
    var fo = svg.append('foreignObject')
        .attr({
            'x': x + 5,
            'y': y ,
            'width': foWidth,
            'class': 'svg-tooltip'
        });
    var div = fo.append('xhtml:div')
        .append('div')
        .attr({
            'class': 'c-tooltip'
        });
    div.append('p')
        .attr('class', 'c-p')
        .html(message);
    var foHeight = div[0][0].getBoundingClientRect().height;
    fo.attr({
        'height': foHeight
    });
    svg.insert('polygon', '.svg-tooltip')
        .attr({
            'points': "0,0 0," + foHeight + " " + foWidth + "," + foHeight + " " + foWidth + ",0 ",
            'height': foHeight + tip.h,
            'width': foWidth,
            'fill': '#D8D8D8', 
            'opacity': 0.85,
            'transform': 'translate(' + x + ',' + y + ')'
                  });
  }) 
  .on('mouseout', function() {
      svg.selectAll('.svg-tooltip').remove();
      svg.selectAll('polygon').remove();
  })
}

var addInfoIconAndTooltip = function(svg, x, y, message) {
  var foWidth = 275;
  var anchor = {'w': 125, 'h': 80};
  var t = 50, k = 15;
  var tip = {'w': (3/4 * t), 'h': k};
  svg.append("svg:image")
  .attr('x',x - 7)
  .attr('y',y - 15)
  .attr('width', 24)
  .attr('height', 24)
  .attr("xlink:href","info3a.png")
  .on('mouseover', function() {
    var fo = svg.append('foreignObject')
        .attr({
            'x': x + 5,
            'y': y ,
            'width': foWidth,
            'class': 'svg-tooltip'
        });
    var div = fo.append('xhtml:div')
        .append('div')
        .attr({
            'class': 'c-tooltip'
        });
    div.append('p')
        .attr('class', 'c-p')
        .html(message);
    var foHeight = div[0][0].getBoundingClientRect().height;
    fo.attr({
        'height': foHeight
    });
    svg.insert('polygon', '.svg-tooltip')
        .attr({
            'points': "0,0 0," + foHeight + " " + foWidth + "," + foHeight + " " + foWidth + ",0 ",
            'height': foHeight + tip.h,
            'width': foWidth,
            'fill': '#D8D8D8', 
            'opacity': 0.85,
            'transform': 'translate(' + x + ',' + y + ')'
                  });
  }) 
  .on('mouseout', function() {
      svg.selectAll('.svg-tooltip').remove();
      svg.selectAll('polygon').remove();
  })
}
