class EarchRunner {
  earth = new Model.Earth();
  time = 0;
  stepCnt = 0;
  ranges: Array<Object>;
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
    ;
    t.style("fill",function(d){ return colours(earth.temp[d.y][d.x]); })
      .attr("x",function(d) { return x(d.x); })
      .attr("y",function(d) { return y(d.y+1); })
      .attr("width", x(1))
      .attr("height", Math.abs(y(0)-y(1)));
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
