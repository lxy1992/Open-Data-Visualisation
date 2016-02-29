
var dataTable = dc.dataTable('#dc-data-table');
var costStatusPie = dc.pieChart('#status_pie');
var timeScheduleChart = dc.pieChart('#time-Schedule-Chart');
var riskStatusChart = dc.pieChart('#Risk-Status-Chart');
var flexibleRow = dc.rowChart('#flexible_row');
d3.selectAll('a#all').on('click', function () {
  dc.filterAll();
  dc.renderAll();
});
d3.selectAll('a#reset_cost').on('click', function () {
  costStatusPie.filterAll();
  dc.renderAll();
});
d3.selectAll('a#reset_time').on('click', function () { timeScheduleChart.filterAll();
  dc.renderAll();
});
d3.selectAll('a#reset_risk').on('click', function () {
 riskStatusChart.filterAll();
  dc.renderAll();
});

var formatDollars = d3.format("$,.2f");

d3.csv('data/Projects_Data.csv', function (d) {
  //  if (+d["Projected/Actual Cost ($ M)"] == 0) {
  //      return;
   // }
    
    return{
        agency_name: d["Agency Name"],
        investment_title: d["Investment Title"],
        project_name: d["Project Name"],
        lifecycle_cost: +d["Lifecycle Cost  ($ M)"],
	    planned_cost: +d["Planned Cost ($ M)"],
        agency_projected_cost: +d["Projected/Actual Cost ($ M)"],
        start_date: d["Start Date"],
        completion_date: d["Completion Date (B1)"],
        planned_completion_date: d["Planned Project Completion Date (B2)"],
        cost_variance: +d["Cost Variance ($ M)"],
        date_variance: +d["Schedule Variance (in days)"]
        
    };
},function(data){
    
    var cross = crossfilter(data);
    var all = cross.groupAll();
    

    
 //=======================Table========================= 
    //Create a agency type dimension
    var agencyName = cross.dimension(function(d) {
	    return d.agency_name;//d["Agency Name"];
    });
    //Create a cost type dimension
    var agencyCost = cross.dimension(function(d){
        return d.agency_projected_cost;//d["Projected/Actual Cost ($ M)"];
    });
    //Create a default group that counts the number of expenses per type
    var agencyNameGroup = agencyName.group();
  
    //Create a table of data
    dataTable
        .dimension(agencyName)
        .group(function (d) {
            return d.agency_name;
        })
        .size(10)
        .columns([
    
        "agency_name",
        "investment_title",
        "project_name",
        "lifecycle_cost",
	    "planned_cost",
        "agency_projected_cost",
        "start_date",
        "completion_date",
        "planned_completion_date",
        "cost_variance",
        "date_variance"
        ]);
  
//======================Row Chart========================
  var agencyflexible = cross.dimension(function(d){
    return d.agency_name;
  });
  var agencyCostflexibleGroup = agencyflexible.group().reduceSum(function(d) {
        return d.agency_projected_cost;//+d["Projected/Actual Cost ($ M)"];
  });
  flexibleRow
  .width(480)
  .height(800)
  .dimension(agencyflexible)
  .group(agencyCostflexibleGroup)
  .label(function(d){
    return d.key + formatDollars(d.value) + "M";
  })
  .title(function(d){
    return formatDollars(d.value) + "M";
  })
  .elasticX(true)
  .ordering(function(d) {
            return -d.value;
            })
  .xAxis().ticks(6);//设置x轴的数值总数？ 测试下
  
  
  
 
//===================Pie chart Cost======================
    
    var profitAndLoss = cross.dimension(function(d) {
        var pl = d3.round(d.cost_variance, 2);
        if (pl > 0) {
            return "Profit";
        } else if (pl < 0) {
            return "Loss";
        } else {
            return "Unknow";
        }
    }); 


  var profitAndLossGroup = profitAndLoss.group();
  //Build the Pie chart for this data
  costStatusPie
    .width(300)
    .height(300)
    .radius(120)
    .dimension(profitAndLoss)
    .group(profitAndLossGroup)
    .ordinalColors(['#1a45dc', '#e93f65', 'gray'])
    .colorDomain(["Profit","Loss","Unknow"])
    .label(function(d) {
      return (d.key) + "(" + Math.floor(d.value / all.value() * 100) + "%)";
      
    })
    .innerRadius(30);
  
   // .renderHorizontalGridLines(true)
   // .renderVerticalGridLines(true)
   // .render();
    
    
    //================Pie Chart Schedule=================
    var punctualAndDelay = cross.dimension(function(d){
        var pd = d3.round(d.date_variance,2);
        if(pd > 0){
            return "Punctual";
        } else if (pd < 0){
            return "Delay";
        } else {
            return "Unknow";
        }
    });
    
    var punctualAndDelayGroup = punctualAndDelay.group();
    
    timeScheduleChart
    .width(300)
    .height(300)
    .radius(120)
    .dimension(punctualAndDelay)
    .group(punctualAndDelayGroup)
    .ordinalColors(['#1a45dc', '#e93f65', 'gray'])
    .colorDomain(["Punctuak","Delay","Unknow"])
    .colorDomain(["Low Risk","High Risk","Medium Risk"])
    .label(function(d) {
      return (d.key) + "(" + Math.floor(d.value / all.value() * 100) + "%)";
      
    })
    .innerRadius(30);

    
    //================Pie Chart Risk====================
    var riskStatus = cross.dimension(function(d){
        var pd = d3.round(d.date_variance,2);
        var pl = d3.round(d.cost_variance, 2);
        if(pd*pl < 0){
            return "Medium Risk";
        }else if (pd < 0 || pl < 0){
                  return "High Risk";
                  }else{
                      return "Low Risk";
                  }
    });
    
    var riskStatusGroup = riskStatus.group();
    
    riskStatusChart
    .width(400)
    .height(400)
    .radius(200)
    .dimension(riskStatus)
    .group(riskStatusGroup)
    .ordinalColors(['#1a45dc', '#e93f65', 'gray'])
    .colorDomain(["Low Risk","High Risk","Medium Risk"])
    .innerRadius(50)
    .label(function(d) {
      return (d.key) + "(" + Math.floor(d.value / all.value() * 100) + "%)";
      
    });

    //Render the charts! This MUST stay at the end
    dc.renderAll();
    
    

});
  
  