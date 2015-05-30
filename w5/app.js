
function Vis(world){
	var self = this;
	self.world = world;
	self.conrec = new Conrec;
	self.xs = d3.range(0, world.width);
	self.ys = d3.range(0, world.height);
	self.zs = d3.range(0, 1, .1);
	self.width = 600;
	self.height = 600;
	self.x = d3.scale.linear().range([0, self.width]).domain([0, world.width]);
	self.y = d3.scale.linear().range([self.height, 0]).domain([0, world.height]);
	self.colours = d3.scale.linear().domain([0, 1]).range(["white", "red"]);
	d3.select("#graph")
	    .attr("width", self.width)
	    .attr("height", self.height);
}

Vis.prototype.anime = function(){
	var self = this;
	var zs = self.world.zs;
	self.conrec.contour(zs, 0, self.xs.length - 1, 0, self.ys.length - 1, self.xs, self.ys, self.zs.length, self.zs);
	var lines = self.conrec.contourList();
	/*
	var s = d3.select("#graph").selectAll("path").data(lines);
	s.enter().append("path");
	s.exit().remove();
	s.style("fill",function(d) { return self.colours(d.level);})
	    .style("stroke","black")
	    .attr("d", d3.svg.line()
	      .x(function(d) { return self.x(d.x); })
	      .y(function(d) { return self.y(d.y); }));
	*/
	var ranges = [];
	for (var x = 0; x < self.world.width; x++) {
		for (var y = 0; y < self.world.height; y++) {
			ranges.push({x: x, y: y});
		}
	}
	var colorF = function(d){
		var z = zs[d.x][d.y];
		var c = self.colours(z)
		return c;
	}
	var t = d3.select("#graph").selectAll("rect").data(ranges);
	t.enter().append("rect");
	t.exit().remove();
	t.style("fill",colorF)
		.style("stroke","black")
		.attr("x",function(d) { return self.x(d.x); })
		.attr("y",function(d) { return self.y(d.y); })
		.attr("width", self.x(1))
		.attr("height", Math.abs(self.y(0)-self.y(1)));
}


var g = 9.8 / 1000;
var H = 1;
var rho = 1.0 * 1000 * (1000 * 1000);
var tx = 0.1 / 1000;
var ty = 0.1 / 1000;
var L = 1000;
var sigma = 100;

function World(f, dx, dy, dt) {
	var self = this;
	self.dt = dt;
	self.dx = dx;
	self.dy = dy;
	self.f = f;
	self.width = (L / dx) | 0;
	self.height = (L / dy) | 0;
	self.zs = makeField(self.width, self.height);
	self.us = makeField(self.width, self.height);
	self.vs = makeField(self.width, self.height);
	for (var x = 0; x < self.width; x++) {
		for (var y = 0; y < self.height; y++) {
			var px = x * dx - (L / 2);
			var py = y * dy - (L / 2);
			self.zs[x][y] = Math.exp(-px * px / (2 * sigma * sigma) - py * py / (2 * sigma * sigma));
		}
	}
	self.step = 0;
}
World.prototype.swap = function(zs, us, vs) {
	var self = this;
	self.lzs = self.zs;
	self.lus = self.us;
	self.lvs = self.vs;
	self.zs = zs;
	self.us = us;
	self.vs = vs;
}
World.prototype.getZ = function(x, y) {
	var self = this;
	/*
	if (x < 0) {
		x = 0;
	} else if (x >= self.width) {
		x = self.width - 1;
	}
	if (y < 0) {
		y = 0;
	} else if (y >= self.height) {
		y = self.height - 1;
	}*/
	x += self.width;
	x %= self.width;
	y += self.height;
	y %= self.height;
	return self.zs[x][y];
};
World.prototype.getLZ = function(x, y) {
	var self = this;
	/*
	if (x < 0) {
		x = 0;
	} else if (x >= self.width) {
		x = self.width - 1;
	}
	if (y < 0) {
		y = 0;
	} else if (y >= self.height) {
		y = self.height - 1;
	}*/
	x += self.width;
	x %= self.width;
	y += self.height;
	y %= self.height;
	return self.lzs[x][y];
};
World.prototype.getU = function(x, y) {
	var self = this;
	x += self.width;
	x %= self.width;
	y += self.height;
	y %= self.height;
	return self.us[x][y];
	/*
	if (x < 0 || y < 0 || x >= self.width || y >= self.height) {
		return 0;
	} else {
		return self.us[x][y];
	}*/
};
World.prototype.getV = function(x, y) {
	var self = this;
	x += self.width;
	x %= self.width;
	y += self.height;
	y %= self.height;
	return self.vs[x][y];
	if (x < 0 || y < 0 || x >= self.width || y >= self.height) {
		return 0;
	} else {
		return self.vs[x][y];
	}
};
World.prototype.getLU = function(x, y) {
	var self = this;
	x += self.width;
	x %= self.width;
	y += self.height;
	y %= self.height;
	return self.lus[x][y];
	if (x < 0 || y < 0 || x >= self.width || y >= self.height) {
		return 0;
	} else {
		return self.lus[x][y];
	}
};
World.prototype.getLV = function(x, y) {
	var self = this;
	x += self.width;
	x %= self.width;
	y += self.height;
	y %= self.height;
	return self.lvs[x][y];
	if (x < 0 || y < 0 || x >= self.width || y >= self.height) {
		return 0;
	} else {
		return self.lvs[x][y];
	}
};
World.prototype.next = function() {
	var self = this;
	if (self.step == 0) {
		self.first();
	} else {
		self.leap();
	}
	self.step++;
};

