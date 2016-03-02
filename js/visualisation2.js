var data_Table;
var projectTimeline = dc.barChart('#project_timeline');
var flexibleProject = dc.rowChart('#flexible_timeline');
var durationChart = dc.barChart('#duration');

//======================Rest===========================
d3.selectAll('a#all').on('click', function () {
  dc.filterAll();
  dc.renderAll();
});
d3.selectAll('a#reset_timeline').on('click', function () {
  costStatusPie.filterAll();
  dc.renderAll();
});
d3.selectAll('a#reset_flexible').on('click', function () { timeScheduleChart.filterAll();
  dc.renderAll();
});
d3.selectAll('a#reset_duration').on('click', function () {
 riskStatusChart.filterAll();
  dc.renderAll();
});

//====================data format=======================

var Money_Dollar_Format = d3.format("$,.2f");



d3.csv('data/Projects_Data.csv', function (d){
    
   
   var dateFormat = d3.time.format('%Y-%m-%dT%H:%I:%SZ');
   var yearFormat = d3.time.format('%Y');
  
  
    
    return{
        agency_name: d["Agency Name"],
        investment_title: d["Investment Title"],
        project_name: d["Project Name"],
        projected_cost: +d["Projected/Actual Cost ($ M)"],
        planned_cost: +d["Planned Cost ($ M)"],
        lifecycle_cost: +d["Lifecycle Cost  ($ M)"],
        start_date: d["Start Date"],
        planned_completion_date: d["Planned Project Completion Date (B2)"], 
        project_year: dateFormat.parse(d["Start Date"])
        
    };
  
},function(data){
    
    var cross = crossfilter(data);
    var all = cross.groupAll();
    
//========================Table=======================
    var projectName = cross.dimension(function(d){
        return d.project_name;
    });
    
    data_Table = $("#dc-data-table2").dataTable({
        "bPaginate": true,
        "bLengthChange": true,
        "bFilter": true,
        "bSort": true,
        "bInfo": false,
        "bAutoWidth": false,
        "bDeferRender": true,
        "aaData": projectName.top(Infinity),
        "bDestroy": true,
        "lengthMenu": [[10, 25, 50, -1], [10, 25, 50, "All"]],
        "order": [[2, "desc"]],
        "dom": "tlp",
        "columns": [
            {
                "data": "project_name",
                "width": "15%",
                "defaultContent": ""
            },
            {
                "data": "investment_title",
                "width": "20%",
                "defaultContent": ""
            },
            {
                "data": "agency_name",
                "defaultContent": ""
            },
            {
                "data": "lifecycle_cost",
                "defaultContent": ""
            },
            {
                "data": "project_year",
                "defaultContent": ""
            },
            {
                "data": "planned_completion_date",
                "defaultContent": "",
                "render": function(d) {
                    return d3.round(d, 2);
                }
            },
            
        ]
    });
      function refreshTable() {
        dc.events.trigger(function() {
            data_Table.fnClearTable();
            data_Table.fnAddData(projectName.top(Infinity));
            data_Table.fnDraw();
        });
    }
    costStatusPie.on("filtered", refreshTable);
    projectTimeline.on("filtered", refreshTable);
    flexibleProject.on("filtered", refreshTable);
    durationChart.on("filtered", refreshTable);


//======================Flexible Row Chart===============
  var agencyflexible = cross.dimension(function(d){
    return d.agency_name;
  });
  var agencyCostflexibleGroup = agencyflexible.group().reduceSum(function(d) {
        return d.projected_cost;
  });
  flexibleProject
  .width(480)
  .height(800)
  .dimension(agencyflexible)
  .group(agencyCostflexibleGroup)
  .label(function(d){
    return d.key + Money_Dollar_Format(d.value) + "M";
  })
  .title(function(d){
    return Money_Dollar_Format(d.value) + "M";
  })
  .elasticX(true)
  .ordering(function(d) {
            return -d.value;
            })
  .xAxis().ticks(6);

//=====================timeline===========================
   
     var projectYear = cross.dimension(function(d){
      return d.project_year;
        
    });
    var projectYearGroup = projectYear.group().reduceSum(function(d){
        return d.lifecycle_cost;
    });
    
projectTimeline
    .width(600)
    .height(400)
    .dimension(projectYear)
    .group(projectYearGroup)
    .centerBar(false)
    .elasticX(true)
    .brushOn(true)
    .gap(1)
    .xUnits(function() {
      return 50;
    })
    .x(d3.time.scale().domain([1990, 2015]))
    .renderHorizontalGridLines(true);
    
    dc.renderAll();
});