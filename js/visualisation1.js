// Create variables and define the charts to use from the crossfilter library
//创建变量和从crossfilter库中定义图表
var dataTable = dc.dataTable('#dc-data-table');
var statusPie = dc.pieChart('#status_pie');
var timeline = dc.barChart('#timeline');
var flexibleRow = dc.rowChart('#flexible_row');

// Load the data and create the charts
//加载数据，创建表
d3.csv('http://training.theodi.org/DataWorkshop/course/en/exercises/Spend_april_10_enriched.csv', function (data) {
    // Create a crossfilter object from the data and group all the data together.
  //从数据中创建crossfilter对象，并将所有数据组在一起
    var ndx = crossfilter(data);
    var all = ndx.groupAll();// group all是什么作用？
    
    // Sort out the dates so we can draw a timeline later.
    var dateFormat = d3.time.format('%Y-%m-%dT%H:%I:%SZ');
  //从D3库中定义一个日期格式
  //创建两个时间，一个最大，一个最小，最大的起始时间为1970
    var mindate = new Date();
    var maxdate = new Date(1970,1,1);
 
    // Create a new date object (d.dd) and work out the earliest and latest date in the dataset.
    data.forEach(function (d) {
	    tmp = dateFormat.parse(d["Payment Date"]);
	    if (tmp < mindate) { mindate = tmp;	}
	    if (tmp > maxdate) { maxdate = tmp; }
	    d.dd = tmp;
    });
  
    
  
    //Create an expense type dimension
    var expenseType = ndx.dimension(function(d) {
	    return d["Expense Type"];
    });
    //Create a default group that counts the number of expenses per type
    var expenseTypeGroup = expenseType.group();
  
    //Create a table of data
  //建表，分组，按照供应商的名字来排
    dataTable
        .dimension(expenseType)
        .group(function (d) {
            return d["Supplier Name"];
        })
        .size(10)
        .columns([
            'Payment Date',
            'Expense Type',
            'Expense Area',
            'Supplier Name',
	          'Company Status',
            'Amount (GBP)'
        ]);
  
    //ALL OF YOUR CODE GOES HERE
    //使用crossfilter对象中的"Expense Type"纬度新建一个变量，用于Expenses per day
  var flexible = ndx.dimension(function(d){//这个d究竟是什么？
    return d["Expense Type"];
  });
  var flexibleGroup = flexible.group();
  flexibleRow
  .width(480)
  .height(800)
  .dimension(flexible)
  .group(flexibleGroup)
  .label(function(d){
    return d.key;
  })
  .title(function(d){
    return d.value;
  })
  .elasticX(true)
  .ordering(function(d) {
            return -d.value;
            })
  .xAxis().ticks(6);//设置x轴的数值总数？ 测试下
  
  var date = ndx.dimension(function(d){
    return d.dd; //设置排序后的日期
  });
  var dateGroup = date.group();
  
  //设置时间轴
  timeline
  .width(500)
  .height(200)
  .dimension(date)
  .group(dateGroup)
  .centerBar(false)//???
  .elasticX(false)//???
  .gap(0)
  .xUnits(function() {
    return 50; //why 50?
  })
  .x(d3.time.scale().domain([mindate,maxdate]))
  .renderHorizontalGridLines(true); //绘图？？
  
  var supplierStatus = ndx.dimension(function(d){
    return d["Company Status"];
  });
  var supplierStatusGroup = supplierStatus.group();
  statusPie
  .width(180)
    .height(180)
    .radius(90)
    .dimension(supplierStatus)
    .group(supplierStatusGroup)
    .ordinalColors(['blue', 'red', 'orange', 'gray'])
    .label(function(d) {
      return (d.key);
    });
    //Render the charts! This MUST stay at the end
    dc.renderAll();

});
  
  