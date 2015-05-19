
function Vis(world){
	var self = this;
	self.world = world;
	self.xs = d3.range(0, world.width+2);
	self.ys = d3.range(0, world.height+2);
	self.width = 500;
	self.height = 500;
	self.x = d3.scale.linear().range([0,  self.width]).domain([0,  world.width+2]);
	self.y = d3.scale.linear().range([self.height, 0]).domain([0, world.height+2]);
	self.color = d3.scale.linear().domain([-10,-0.5,0.1,0.2,0.3,0.5,0.6,0.7]).range(["#88f","#0a0", "#6c0", "#ee0", "#eb4", "#eb9", "#f66", "#f88"]);
	self.xAxis = d3.svg.axis().scale(self.x).orient("bottom").ticks(20);
	self.yAxis = d3.svg.axis().scale(self.y).orient("left").ticks(20);
	self.svg = d3.select("#graph").attr("width", self.width).attr("height", self.height).append("g");
}

Vis.prototype.anime = function(){
	var self = this;
	self.x.domain([0,  self.world.width+2]);
	self.y.domain([0, self.world.height+2]);
	self.svg.selectAll(".isoline")
      .data(self.color.domain().map(isoline))
	.enter().append("path")
      .datum(function(d) { return d3.geom.contour(d).map(transform); })
      .attr("class", "isoline")
      .attr("d", function(d) { return "M" + d.join("L") + "Z"; })
      .style("fill", function(d, i) { return self.color.range()[i]; });
	self.svg.selectAll(".isoline")
      .data(self.color.domain().map(isoline))
      .datum(function(d) { return d3.geom.contour(d).map(transform); })
      .attr("class", "isoline")
      .attr("d", function(d) { return "M" + d.join("L") + "Z"; })
      .style("fill", function(d, i) { return self.color.range()[i]; });

  self.svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + self.height + ")")
      .call(self.xAxis);

  self.svg.append("g")
      .attr("class", "y axis")
      .call(self.yAxis);

  function isoline(min) {
		var w = self.world;
    return function(x, y) {
      return x >= 0 && y >= 0 && x < self.world.width && y < self.world.height && w.zs[x+1][y+1] >= min;
    };
  }

  function transform(point) {
    return [point[0] * self.width / self.world.width, point[1] * self.height / self.world.height];
  }

};

var g = 9.8/1000;
var H = 1;
var rho = 1.0*1000*(1000*1000);
var tx = 0.1/1000;
var ty = 0.1/1000;
var L = 1000;
var sigma = 100;
function World(f,dx,dy,dt) {
	var self = this;
	self.dt = dt;
	self.dx = dx;
	self.dy = dy;
	self.f = f;
	self.width = (L/dx) | 0;
	self.height = (L/dy) | 0;
	self.zs = makeField(self.width, self.height);
	self.us = makeField(self.width, self.height);
	self.vs = makeField(self.width, self.height);
	for(var x=0;x<self.width;x++){
		for(var y=0;y<self.height;y++){
			var px = x*dx-(L/2);
			self.zs[x+1][y+1]=Math.exp(-px*px/(2*sigma*sigma));
		}
	}
	self.step = 0;
}
World.prototype.swap = function(zs,us,vs){
	var self = this;
	self.lzs = self.zs;
	self.lus = self.us;
	self.lvs = self.vs;
	self.zs = zs;
	self.us = us;
	self.vs = vs;
}
World.prototype.getZ = function(x,y){
	var self = this;
	if(x < 0){
		x = 0;
	}else if(x >= self.width){
		x = self.width-1;
	}
	if(y < 0){
		y = 0;
	}else if(y >= self.height){
		y = self.height-1;
	}
	return self.zs[x+1][y+1];
};
World.prototype.getLZ = function(x,y){
	var self = this;
	if(x < 0){
		x = 0;
	}else if(x >= self.width){
		x = self.width-1;
	}
	if(y < 0){
		y = 0;
	}else if(y >= self.height){
		y = self.height-1;
	}
	return self.lzs[x+1][y+1];
};
World.prototype.setZ = function(x,y,v){
	var self = this;
	self.zs[x+1][y+1] = v;
};

World.prototype.getU = function(x,y){
	var self = this;
	if(x <= 0 || y <= 0 || x >= self.width-1 || y >= self.height-1){
		return 0;
	}else{
		return self.us[x+1][y+1];
	}
};
World.prototype.getV = function(x,y){
	var self = this;
	if(x <= 0 || y <= 0 || x >= self.width-1 || y >= self.height-1){
		return 0;
	}else{
		return self.vs[x+1][y+1];
	}
};
World.prototype.getLU = function(x,y){
	var self = this;
	if(x <= 0 || y <= 0 || x >= self.width-1 || y >= self.height-1){
		return 0;
	}else{
		return self.lus[x+1][y+1];
	}
};
World.prototype.getLV = function(x,y){
	var self = this;
	if(x <= 0 || y <= 0 || x >= self.width-1 || y >= self.height-1){
		return 0;
	}else{
		return self.lvs[x+1][y+1];
	}
};

