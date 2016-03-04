d3.selection.prototype.first = function () { return d3.select(this[0][0]); };
d3.selection.prototype.last = function () {
    var last = this.size() - 1;
    return d3.select(this[0][last]);
};

// Add a truncate function to the string object
String.prototype.trunc = function(n){
    return this.substr(0, n - 1) + (this.length > n ? '&hellip;' : '');
};

var width = 960,
    height = 700,
    radius = Math.min(width, height) / 2,
    color = d3.scale.category20c();
var transitioning;

var svg = d3.select("#partition_chart").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height * .52 + ")");

var x = d3.scale.linear()
    .domain([0, width])
    .range([0, width]);

var y = d3.scale.linear()
    .domain([0, height])
    .range([0, height]);

var partition = d3.layout.partition()
    .children(function (d, depth) { return depth ? null : d._values; })
    .value(function (d) { return d.projected_cost; })
    .sort(function (a, b) { return a.projected_cost - b.projected_cost; })
    .ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
    .round(false);

var arc = d3.svg.arc()
    .startAngle(function(d) { return d.x; })
    .endAngle(function(d) { return d.x + d.dx; })
    .innerRadius(function(d) { return Math.sqrt(d.y); })
    .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });

d3.json("data/flare.json", function(error, root) {
  if (error) throw error;

  var path = svg.datum(root).selectAll("path")
      .data(partition.nodes)
    .enter().append("path")
      .attr("display", function(d) { return d.depth ? null : "none"; }) // hide inner ring
      .attr("d", arc)
      .style("stroke", "#fff")
      .style("fill", function(d) { return color((d.children ? d : d.parent).name); })
      .style("fill-rule", "evenodd")
      .each(stash);

  d3.selectAll("input").on("change", function change() {
    var value = this.value === "count"
        ? function() { return 1; }
        : function(d) { return d.size; };

    path
        .data(partition.value(value).nodes)
      .transition()
        .duration(1500)
        .attrTween("d", arcTween);
  });
});

// Stash the old values for transition.
function stash(d) {
  d.x0 = d.x;
  d.dx0 = d.dx;
}

// Interpolate the arcs in data space.
function arcTween(a) {
  var i = d3.interpolate({x: a.x0, dx: a.dx0}, a);
  return function(t) {
    var b = i(t);
    a.x0 = b.x;
    a.dx0 = b.dx;
    return arc(b);
  };
}

d3.select(self.frameElement).style("height", height + "px");
