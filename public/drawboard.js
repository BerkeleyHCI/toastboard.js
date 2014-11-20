$(function() {

var width = 460,
    height = 300,
    rowspacing = 20,
    colspacing = 25,
    rownum = 8,
    pinnum = 5;

var publicPinPositionGrid = function() {
    var positions = [];
    for (var y=0;y<rownum;y++) {
        for(var x=0;x<pinnum;x++) {
            positions.push([x*rowspacing+20,y*colspacing+20]);
        }
    }
    return positions;
};

var chooseColor = function() {
    var colorArray = ["red","orange","yellow","green","blue","purple"];
    var colorIndex = Math.floor(Math.random() * colorArray.length);
    return colorArray[colorIndex];
};

var conflict = function(cnxn1,cnxn2) {
    return (cnxn2.start <= cnxn1.start) || (cnxn2.end >= cnxn1.end);
};

var processConnections = function(connectionsArray) {
    var newConnections = [];
    var colNum = 0;
    connectionsArray.forEach(function(cnxn) {
        newConnections.push({start:cnxn.start,end:cnxn.end,col:colNum});
        colNum = (colNum + 1) % pinnum;
    });
    return newConnections;
};

var drawBreadboard = function(cnxn) {
    var svg = d3.select("#breadboard").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");
    
    var pinPositions = publicPinPositionGrid();
    var connections = [{start:0,end:2},{start:3,end:4},{start:2,end:6}];
    connections = processConnections(cnxn);
    
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
        .attr("x1",function(d) { return pinPositions[d.start*5 + d.col][0]; })
        .attr("y1",function(d) { return pinPositions[d.start*5 + d.col][1]; })
        .attr("x2",function(d) { return pinPositions[d.end*5 + d.col][0]; })
        .attr("y2",function(d) { return pinPositions[d.end*5 + d.col][1]; })
        .attr("stroke-width",3)
        .attr("stroke",function (d) { return chooseColor(); });
};

// ws.on('open', function() {
//   console.log("connection is open");
// });

ws.on('message',function(data,flag) {
  console.log("we got a message");
  var j = JSON.parse(data);
  console.log(j);
  if (!(j.cnxn == undefined)) {
    drawBreadboard(j.cnxn);
  }
});

  $(document).ready(function() {
    console.log("okay set stuff up")
   // init();
  });

});
