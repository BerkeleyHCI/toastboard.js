var Component = function(breadboard, wirenum, startRow, startPinNum, endRow, endPinNum) {
  this.breadboard = breadboard;
  this.wirenum = wirenum;
  this.startRow = startRow;
  this.startPinNum = startPinNum;
  this.startPin = this.breadboard.getRowPin(this.startRow,this.startPinNum);
  this.endRow = endRow;
  this.endPinNum = endPinNum;
  this.endPin = this.breadboard.getRowPin(this.endRow,this.endPinNum);
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
// should subclass these in OOP-ish style, but whatever....
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
  svg.append("path")
    .attr("d", lineFunction(this.lineData))
    .attr("stroke", "black")
    .attr("stroke-width", 3)
    .attr("fill", "none");
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
  svg.append("line")
    .attr("x1",this.startPin[0])
    .attr("y1",this.startPin[1])
    .attr("x2",this.startPin[0])
    .attr("y2",this.startPin[1] + this.verticalLineHeight)
    .attr("stroke-width",3)
    .attr("stroke","black");
  svg.append("path")
    .attr("d", lineFunction(this.triangleData))
    .attr("stroke", "black")
    .attr("stroke-width", 3)
    .attr("fill", "none");
  svg.append("line")
    .attr("x1",this.startPin[0] - (this.diodeWidth/2))
    .attr("y1",this.endPin[1] - this.verticalLineHeight)
    .attr("x2",this.startPin[0] + (this.diodeWidth/2))
    .attr("y2",this.endPin[1] - this.verticalLineHeight)
    .attr("stroke-width",3)
    .attr("stroke","black");
  svg.append("line")
    .attr("x1",this.endPin[0])
    .attr("y1",this.endPin[1] - this.verticalLineHeight)
    .attr("x2",this.endPin[0])
    .attr("y2",this.endPin[1])
    .attr("stroke-width",3)
    .attr("stroke","black");
};

var Sensor = function(breadboard,startRow) {
  this.breadboard = breadboard;
  this.startRow = startRow;
  this.pins = [];
    this.squareData = null;
  var self = this;
  for (var i=0;i<7;i++) {
    self.pins.push(breadboard.getRowPin(startRow+i,4))
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