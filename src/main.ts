declare var Conrec: any;
declare var d3: any;
declare var $: any;
class EarthRunner {
  earth = new Model.Earth();
  time = 0;
  stepCnt = 0;
  ranges: Array<Object>;
  xranges = Array<number>(Model.W);
  yranges = Array<number>(Model.H);
  zranges = Array<number>();
  width =  Model.W*20;
  height =  Model.H*30;
  x = d3.scale.linear().range([0, this.width]).domain([0, Model.W]);
  y = d3.scale.linear().range([this.height, 0]).domain([0, Model.H]);
  colours = d3.scale.linear().domain([-50, 0, 50]).range(["blue", "white", "red"]);
  budget = new Array<Model.EnergyBudget>();
  constructor(){
    this.ranges = [];
    for (var x = 0; x < Model.W; x++) {
      for (var y = 0; y < Model.H; y++) {
        this.ranges.push({x: x, y: y});
      }
    }
    for (var x = 0; x < Model.W; x++) {
      this.xranges[x] = x;
    }
    for (var y = 0; y < Model.H; y++) {
      this.yranges[y] = y;
    }
    d3.select("#graph")
     .attr("width", this.width)
     .attr("height", this.height);
     this.budget.push(new Model.EnergyBudget());
  }
  stepCalc(){
    var stepsBy10Day = ((24*3600*10/Model.dt)|0);
    var step = (24*3600*130/Model.dt)|0;
    if(this.stepCnt == step){
      console.log(this.earth.calcEnergyBudget());
      this.earth.step(true);
    }else{
      this.earth.step();
    }
    // calc budget
    var from = 200;
    var to = 1000;
    if (this.budget != null && this.stepCnt >= ((24 * 3600 * from / Model.dt) | 0)) {
      var last = this.budget[this.budget.length - 1];
      last.addeq(this.earth.calcEnergyBudget())
      if (this.stepCnt % stepsBy10Day == 0) {
        this.budget[this.budget.length - 1] = last.average();
        console.log(this.budget[this.budget.length - 1]);
        this.budget.push(new Model.EnergyBudget());
      }
      if(this.stepCnt >= ((24 * 3600 * to / Model.dt) | 0)){
        var avg = new Model.EnergyBudget();
        for(var i=0;i<this.budget.length;i++){
          avg.addeq(this.budget[i]);
        }
        console.log(avg.average());
        this.budget = null;
      }
    }
    this.stepCnt++;
    this.time = this.stepCnt * Model.dt;
  }
  inspectU1(){
    var elem = document.getElementById("inspect_avg_u1");
    elem.innerHTML='';
    for(var i=this.earth.xspeed1Avg.length-1;i>=0;i--){
      var l = document.createElement("li");
      l.innerText=this.earth.xspeed1Avg[i].toPrecision(3);
      elem.appendChild(l);
    }
  }
  inspectV1(){
    var elem = document.getElementById("inspect_avg_v1");
    elem.innerHTML='';
    for(var i=this.earth.yspeedAvg.length-1;i>=0;i--){
      var l = document.createElement("li");
      var v = this.earth.yspeedAvg[i] * 1000;
      l.innerText=v.toPrecision(3);
      elem.appendChild(l);
    }
  }
  inspectU4(){
    var elem = document.getElementById("inspect_avg_u4");
    elem.innerHTML='';
    for(var i=this.earth.xspeed1Avg.length-1;i>=0;i--){
      var l = document.createElement("li");
      var u1 = this.earth.xspeed1Avg[i];
      var u3 = this.earth.xspeed3Avg[i];
      //var u4 = u3 + (u3-u1) 1/2;
      var u4 = u3*3/2 - u1 /2;
      l.innerText=u4.toPrecision(3);
      elem.appendChild(l);
    }
  }
  inspectT2(){
    var elem = document.getElementById("inspect_avg_t2");
    elem.innerHTML='';
    for(var i=this.earth.tempAvg.length-1;i>=0;i--){
      var l = document.createElement("li");
      l.innerText=this.earth.tempAvg[i].toPrecision(3);
      elem.appendChild(l);
    }
  }
  anime(){
    this.earth.calcDisplay();
    this.inspectU1();
    this.inspectU4();
    this.inspectV1();
    this.inspectT2();
    var time = document.getElementById("time");
    time.innerText = (this.time / (24*3600)).toFixed(3)+" Days";
    var svg = d3.select("#graph");
    var t = svg.selectAll("rect").data(this.ranges);
    t.enter().append("rect");
    t.exit().remove();
    var earth = this.earth;
    var x = this.x;
    var y = this.y;
    var colours = this.colours;
    t.style("fill",function(d){ return colours(earth.temp[d.y][d.x]); })
      .attr("x",function(d) { return x(d.x); })
      .attr("y",function(d) { return y(d.y+1); })
      .attr("width", x(1))
      .attr("height", Math.abs(y(0)-y(1)));
    function makeRange(from: number, to: number, cnt: number){
      var ranges = new Array<number>(cnt-1);
      for(var k=1;k<cnt;k++){
        ranges[k-1] = (to-from) * k/cnt + from;
      }
      return ranges;
    }
    function minmax(rs: Array<Array<number>>):any{
      var min = rs[0][0];
      var max = rs[0][0];
      for(var i = 0;i<rs.length;i++){
        for(var j = 0;j<rs[i].length;j++){
          var v = rs[i][j];
          if(v < min){
            min = v;
          }
          if(v > max){
            max = v;
          }
        }
      }
      return {min: min, max:max};
    }
    try {
      var r = minmax(this.earth.height);
      var zranges = makeRange(r.min,r.max,10);
      var conrec = new Conrec();
      conrec.contour(this.earth.height, 0, this.yranges.length-1, 0, this.xranges.length-1, this.yranges, this.xranges, zranges.length, zranges);
      var lst:Array<Array<Object>> = conrec.contourList();
      var paths = svg.selectAll("path").data(lst);
      paths.enter().append("path");
      paths.exit().remove();
      var ccolors = d3.scale.linear().domain([r.min, (r.min + r.max)/2, r.max]).range(["lime", "black", "orange"]);
      paths
        .style("stroke", function(d){return ccolors(d.level);} )
        .style("fill","none")
        .attr("d", d3.svg.line()
          .x(function(d) { return x(d.y+0.5); })
          .y(function(d) { return y(d.x+0.5); }));
    } catch(e){
      console.log(e);
    }
  }
  id: any;
  step(){
    var day = (earthRunner.time / (24*3600)) | 0;
    var stepPerAnim = 12;
    if(day < 130){
      stepPerAnim = 48;
    }else if(day > 200){
    }
    for(var k=0;k<stepPerAnim;k++){
      this.stepCalc();
    }
    day = (earthRunner.time / (24*3600)) | 0;
    if(day == 130){
      this.stop();
    }
    this.anime();
  }
  stop(){
    clearInterval(this.id);
    this.id = null;
    var btn = $( "#run_button" );
    btn.button("option", "label", "再開");
    btn.prop('checked', false);
    btn.button("refresh");
  }
  start(){
    var self = this;
    this.id = window.setInterval(function(){self.step();}, 100);
    var btn = $( "#run_button" );
    btn.button("option", "label", "停止");
    btn.prop('checked', true);
    btn.button("refresh");
  }
  isRunning():boolean{
    return this.id != null;
  }
}
declare var earthRunner: EarthRunner;
function main(){
  var id;
  window.onload=function(ev:Event){
    earthRunner = new EarthRunner();
  };
};
