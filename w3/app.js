function World(dt,dx,L,sigma,u){
  var self = this;
  self.anim = false;
  self.L = L;
  self.sigma = sigma;
  self.u = u;
  self.dt = dt;
  self.dx = dx;
  self.step = 0;
  self.max = Math.round(self.L/self.dx);
  self.opt = {
    animationSteps: 1,
    showTooltips: false,
    onAnimationComplete: function(){self.next();},
    scaleOverride: true,

    // ** Required if scaleOverride is true **
    // Number - The number of steps in a hard coded scale
    scaleSteps: 10,
    // Number - The value jump in the hard coded scale
    scaleStepWidth: 0.03,
    // Number - The scale starting value
    scaleStartValue: 0.8,
  };
  self.labels = [];
  self.values = [];
  self.data = {
      labels: self.labels,
      datasets: [
          {
            label: "Value",
            fillColor: "rgba(151,187,205,0.2)",
            strokeColor: "rgba(151,187,205,1)",
            pointColor: "rgba(151,187,205,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(151,187,205,1)",
            data: self.values,
          },
      ]
  };
  self.init();
}
World.prototype.value = function(i){
  while(i<0){
    i+=this.max;
  }
  while(i>=self.max){
    i-=this.max;
  }
  return this.values[i].value;
};
World.prototype.next = function(){
  var self = this;
  if(!self.anim){
    return;
  }
  self.values = self.chart.datasets[0].points;
  window.setTimeout(function(){
    for(var i = 0;i<self.max;i++){
      var x = i * self.dx;
      self.values[i].value = self.value(i) + self.dt*(-self.u * (self.value(i)-self.value(i-1)/self.dx));
    }
    self.values[self.max].value = self.values[0].value;
    self.chart.update();
    var time = (self.step * self.dt).toFixed( 3 );
    //console.log("Updated: "+time);
    self.step++;
    document.getElementById("time").textContent = time;
  },100);
};
World.prototype.setChart = function(canvas, chart){
  this.canvas = canvas;
  this.chart = chart;
  var self = this;
  this.canvas.onclick = function(){
    if(self.anim){
      self.anim = false;
    }else{
      self.anim = true;
      self.next();
    }
  }
};
World.prototype.init = function(){
  var self = this;
  var skipUntil = 0;
  var skipUnit = (self.L)/10;
  for(var i = 0;i<=self.max;i++){
    var x = i * self.dx;
    if(skipUntil<=x){
      skipUntil += skipUnit;
      self.labels.push(Math.round(x).toString());
    }else{
      self.labels.push("");
    }
    var d = (x-self.L/2);
    self.values.push(Math.exp(-(d*d)/(2*self.sigma*self.sigma)));
  }
};

function main(){
  var word = new World(/*dt*/0.1, /*dx*/1, /**/ 10,10,1);
  var canvas = document.getElementById("chart");
  var ctx = canvas.getContext("2d");
  var chart = new Chart(ctx).Line(word.data, word.opt);
  word.setChart(canvas, chart);
  chart.update();
}

(function (){
  window.addEventListener("load", main);
})();
