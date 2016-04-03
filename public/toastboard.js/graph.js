Graph = function() {
  this.readings = [];
  this.voltageData = [];
  this.row;
  this.side;
};

Graph.prototype.clear = function() {
  this.readings = [];
  this.voltageData = [];
}

Graph.prototype.addData = function(data) {
  var self = this;
  console.log(this.readings);
  data.forEach(function(d) {
    self.readings.push(d);
  });
};

Graph.prototype.processReadings = function() {
  var self = this;
  this.readings.forEach(function(voltage,i) {
    self.voltageData.push({voltage:voltage,second:i*0.004}); // remember that we need to match this to reality
  });
};

Graph.prototype.drawGraph = function() {

//  d3.select("#graphviz").remove();
  d3.select("#graphxaxis").remove();
  d3.select("#graphyaxis").remove();
  d3.select("#graphpath").remove();
  // var readings = [{second:1,voltage:1.1},{second:2,voltage:1.5},{second:3,voltage:1.6},{second:4,voltage:1.7},{second:5,voltage:1.6},
  //                {second:6,voltage:1.4},{second:7,voltage:1.4},{second:8,voltage:1.1}];

  this.processReadings();

  var data = this.voltageData;

  if (data.length > 4) {
    // wait til we have enough to look at

// note this selects svg node not div like drawboard. kind of weird
  var vis = d3.select('#graphviz'),
    WIDTH = 480,
    HEIGHT = 300,
    MARGINS = {
      top: 20,
      right: 40,
      bottom: 20,
      left: 40
    },
  xRange = d3.scale.linear().range([MARGINS.left, WIDTH - MARGINS.right]).domain([d3.min(data, function(d) {
      return d.second;
    }), d3.max(data, function(d) {
      return d.second;
    })]),
    yRange = d3.scale.linear().range([HEIGHT - MARGINS.top, MARGINS.bottom]).domain([d3.min(data, function(d) {
      return d.voltage;
    }), d3.max(data, function(d) {
      return d.voltage;
    })]),
    xAxis = d3.svg.axis()
      .scale(xRange)
      .tickSize(5)
      .tickFormat(function(d) { return d + "s";}),
    yAxis = d3.svg.axis()
      .scale(yRange)
      .ticks(5)
      .tickSize(5)
      .orient('left')
      .tickFormat(function(d) { return d.toFixed(3) + "V";});


  vis.append('svg:g')
  .attr('class', 'x axis')
  .attr('transform', 'translate(0,' + (HEIGHT - MARGINS.bottom) + ')')
  .attr("id","graphxaxis")
  .call(xAxis);
 
vis.append('svg:g')
  .attr('class', 'y axis')
  .attr('transform', 'translate(' + (MARGINS.left) + ',0)')
  .attr("id","graphyaxis")
  .call(yAxis);


var lineFunc = d3.svg.line()
  .x(function(d) {
    return xRange(d.second);
  })
  .y(function(d) {
    return yRange(d.voltage);
  })
  .interpolate('linear');

  vis.append('svg:path')
  .attr("id","graphpath")
  .attr('d', lineFunc(data))
  .attr('stroke', 'blue')
  .attr('stroke-width', 2)
  .attr('fill', 'none');

} else {
  console.log("not enough to graph yet");
}

};

