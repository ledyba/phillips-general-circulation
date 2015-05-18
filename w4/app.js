var g = 9.8/(1000);

function World(dt,dx,H,rho,gamma,L){
  var self = this;
  self.anim = false;
  //
  self.H = H;
  self.rho = rho;
  self.L = L;
  self.gamma = gamma;
  self.dt = dt;
  self.dx = dx;
  //
  self.step = 0;
  self.timeUnit = 100;
  self.mX = Math.round(self.L/self.dx);
  self.opt = {
    animationSteps: 1,
    showTooltips: false,
    onAnimationComplete: function(){self.next();},
    scaleOverride: true,

    // ** Required if scaleOverride is true **
    // Number - The number of steps in a hard coded scale
    scaleSteps: 0.01,
    // Number - The value jump in the hard coded scale
    scaleStepWidth: 10,
    // Number - The scale starting value
    scaleStartValue: 0,
  };
  self.labels = [];
  self.speeds = [];
  self.etas = [];
  self.speedsL = [];
  self.etasL = [];
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
            data: self.etas,
          },
      ]
  };
  self.init();
}
World.prototype.eta = function(i){
  if(i>=this.mX){
    return this.etas[this.mX-1];
  }else if(i<0){
    return this.etas[0];
  }else{
    return this.etas[i];
  }
};
World.prototype.etaL = function(i){
  if(i>=this.mX){
    return this.etasL[this.mX-1];
  }else if(i<0){
    return this.etasL[0];
  }else{
    return this.etasL[i];
  }
};
World.prototype.speed = function(i){
  if(i>=this.mX){
    return 0;
  }else if(i<=0){
    return 0;
  }else{
    return this.speeds[i];
  }
};
World.prototype.speedL = function(i){
  if(i>=this.mX){
    return 0;
  }else if(i<=0){
    return 0;
  }else{
    return this.speedsL[i];
  }
};
World.prototype.next = function(){
  var self = this;
  if(!self.anim){
    return;
  }
  window.setTimeout(function(){
    if(self.step * self.dt >= 100){
      //return;
    }
    var nextTime = (Math.floor(self.step * self.dt/self.timeUnit)+1) * self.timeUnit;
    while((self.step * self.dt) <= nextTime){
      self.stepFunc();
      self.step++;
    }
    var pts = self.chart.datasets[0].points;
    for(var i = 0;i<=self.mX;i++){
        pts[i].value = self.etas[i]+0.05;
    }
    self.chart.update();
    var time = (self.step * self.dt).toFixed( 3 );
    document.getElementById("time").textContent = time;
  },10);
};
World.prototype.stepFoward = function(){
  var self = this;
  var speed = [];
  var eta = [];
  for(var i = 0;i<self.mX;i++){
    var x = i * self.dx;
    var s = self.speed(i) + self.dt * (-g * ((self.eta(i) - self.eta(i-1))/self.dx) + (self.gamma/(this.rho*self.H)));
    var e = self.eta(i) - self.dt * self.H*(self.speed(i+1) - self.speed(i))/self.dx;
    speed.push(s);
    eta.push(e);
  }
  self.speeds = speed;
  self.etas = eta;
};
World.prototype.stepFunc = function(){
  var self = this;
  if(self.step == 0){
    self.etasL = self.etas;
    self.speedsL = self.speeds;
    self.stepFoward();
    return;
  }
  var speed = [];
  var eta = [];
  for(var i = 0;i<self.mX;i++){
    var x = i * self.dx;
    var s = self.speedL(i) + 2*self.dt * (-g * ((self.eta(i) - self.eta(i-1))/self.dx) + (self.gamma/(this.rho*self.H)));
    var e = self.etaL(i) - 2*self.dt * self.H*(self.speed(i+1) - self.speed(i))/self.dx;
    speed.push(s);
    eta.push(e);
  }
  self.etasL = self.etas;
  self.speedsL = self.speeds;
  self.speeds = speed;
  self.etas = eta;
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
  for(var i = 0;i<=self.mX;i++){
    var x = i * self.dx;
    if(skipUntil<=x){
      skipUntil += skipUnit;
      self.labels.push(Math.round(x).toString());
    }else{
      self.labels.push("");
    }
    var d = (x-self.L/2);
    // 適当な初期値
    var v = 0.1*Math.exp(-(d*d)/(2*self.L));
    self.etas.push(0);
    self.speeds.push(0);
  }
};

function main(){
  var word = new World(/*dt*/10, /*dx*/10, /*H*/ 1, /* rho */1000/(1000*1000), /* gamma */0.1/(1000*1000*1000), /* L */1000);
  var canvas = document.getElementById("chart");
  var ctx = canvas.getContext("2d");
  var chart = new Chart(ctx).Line(word.data, word.opt);
  word.setChart(canvas, chart);
  chart.update();
}

(function (){
  window.addEventListener("load", main);
})();