World.prototype.setU = function(x,y,v){
	var self = this;
	self.us[x+1][y+1] = v;
};
World.prototype.setV = function(x,y,v){
	var self = this;
	self.vs[x+1][y+1] = v;
};
World.prototype.setLU = function(x,y,v){
	var self = this;
	self.lus[x+1][y+1] = v;
};
World.prototype.setLV = function(x,y,v){
	var self = this;
	self.lvs[x+1][y+1] = v;
};

World.prototype.next = function(){
	var self = this;
	if(self.step == 0){
		self.first();
	}else{
		self.leap();
	}
	self.step++;
};

World.prototype.first = function(){
	var self = this;
	var dt = self.dt;
	var dx = self.dx;
	var dy = self.dy;
	var f = self.f;
	var zs = makeField(self.width,self.height);
	var us = makeField(self.width,self.height);
	var vs = makeField(self.width,self.height);
	for(var x=0;x<self.width;x++){
		for(var y=0;y<self.height;y++){
			var v = self.getV(x,y);
			var u = self.getU(x,y);
			us[x+1][y+1]=self.getU(x,y)+dt*( f*v - g*((self.getZ(x+1,y)-self.getZ(x-1,y))/(2*dx)) + tx/(rho*H));
			vs[x+1][y+1]=self.getV(x,y)+dt*(-f*u - g*((self.getZ(x,y+1)-self.getZ(x,y-1))/(2*dy)) + ty/(rho*H));
			zs[x+1][y+1]=self.getZ(x,y)+dt*(-H)*(((self.getU(x+1,y)-self.getU(x-1,y))/(2*dx))+((self.getV(x,y+1)-self.getV(x,y-1))/(2*dy)));
		}
	}
	self.swap(zs,us,vs);
};

World.prototype.leap = function(){
	var self = this;
	var dt = self.dt;
	var dx = self.dx;
	var dy = self.dy;
	var f = self.f;
	var zs = makeField(self.width,self.height);
	var us = makeField(self.width,self.height);
	var vs = makeField(self.width,self.height);
	for(var x=0;x<self.width;x++){
		for(var y=0;y<self.height;y++){
			var v = self.getV(x,y);
			var u = self.getU(x,y);
			us[x+1][y+1]=self.getLU(x,y)+dt*2*( f*v - g*((self.getZ(x+1,y)-self.getZ(x-1,y))/(2*dx)) + tx/(rho*H));
			vs[x+1][y+1]=self.getLV(x,y)+dt*2*(-f*u - g*((self.getZ(x,y+1)-self.getZ(x,y-1))/(2*dy)) + ty/(rho*H));
			zs[x+1][y+1]=self.getLZ(x,y)+dt*2*(-H)*(((self.getU(x+1,y)-self.getU(x-1,y))/(2*dx))+((self.getV(x,y+1)-self.getV(x,y-1))/(2*dy)));
		}
	}
	self.swap(zs,us,vs);
};

var makeField = function(x,y) {
	var min = 0;
	var f = [];
	{
		var vs = Array(y+2);
		for( var j=0;j<y+2;j++ ) {
			vs[j] = min;
		}
		f.push(vs);
	}
	for( var i=0;i<x;i++ ) {
		var vs = Array(y+2);
		for( var j=0;j<y+2;j++ ) {
			vs[j] = min;
		}
		f.push(vs);
	}
	{
		var vs = Array(y+2);
		for( var j=0;j<y+2;j++ ) {
			vs[j] = min;
		}
		f.push(vs);
	}
	return f;
};
var copyField = function(orig) {
	var f = Array(orig.length);
	for( var i=0;i<orig.length;i++ ) {
		var o = orig[i];
		var vs = Array(o.length);
		for( var j=0;j<y;j++ ) {
			vs[j] = o[j];
		}
		f[i] = (vs);
	}
	return f;
};
World.prototype.makeWall = function(w,h,f) {
	return function(v){
		if(v <= 0){
			return 0;
		}else if(v >= len-1){
			return 0;
		}else{
			return f(v);
		}
	};
};
World.prototype.makeWrap = function(w,h,f) {
	return function(v){
		if(v <= 0){
			return f(0);
		}else if(v >= len-1){
			return f(len-1);
		}else{
			return f(v);
		}
	};
};

function main(){
	var dx=20,dy=20,dt=1;
	var world = new World(1/100,dx,dy,dt);
	var vis = new Vis(world);
	vis.anime();
	var t = 0;
	var enabled = false;
	function toggle(){
		enabled = !enabled;
		next();
	}
	function next(){
		window.setTimeout(function(){
			if(!enabled){
				return;
			}
			for(var i=0;i<300;i++){
				t += dt;
				world.next();
			}
			vis.anime();
			document.getElementById("time").textContent = t.toFixed(3);
			next();
		},30);
	}
	document.getElementById("graph").addEventListener("click", toggle, false);
}

main();
