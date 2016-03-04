// set the margin of the chart
var margin = {top: 20, right: 0, bottom: 0, left: 0},
    width = 960,
    height = 500 - margin.top - margin.bottom,
    formatDollars = d3.format('$,.2f'),
    formatVarianceDollars = d3.format('+$,.2f'),
    transitioning;

// set the x,y linear scale
var x = d3.scale.linear()
    .domain([0, width])
    .range([0, width]);

var y = d3.scale.linear()
    .domain([0, height])
    .range([0, height]);

//create the tooltip 
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// create the layout of tree map
var treemap = d3.layout.treemap()
    .children(function(d, depth) { return depth ? null : d._values })
    .value(function(d) { return d.projected_cost })
    .sort(function(a, b) { return a.projected_cost - b.projected_cost })
    .ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
    .round(false);

//create the SVG of tree map and append on the HTML page
var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("margin-left", -margin.left + "px")
    .style("margin-right", -margin.right + "px")
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .style("shape-rendering", "crispEdges")
// set hte mousemove function about tooltip
    .on("mousemove", function() {
        var coords = d3.mouse(this);
        var xflip = coords[0] + 235 > width;
        var yflip = coords[1] + 135 > height;
        tooltip.style("top", yflip ? "auto" : (coords[1] + 130) + "px")
            .style("bottom", yflip ? (height - coords[1] + 130) + "px" : "auto")
            .style("left", xflip ? "auto" : (coords[0] + 20) + "px")
            .style("right", xflip ? (width - coords[0] + 20) + "px" : "auto");
    });

//Create the grandparent for Navigation Bar
var grandparent = svg.append("g")
    .attr("class", "grandparent");

//Append the "rect" and "text" from two display function
grandparent.append("rect")
    .attr("y", -margin.top)
    .attr("width", width)
    .attr("height", margin.top);

grandparent.append("text")
    .attr("x", 6)
    .attr("y", 6 - margin.top)
    .attr("dy", ".75em");

