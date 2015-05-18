
function Vis(world){
	var self = this;
	self.world = world;
	self.conrec = new Conrec;
	self.xs = d3.range(0, world.width);
	self.ys = d3.range(0, world.height);
	self.zs = d3.range(-5, 3, .5);
	self.width = 800;
	self.height = 800;
	self.x = d3.scale.linear().range([0, self.width]).domain([0, world.width]);
	self.y = d3.scale.linear().range([self.height, 0]).domain([0, world.height]);
	self.colours = d3.scale.linear().domain([-5, 3]).range(["#fff", "red"]);
	d3.select("#graph")
	    .attr("width", self.width)
	    .attr("height", self.height);
}

Vis.prototype.anime = function(){
	var self = this;
	self.conrec.contour(self.world.zs, 0, self.xs.length - 1, 0, self.ys.length - 1, self.xs, self.ys, self.zs.length, self.zs);
	var s = d3.select("#graph")
		.selectAll("path")
			.data(self.conrec.contourList());
	s.enter().append("path");
	s.exit().remove();
	s.style("fill",function(d) { return colours(d.level);})
	    .style("stroke","black")
	    .attr("d", d3.svg.line()
	      .x(function(d) { return x(d.x); })
	      .y(function(d) { return y(d.y); }));
}

var g = 9.8/1000;
var H = 1;
var rho = 1.0*1000*(1000*1000);
var tx = 0.1/1000;
var ty = 0.1/1000;
var L = 1000;
function World(f,dx,dy){
	self.width = (L/dx) | 0;
	self.height = (L/dy) | 0;
	self.zs = makeField(self.width, self.height);
	self.us = makeField(self.width, self.height);
	self.vs = makeField(self.width, self.height);
}

World.prototype.next = function(){

};

var makeField = function(x,y) {
	var f = [];
	for( var i=0;i<x;i++ ) {
		var vs = Array(y);
		for( var j=0;j<y;j++ ) {
			vs[j] = 0;
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
	var dx=20,dy=20,dt=10;
	var world = new World(0,20,20);
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
			for(var i=0;i<10;i++){
				t += dt;
				world.next();
			}
			vis.anime();
			document.getElementById("time").innerHTML = t+"";
			t += 100;
			next();
		},100);
	}
	document.getElementById("graph").addEventListener("click", toggle, false);
}

main();
