google.load('visualization', '1', {packages: ['corechart', 'line']});
google.setOnLoadCallback(main);

function visualize(div_name, rows){
	var data = new google.visualization.DataTable();

  var totalData = new Array(rows[0].data.length);
  for(var i=0;i<rows.length;i++){
    data.addColumn('number', rows[i].name);
  }
  for(var i=0;i<rows[0].data.length;i++){
    totalData[i] = new Array(rows.length);
    for(var j=0;j<rows.length;j++){
      totalData[i][j] = rows[j].data[i];
    }
  }
  data.addRows(totalData);

	var options = {
		hAxis: {
			title: 'Time'
		},
		vAxis: {
			title: 'Temp.'
		},
    width: 1100,
    height: 300,
	};

	var chart = new google.visualization.LineChart(document.getElementById(div_name));

	chart.draw(data, options);
}

function diffMethod(dt, upto) {
  var gamma = 0.1;
  var value = 10;
  var times = [];
  var data = [];
  var exp = [];
  for (var t = 0;t<=upto;t+=dt){
    times.push(t);
    value += dt * (-gamma * value);
    data.push(value);
    exp.push(Math.exp(-gamma * t) * 10);
  }
  return [
  {
    name: "Time",
    data: times
  },
  {
    name: "前方差分",
    data: data
  },
  {
    name: "解析解",
    data: exp
  }];
}

function afterDiffMethod(dt, upto) {
  var gamma = 0.1;
  var value = 10;
  var times = [];
  var data = [];
  var exp = [];
  for (var t = 0;t<=upto;t+=dt){
    value = value / (1 + gamma * dt);
    data.push(value);
    times.push(t);
    exp.push(Math.exp(-gamma * t) * 10);
  }
  return [
  {
    name: "Time",
    data: times
  },
  {
    name: "後方差分",
    data: data
  },
  {
    name: "解析解",
    data: exp
  }];
}
function leapFrogMethod(dt, upto) {
  var gamma = 0.1;
  var value0 = 90;
  var value1 = null;
  var times = [];
  var data = [];
  var exp = [];
  for (var t = 0;t<=upto;t+=dt){
    if(t == 0){
      value1 = value0 + value0 * -gamma * dt;
      data.push(value1);
    }else{
      var tmp = value1;
      value1 = value0 - 2*gamma*value1;
      value0 = tmp;
      data.push(value1);
    }
    times.push(t);
    exp.push(Math.exp(-gamma * t) * 10);
  }
  return [
  {
    name: "Time",
    data: times
  },
  {
    name: "LeapFrog",
    data: data
  },
  {
    name: "解析解",
    data: exp
  }];
}

function main() {
  //
  visualize("chart11",diffMethod(0.1,10));
  visualize("chart12",diffMethod(1,10));
  visualize("chart13",diffMethod(10,100));
  visualize("chart14",diffMethod(19,1000));
  //
  visualize("chart21",afterDiffMethod(0.1,10));
  visualize("chart22",afterDiffMethod(1,10));
  visualize("chart23",afterDiffMethod(10,100));
  visualize("chart24",afterDiffMethod(100,1000));
  //
  visualize("chart31",leapFrogMethod(0.1,10));
  visualize("chart32",leapFrogMethod(1,100));
  visualize("chart33",leapFrogMethod(10,100));
  visualize("chart34",leapFrogMethod(100,1000));
}