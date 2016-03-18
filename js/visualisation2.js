var data_Table;
var projectTimeline = dc.barChart('#project_timeline');
var flexibleProject = dc.rowChart('#flexible_timeline');
var durationChart = dc.barChart('#duration');
var yearandDuration = dc.lineChart('#year_duration');
var scalingChart = dc.barChart('#scaling');

//======================Rest===========================
d3.selectAll('a#all2').on('click', function () {
  dc.filterAll();
  dc.renderAll();
});
d3.selectAll('a#reset_projectTimeline').on('click', function () {
  projectTimeline.filterAll();
  dc.renderAll();
});
d3.selectAll('a#reset_flexibleProject').on('click', function () { flexibleProject.filterAll();
  dc.renderAll();
});
d3.selectAll('a#reset_durationChart').on('click', function () {
 durationChart.filterAll();
  dc.renderAll();
});
d3.selectAll('a#reset_year_duration').on('click', function () {
  yearandDuration.filterAll();
  scalingChart.filterAll();
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
        project_year: dateFormat.parse(d["Start Date"]),
        
        duration_year: +d["Duration time (year)"],
        //minyear: d[yearFormat.parse(mindate)],
        //maxyear: d[yearFormat.parse(maxdate)]
        
    };
  
},function(data){
    
    var cross2 = crossfilter(data);
    var all = cross2.groupAll();
    var dateFormat = d3.time.format('%Y-%m-%dT%H:%I:%SZ');
    var yearFormat = d3.time.format('%Y');
    var mindate = new Date();
    var maxdate = new Date(1970, 1, 1);
    data.forEach(function(d){
        var tmp = dateFormat.parse(d.start_date);
        if (tmp < mindate) {
            mindate = tmp;
        }
        if (tmp > maxdate) {
            maxdate = tmp;
        }
        
    }); 
   
//========================Table=======================
    var projectName = cross2.dimension(function(d){
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
                "defaultContent": "",
                 "render": function(d) {
                    return d3.round(d, 2);
                }
            },
            {
                "data": "project_year",
                "defaultContent": ""
                
               
            },
            {
                "data": "duration_year",
                "defaultContent": ""
                
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
  var agencyflexible = cross2.dimension(function(d){
    return d.agency_name;
  });
  var agencyCostflexibleGroup = agencyflexible.group().reduceSum(function(d) {
        return d.duration_year;
  });
  flexibleProject
  .width(480)
  .height(800)
  .dimension(agencyflexible)
  .group(agencyCostflexibleGroup)
  .label(function(d){
    return d.key + "------" + d.value + "Years";
  })
  .title(function(d){
    return d.value + "Years";
  })
  .elasticX(true)
  .ordering(function(d) {
            return -d.value;
            })
  .xAxis().ticks(6);

//=====================timeline===========================
   
     var projectYear = cross2.dimension(function(d){
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
    .elasticX(false)
    .yAxisLabel('Cost (M $)')
    .xAxisLabel('Year')
    .brushOn(true)
    .gap(1)
    .xUnits(function() {
      return 50;
    })
    .x(d3.time.scale().domain([mindate,maxdate]))
    .renderHorizontalGridLines(true)
    projectTimeline.on('renderlet', function (chart) {
		chart.selectAll("g.y text")
			.attr('dx', '5')
			.attr('dy', '15')
			.attr('transform', "rotate(45)"); 
            //Roate the Y      
	});
    
    

//=====================timeline===========================
   
     var projectYear = cross2.dimension(function(d){
      return d.project_year;
        
    });
    var projectDuration = projectYear.group().reduceSum(function(d){
        return d.duration_year;
    });
    
durationChart
    .width(600)
    .height(400)
    .dimension(projectYear)
    .group(projectDuration)
    .centerBar(false)
    .elasticX(false)
    .brushOn(true)
    .yAxisLabel('Duration (Years)')
    .xAxisLabel('Year')
    .gap(1)
    .xUnits(function() {
      return 50;
    })
    .x(d3.time.scale().domain([mindate,maxdate]))
    .renderHorizontalGridLines(true);
//======================line char year and duration=================
    var projectYear = cross2.dimension(function(d){
      return d.project_year;
        
    });
     var project_projectcost = projectYear.group().reduceSum(function(d){
        return d.projected_cost;
    });
    var project_plancost = projectYear.group().reduceSum(function(d){
        return d.planned_cost;
    });
    
yearandDuration
    .renderArea(true)
    .transitionDuration(1000)
    .mouseZoomable(false)
    .width(1000)
    .height(400)
    .rangeChart(scalingChart)
    .dimension(projectYear)
    .xUnits(function() {
      return 30;
    })
    .x(d3.time.scale().domain([mindate,maxdate]))
    //.x(d3.time.scale().domain(d.minyear, d.maxyear))
    .group(project_plancost, 'Planned Cost')
    .stack(project_projectcost, 'Actual Cost', function(d){
        return d.value;
    })
    //.centerBar(true)
    .title(function(d){
        var value = d.planned_cost ? d.planned_cost : d.value;
        if(isNaN(value)){
            value = 0;
        }
        return d.key + '\n' + d3.round(value, 2);
    })
    .legend(dc.legend().x(800).y(5).itemHeight(20).gap(5))
    .elasticY(true)
    .elasticX(false)
    .brushOn(true)
    .yAxisLabel('Planned/ Actual Cost ($ M)')
    .xAxisLabel('Year')
    //.gap(1)
    .renderHorizontalGridLines(true)
    yearandDuration.on('renderlet', function (chart) {
		chart.selectAll("g.y text")
			.attr('dx', '5')
			.attr('dy', '15')
			.attr('transform', "rotate(45)"); 
            //Roate the Y      
	});
    
    
//===================scaling bar chart============================
    scalingChart
    .width(990)
    .height(80)
    .dimension(projectYear)
    .group(projectYear.group())
    .centerBar(true)
    .gap(2)
    .elasticX(true)
    .x(d3.time.scale().domain([mindate,maxdate]))
    .xUnits(function(){
        return 50;
    });
    scalingChart.yAxis().ticks(0);
    
    dc.renderAll();
});