d3.csv("data/Projects_Data.csv", function(data) {
    var root = {key: "All Departments"}
    root.values = d3.nest()
        .key(function(d) { return d["Agency Name"] })
        .key(function(d) { return d["Investment Title"] })
        .rollup(function(leaves) {
            var agency = leaves[0]["Agency Name"],
                agency_code = leaves[0]["Agency Code"],
                investment = leaves[0]["Investment Title"],
                investment_id = leaves[0]["Unique Investment Identifier"];

            var projects = [];

            for (var i = 0; i < leaves.length; i++) {
                d = leaves[i];

                projects.push({
                    agency: agency,
                    agency_code: agency_code,
                    investment: investment,
                    investment_id: investment_id,
                    id: d["Project ID"],
                    key: d["Project Name"],
                    description: d["Project Description"],
                    lifecycle_cost: +d["Lifecycle Cost  ($ M)"],
                    planned_cost: +d["Planned Cost ($ M)"],
                    projected_cost: +d["Projected/Actual Cost ($ M)"],
                    cost_variance: +d["Cost Variance ($ M)"]
                });
            }

            return projects;
        })
        .entries(data);

    initialize(root);
    accumulateProjCost(root);
    accumulateCostVar(root);
    accumulatePlanCost(root);
    layout(root);
    display(root);

    function initialize(root) {
        root.x = root.y = 0;
        root.dx = width;
        root.dy = height;
        root.depth = 0;
    }

    function accumulateProjCost(d) {
        return (d._values = d.values)
            ? d.projected_cost = d.values.reduce(function(p, v) { return p + accumulateProjCost(v); }, 0)
            : d.projected_cost;
    }

    function accumulateCostVar(d) {
        return (d._values = d.values)
            ? d.cost_variance = d.values.reduce(function(p, v) { return p + accumulateCostVar(v); }, 0)
            : d.cost_variance;
    }

    function accumulatePlanCost(d) {
        return (d._values = d.values)
            ? d.planned_cost = d.values.reduce(function(p, v) { return p + accumulatePlanCost(v); }, 0)
            : d.planned_cost;
    }

    function layout(d) {
        if (d._values) {
            treemap.nodes({_values: d._values});
            d._values.forEach(function(c) {
                c.x = d.x + c.x * d.dx;
                c.y = d.y + c.y * d.dy;
                c.dx *= d.dx;
                c.dy *= d.dy;
                c.parent = d;
                layout(c);
            });
        }
    }

    function display(d) {
        var varianceColourRange = d3.scale.linear()
            .domain([d3.min(d._values, function(c) { return c.cost_variance; }), 0, d3.max(d._values, function(c) { return c.cost_variance; })])
            .interpolate(d3.interpolateRgb)
            .range(["#DA4453", "#CCD1D9", "#8CC152"]);

        grandparent
            .datum(d.parent)
            .on("click", transition)
            .select("text")
            .text(name(d));

        // Title / navigation bar
        var g1 = svg.insert("g", ".grandparent")
            .datum(d)
            .attr("class", "depth");

        // Each of the main rectangles
        var g = g1.selectAll("g")
            .data(d._values)
          .enter().append("g");


        g.filter(function(d) { return d._values; })
            .classed("children", true)
            .on("click", transition);

        // Each of the sub-rectangles
        g.selectAll(".child")
            .data(function(d) { return d._values || [d]; })
          .enter().append("rect")
            .attr("class", "child")
            .call(rect);

        // The main rectangles
        g.append("rect")
            .attr("class", "parent")
            .call(rect)
            .style("fill", function(d) {
                return varianceColourRange(d3.round(d.cost_variance, 2));
            })
            .on("mouseover", function(d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .95);

                var html = "<h4>" + d.key + "</h4>";
                html += "<table><tr>";
                if (d.planned_cost) {
                    html += "<td class='key'>Planned Cost</td><td class='value'>" + formatDollars(d.planned_cost) + "M</td>";
                    html += "</tr><tr>";
                }
                html += "<td class='key'>Projected/Actual Cost</td><td class='value'>" + formatDollars(d.projected_cost) + "M</td>";
                if (d.cost_variance) {
                    var style = "color: " + varianceColourRange(d3.round(d.cost_variance, 2)) + ";";
                    html += "</tr><tr>";
                    html += "<td class='key'>Cost Variance</td>";
                    html += "<td class='value' style='" + style + "'>" + formatVarianceDollars(d.cost_variance) + "M</td>";
                }
                html += "</tr></table>";

                tooltip.html(html);
            })
            .on("mouseout", function(d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0);
            });

        // The label on each main rectangle
        g.append("foreignObject")
            .call(rect)
            .attr("class", "foreignobj")
          .append("xhtml:div")
            .attr("dy", ".75em")
            .html(function(d) { return d.key; } )
            .attr("class", "textdiv");

        // Function to transition (zoom) into child rectangle
        function transition(d) {
            if (transitioning || !d) return;
            transitioning = true;

            var g2 = display(d),
                t1 = g1.transition().duration(750),
                t2 = g2.transition().duration(750);

            x.domain([d.x, d.x + d.dx]);
            y.domain([d.y, d.y + d.dy]);

            // Enable anti-aliasing during the transition.
            svg.style("shape-rendering", null);

            // Draw child nodes on top of parent nodes.
            svg.selectAll(".depth").sort(function(a, b) { return a.depth - b.depth; });

            // Fade-in entering text.
            g2.selectAll("text").style("fill-opacity", 0);

            // Transition to the new view.
            t1.selectAll("text").call(text).style("fill-opacity", 0);
            t2.selectAll("text").call(text).style("fill-opacity", 1);
            t1.selectAll("rect").call(rect);
            t2.selectAll("rect").call(rect);

            t1.selectAll(".textdiv").style("display", "none");
            t1.selectAll(".foreignobj").call(rect);
            t2.selectAll(".textdiv").style("display", "block");
            t2.selectAll(".foreignobj").call(rect);

            // Remove the old node when the transition is finished.
            t1.remove().each("end", function() {
                svg.style("shape-rendering", "crispEdges");
                transitioning = false;
            });
        }

        return g;
    }

    // Function called for each text label
    function text(text) {
        text.attr("x", function(d) { return x(d.x) + 6; })
            .attr("y", function(d) { return y(d.y) + 6; });
//            .attr("data-width", function(d) { return x(d.x + d.dx) - x(d.x); });
    }

    // Function called for each rectangle (child)
    function rect(rect) {
        rect.attr("x", function(d) { return x(d.x); })
            .attr("y", function(d) { return y(d.y); })
            .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
            .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); });
    }

    // Function to display the name(s) in the title/nav bar
    function name(d) {
        return d.parent
            ? name(d.parent) + " → " + d.key
            : d.key;
    }
});

