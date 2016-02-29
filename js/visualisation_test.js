var agencyChart = dc.rowChart("#agency-chart"),
    costVarChart = dc.pieChart("#cost-variance-chart"),
    scheduleVarChart = dc.pieChart("#schedule-variance-chart"),
    count = dc.dataCount("#count"),
    projectTable;

var formatDollars = d3.format("$,.2f");

d3.csv("data/data-clean.csv", function(d) {
    if (+d["Projected/Actual Cost ($ M)"] == 0) {
        return;
    }

    return {
        agency: d["Agency Name"],
        agency_code: d["Agency Code"],
        investment: d["Investment Title"],
        investment_id: d["Unique Investment Identifier"],
        id: d["Project ID"],
        name: d["Project Name"],
        description: d["Project Description"],
        lifecycle_cost: +d["Lifecycle Cost ($ M)"],
        planned_cost: +d["Planned Cost ($ M)"],
        projected_cost: +d["Projected/Actual Cost ($ M)"],
        cost_variance: +d["Cost Variance ($ M)"],
        start_date: moment(d["Start Date"]),
        end_date: moment(d["Completion Date (B1)"]),
        planned_date: moment(d["Planned Project Completion Date (B2)"]),
        date_variance: +d["Schedule Variance (in days)"]
    };
}, function(data) {
    var facts = crossfilter(data),
        all = facts.groupAll();
    
    var agencyDimension = facts.dimension(function(d) {
        return d.agency;
    });
    
    var costsByAgencyGroup = agencyDimension.group().reduceSum(function(d) {
        return d.projected_cost;
    });
    
    d3.select("#agency-chart").append("h2").text("Agency Spending");
    
    agencyChart
        .width(500)
        .height(700)
        .margins({top: 0, right: 0, bottom: 20, left: 5})
        .dimension(agencyDimension)
        .group(costsByAgencyGroup)
        .ordering(function(d) {
            return -d.value;
        })
        .title(function(d) {
            return formatDollars(d.value) + "M";
        })
        .elasticX(true)
        .xAxis().ticks(5);
    //用来计算超支或者不超支
    var costVarDimension = facts.dimension(function(d) {
        var cv = d3.round(d.cost_variance, 2);
        if (cv > 0) {
            return "Positive";
        } else if (cv < 0) {
            return "Negative";
        } else {
            return "0";
        }
    });
    
    var costVarGroup = costVarDimension.group();
    
    d3.select("#cost-variance-chart").append("h2").text("Cost Variance");
    
    costVarChart
        .width(340)
        .height(340)
        .radius(150)
        .dimension(costVarDimension)
        .group(costVarGroup)
        .ordinalColors(["#DA4453", "#CCD1D9", "#8CC152"])
        .colorDomain(["Negative", "0", "Positive"]);
    
    var scheduleVarDimension = facts.dimension(function(d) {
        var cv = d3.round(d.date_variance, 2);
        if (cv > 0) {
            return "Positive";
        } else if (cv < 0) {
            return "Negative";
        } else {
            return "0";
        }
    });
    
    var scheduleVarGroup = scheduleVarDimension.group();
    
    d3.select("#schedule-variance-chart").append("h2").text("Schedule Variance");
    
    scheduleVarChart
        .width(340)
        .height(340)
        .radius(150)
        .dimension(scheduleVarDimension)
        .group(scheduleVarGroup)
        .ordinalColors(["#DA4453", "#CCD1D9", "#8CC152"])
        .colorDomain(["Negative", "0", "Positive"]);
    
    count
        .dimension(facts)
        .group(all)
        .html({
            some: "<strong class=>%filter-count</strong> out of <strong>%total-count</strong> projects selected."
                + " | <a href='javascript:dc.filterAll(); render();'>Reset Filters</a>",
            all: "All projects visible. Click on a graph to filter the selection."
        });
    
    var projectNameDimension = facts.dimension(function (d) {
        return d.project_name;
    });
    
    projectTable = $("#project-table").dataTable({
        "bPaginate": true,
        "bLengthChange": true,
        "bFilter": true,
        "bSort": true,
        "bInfo": false,
        "bAutoWidth": false,
        "bDeferRender": true,
        "aaData": projectNameDimension.top(Infinity),
        "bDestroy": true,
        "lengthMenu": [[10, 25, 50, -1], [10, 25, 50, "All"]],
        "order": [[2, "desc"]],
        "dom": "tlp",
        "columns": [
            {
                "data": "name",
                "defaultContent": ""
            },
            {
                "data": "agency",
                "defaultContent": ""
            },
            {
                "data": "projected_cost",
                "defaultContent": "",
                "render": function(d) {
                    return d3.round(d, 2);
                },
                "className": "dt-right"
            },
            {
                "data": "cost_variance",
                "defaultContent": "",
                "render": function(d) {
                    return d3.round(d, 2);
                },
                "className": "dt-right",
                "createdCell": function(td, cellData, rowData, row, col) {
                    var d = d3.round(cellData, 2)
                    if (d > 0) {
                        $(td).css("color", "#8CC152");
                    } else if (d < 0) {
                        $(td).css("color", "#DA4453");
                    }
                }
            },
            {
                "data": "end_date",
                "defaultContent": "",
                "render": function(d) {
                    return d.format("YYYY/MM/DD");
                }
            },
            {
                "data": "date_variance",
                "defaultContent": "",
                "render": function(d) {
                    return d3.round(d, 2);
                },
                "className": "dt-right",
                "createdCell": function(td, cellData, rowData, row, col) {
                    var d = d3.round(cellData, 2)
                    if (d > 0) {
                        $(td).css("color", "#8CC152");
                    } else if (d < 0) {
                        $(td).css("color", "#DA4453");
                    }
                }
            }
        ]
    });
    
    function refreshProjectTable() {
        dc.events.trigger(function() {
            projectTable.fnClearTable();
            projectTable.fnAddData(projectNameDimension.top(Infinity));
            projectTable.fnDraw();
        });
    }
    
    agencyChart.on("filtered", refreshProjectTable);
    costVarChart.on("filtered", refreshProjectTable);
    scheduleVarChart.on("filtered", refreshProjectTable);
    
    render();
    
    d3.select("#loading").style("display", "none");
    d3.select("#project-table").style("display", "block");
});

function render() {
    dc.renderAll();
    
    d3.select('#agency-label').remove();                                                     
    d3.select('#agency-chart')                                                              
        .append('span')                                                                         
        .attr('id', 'agency-label')                                                          
        .text('Projected/Actual Cost ($ M)');
    
//    d3.select('#cost-var-label').remove();
//    d3.select('#cost-variance-chart')
//        .append('span')
//        .attr('id', 'cost-var-label')
//        .text('Cost Variance');
//    
//    d3.select('#schedule-var-label').remove();
//    d3.select('#schedule-variance-chart')
//        .append('span')
//        .attr('id', 'schedule-var-label')
//        .text('Schedule Variance');
}

window.filter = function(filters) {
    filters.forEach(function(d, i) { dc.chartRegistry.list()[i].filter(d); });
    render();
};