World.prototype.first = function() {
	var self = this;
	var dt = self.dt;
	var dx = self.dx;
	var dy = self.dy;
	var f = self.f;
	var zs = makeField(self.width, self.height);
	var us = makeField(self.width, self.height);
	var vs = makeField(self.width, self.height);
	for (var x = 0; x < self.width; x++) {
		for (var y = 0; y < self.height; y++) {
			var v = self.getV(x, y);
			var u = self.getU(x, y);
			var dzx = (self.getZ(x + 1, y) - self.getZ(x - 1, y)) / (2 * dx);
			var dzy = (self.getZ(x, y + 1) - self.getZ(x, y - 1)) / (2 * dy);
			us[x][y] = self.getU(x, y) + dt * (f * v - g * dzx + tx / (rho * H));
			vs[x][y] = self.getV(x, y) + dt * (-f * u - g * dzy + ty / (rho * H));
			var diffX = (self.getU(x + 1, y) - self.getU(x - 1, y)) / (2 * dx);
			var diffY = (self.getV(x, y + 1) - self.getV(x, y - 1)) / (2 * dy);
			zs[x][y] = self.getZ(x, y) + dt * (-H) * (diffX + diffY);
		}
	}
	self.swap(zs, us, vs);
};

World.prototype.leap = function() {
	var self = this;
	var dt = self.dt;
	var dx = self.dx;
	var dy = self.dy;
	var f = self.f;
	var zs = makeField(self.width, self.height);
	var us = makeField(self.width, self.height);
	var vs = makeField(self.width, self.height);
	for (var x = 0; x < self.width; x++) {
		for (var y = 0; y < self.height; y++) {
			var v = self.getV(x, y);
			var u = self.getU(x, y);
			var dzx = (self.getZ(x + 1, y) - self.getZ(x - 1, y)) / (2 * dx);
			var dzy = (self.getZ(x, y + 1) - self.getZ(x, y - 1)) / (2 * dy);
			us[x][y] = self.getLU(x, y) + dt * 2 * (f * v - g * dzx + tx / (rho * H));
			vs[x][y] = self.getLV(x, y) + dt * 2 * (-f * u - g * dzy + ty / (rho * H));

			var diffX = (self.getU(x + 1, y) - self.getU(x - 1, y)) / (2 * dx);
			var diffY = (self.getV(x, y + 1) - self.getV(x, y - 1)) / (2 * dy);
			zs[x][y] = self.getLZ(x, y) + dt * 2 * (-H) * (diffX + diffY);
		}
	}
	self.swap(zs, us, vs);
};

var makeField = function(x, y) {
	var min = 0;
	var f = [];
	for (var i = 0; i < x; i++) {
		var vs = Array(y);
		for (var j = 0; j < y; j++) {
			vs[j] = min;
		}
		f.push(vs);
	}
	return f;
};

var copyField = function(orig) {
	var f = Array(orig.length);
	for (var i = 0; i < orig.length; i++) {
		var o = orig[i];
		var vs = Array(o.length);
		for (var j = 0; j < o.length; j++) {
			vs[j] = o[j];
		}
		f[i] = (vs);
	}
	return f;
};


function main(){
	var dx=50,dy=50,dt=10;
	var world = new World(0,dx,dy,dt);
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
