Graph = function() {

};

function drawGraph() {
  var readings = [{second:1,voltage:1.1},{second:2,voltage:1.5},{second:3,voltage:1.6},{second:4,voltage:1.7},{second:5,voltage:1.6},
                 {second:6,voltage:1.4},{second:7,voltage:1.4},{second:8,voltage:1.1}];

// note this selects svg node not div like drawboard. kind of weird
  var vis = d3.select('#graphviz'),
    WIDTH = 500,
    HEIGHT = 300,
    MARGINS = {
      top: 20,
      right: 20,
      bottom: 20,
      left: 40
    },
  xRange = d3.scale.linear().range([MARGINS.left, WIDTH - MARGINS.right]).domain([d3.min(readings, function(d) {
      return d.second;
    }), d3.max(readings, function(d) {
      return d.second;
    })]),
    yRange = d3.scale.linear().range([HEIGHT - MARGINS.top, MARGINS.bottom]).domain([d3.min(readings, function(d) {
      return d.voltage;
    }), d3.max(readings, function(d) {
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
      .tickFormat(function(d) { return d + "V";});


  vis.append('svg:g')
  .attr('class', 'x axis')
  .attr('transform', 'translate(0,' + (HEIGHT - MARGINS.bottom) + ')')
  .call(xAxis);
 
vis.append('svg:g')
  .attr('class', 'y axis')
  .attr('transform', 'translate(' + (MARGINS.left) + ',0)')
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
  .attr('d', lineFunc(readings))
  .attr('stroke', 'blue')
  .attr('stroke-width', 2)
  .attr('fill', 'none');

};

$(document).ready(function() {
  drawGraph([]);
});