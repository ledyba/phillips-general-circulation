declare var Conrec: any;
declare var d3: any;
class EarchRunner {
  earth = new Model.Earth();
  conrec = new Conrec;
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
    this.xranges[y] = y;
    }
    var ZL = 1000*10;
    for (var z = -ZL; z <+ZL; z+=1000) {
      this.zranges.push(z);
    }
    d3.select("#graph")
     .attr("width", this.width)
     .attr("height", this.height);
  }
  step(){
    if(this.stepCnt == ((24*3600*130/Model.dt)|0)){
      this.earth.step(true);
    }else{
    this.earth.step();
    }
    this.stepCnt++;
    this.time = this.stepCnt * Model.dt;
  }
  anime(){
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
    this.conrec.contour(this.earth.height, 0, Model.H-1, 0, Model.W-1, this.xranges, this.yranges, this.zranges.length, this.zranges);
    try {
      svg.selectAll("path")
        .data(this.conrec.contourList())
      .enter().append("path")
        .style("stroke","black")
        .attr("d", d3.svg.line()
          .x(function(d) { return x(d.x); })
          .y(function(d) { return y(d.y); }));
    } catch(e){

    }
  }
}
function main(){
  var id;
  window.onload=function(ev:Event){
    var r = new EarchRunner();
    var step = function(){
      for(var k=0;k<10;k++){
        r.step();
      }
      r.anime();
    };
    var gr = document.getElementById("graph");
    gr.onclick = function(){
      if(id){
        clearInterval(id);
        id = null;
      }else{
        id = window.setInterval(step, 100);
      }
    };

  };
};
