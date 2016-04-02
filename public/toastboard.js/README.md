# toastboard.js

d3 is required -- be sure and include the d3 file to any web page that uses toastboard diagrams.

To use the breadboard diagram:
+ To get a breadboard object: `var b = new Breadboard();`
+ To draw the breadboard diagram without any information on it: `b.drawEmptyBreadboard()`
+ To draw the breadboard diagram with data: right now, we need to read in two pieces of JSON, the left and the right side. THIS WILL PROBABLY CHANGE SOON. ```  b.drawBreadboard(JSON.parse(fakeLeft));
  b.drawBreadboard(JSON.parse(fakeRight));```