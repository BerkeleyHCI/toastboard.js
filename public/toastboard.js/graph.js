
Graph = function() {
  this.readings = [];
  this.voltageData = [];
  this.row;
  this.side;
};

Graph.prototype.clear = function() {
  this.readings = [];
  this.voltageData = [];
  d3.select("#graphxaxis").remove();
  d3.select("#graphyaxis").remove();
  d3.select("#graphpath").remove();
}

Graph.prototype.addData = function(reading) {
  this.readings.push(reading.data); // probably not needed
  this.voltageData.push({voltage:reading.data[0],second:reading.time[0]})
};

Graph.prototype.drawGraph = function(component_type) {
  var valuesTransform = function(voltage) {
    if (component_type == "sensor") {
      return voltage / (3.3 / 512);
    } else {
      return voltage;
    }
  };
  var units = function() {
    if (component_type == "sensor") {
      return '"';
    } else {
      return "V";
    }
  };
  var displayDigits = function() {
    if (component_type == "sensor") {
      return 0;
    } else {
      return 1;
    }
  };

  d3.select("#graphxaxis").remove();
  d3.select("#graphyaxis").remove();
  d3.select("#graphpath").remove();

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
  // put voltages on absolute 0.0 - 3.3 range for now
  /*
  yRange = d3.scale.linear().range([HEIGHT - MARGINS.top, MARGINS.bottom]).domain([d3.min(data, function(d) {
      return d.voltage;
    }), d3.max(data, function(d) {
      return d.voltage;
    })]),
    */

  yRange = d3.scale.linear().range([HEIGHT - MARGINS.top, MARGINS.bottom]).domain([valuesTransform(0.0),valuesTransform(3.3)]),
  xAxis = d3.svg.axis()
      .scale(xRange)
      .tickSize(5)
      .tickFormat(function(d) { return d + "s";}),
  yAxis = d3.svg.axis()
      .scale(yRange)
      .ticks(5)
      .tickSize(5)
      .orient('left')
      .tickFormat(function(d) { return d.toFixed(displayDigits()) + units();});


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
    return yRange(valuesTransform(d.voltage));
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

