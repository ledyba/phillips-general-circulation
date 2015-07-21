var Vector = (function () {
    function Vector(len, value) {
        this.length = len;
        if (value != null) {
            this.values = value.slice(0);
        }
        else {
            this.values = new Array(len);
            for (var k = 0; k < len; k++) {
                this.values[k] = 0;
            }
        }
    }
    Vector.prototype.addeq = function (other) {
        if (other.length != this.length) {
            throw "Invalid op: " + other.length + "!=" + this.length;
        }
        numeric.addeq(this.values, other.values);
        return this;
    };
    Vector.prototype.subeq = function (other) {
        if (other.length != this.length) {
            throw "Invalid op: " + other.length + "!=" + this.length;
        }
        numeric.subeq(this.values, other.values);
        return this;
    };
    Vector.prototype.add = function (other) {
        if (other.length != this.length) {
            throw "Invalid op: " + other.length + "!=" + this.length;
        }
        return new Vector(this.length, numeric.add(this.values, other.values));
    };
    Vector.prototype.sub = function (other) {
        if (other.length != this.length) {
            throw "Invalid op: " + other.length + "!=" + this.length;
        }
        return new Vector(this.length, numeric.sub(this.values, other.values));
    };
    Vector.prototype.muleq = function (f) {
        for (var i = 0; i < this.length; i++) {
            this.values[i] *= f;
        }
        return this;
    };
    Vector.prototype.diveq = function (f) {
        for (var i = 0; i < this.length; i++) {
            this.values[i] /= f;
        }
        return this;
    };
    Vector.prototype.mul = function (f) {
        return new Vector(this.length, numeric.mul(f, this.values));
    };
    Vector.prototype.div = function (f) {
        return new Vector(this.length, numeric.mul(1.0 / f, this.values));
    };
    Vector.prototype.swap = function (other) {
        if (other.length != this.length) {
            throw "Invalid op: " + other.length + "!=" + this.length;
        }
        var t = this.values;
        this.values = other.values;
        other.values = t;
        return this;
    };
    Vector.prototype.dot = function (other) {
        if (other.length != this.length) {
            throw "Invalid op: " + other.length + "!=" + this.length;
        }
        return numeric.dot(this.values, other.values);
    };
    Vector.prototype.toString = function (sepat) {
        if (!sepat) {
            sepat = 0;
        }
        var line = "{{";
        for (var i = 0; i < this.length; i++) {
            if (i > 0) {
                if (sepat > 0 && i % sepat == 0) {
                    line += "},\n{";
                }
                else {
                    line += "},{";
                }
            }
            line += this.values[i].toFixed(3);
        }
        return line + "}}";
    };
    Vector.prototype.norm = function () {
        return numeric.norm2(this.values);
    };
    return Vector;
})();
var MatLU = (function () {
    function MatLU(width, height, value) {
        this.width = width;
        this.height = height;
        this.values = value;
    }
    MatLU.prototype.solve = function (v) {
        if (this.height < this.width) {
            throw "Invalid size, too short: " + this.width + "x" + this.height;
        }
        else if (v.length != this.height) {
            throw "Invalid size: " + this.width + "x" + this.height + " vs " + v.length;
        }
        return new Vector(v.length, numeric.LUsolve(this.values, v.values));
    };
    return MatLU;
})();
var Mat = (function () {
    function Mat(width, height, empty) {
        this.width = width;
        this.height = height;
        if (!empty) {
            this.values = new Array(height);
            for (var y = 0; y < height; y++) {
                this.values[y] = new Array(width);
                for (var x = 0; x < width; x++) {
                    this.values[y][x] = 0;
                }
            }
        }
    }
    Mat.ident = function (len, alpha) {
        var m = new Mat(len, len);
        var vs = numeric.identity(len);
        if (alpha != null) {
            vs = numeric.mul(alpha, vs);
        }
        m.values = vs;
        return m;
    };
    Mat.laplace1d = function (len, neumann) {
        var m = new Mat(len, len, true);
        var vs = numeric.identity(len);
        vs[0][1] = 1;
        vs[0][0] = -1;
        for (var i = 1; i < len - 1; i++) {
            vs[i][i - 1] = 1;
            vs[i][i + 1] = 1;
            vs[i][i] = -2;
        }
        if (neumann) {
            vs[len - 1][len - 1] = 1;
        }
        else {
            vs[len - 1][len - 1] = -1;
            vs[len - 1][len - 2] = +1;
        }
        m.values = vs;
        return m;
    };
    Mat.prototype.get = function (x, y) {
        return this.values[y][x];
    };
    Mat.prototype.set = function (x, y, v) {
        this.values[y][x] = v;
        if (isNaN(v) || !isFinite(v)) {
            throw "oops. result is nan or inf: " + v.toString();
        }
        return v;
    };
    Mat.prototype.add = function (x, y, v) {
        this.values[y][x] += v;
        if (isNaN(v) || !isFinite(v)) {
            throw "oops. result is nan or inf: " + v.toString();
        }
        return v;
    };
    Mat.prototype.muleq = function (f) {
        this.values = numeric.mul(f, this.values);
        return this;
    };
    Mat.prototype.mul = function (f) {
        var m = new Mat(this.width, this.height, true);
        m.values = numeric.mul(f, this.values);
        return m;
    };
    Mat.prototype.dotV = function (v) {
        if (this.width != v.length) {
            throw "Invalid size: " + this.width + "x" + this.height + " vs " + v.length;
        }
        return new Vector(this.height, numeric.dot(this.values, v.values));
    };
    Mat.prototype.addeq = function (m) {
        if (this.height != m.height || this.width != m.width) {
            throw "Invalid size: " + this.width + "x" + this.height + " vs " + m.width + "x" + m.height;
        }
        numeric.addeq(this.values, m.values);
        return this;
    };
    Mat.prototype.toString = function () {
        var r = "{";
        for (var y = 0; y < this.height; y++) {
            if (y > 0) {
                r += ",\n";
            }
            var line = "{";
            for (var x = 0; x < this.width; x++) {
                if (x > 0) {
                    line += ",";
                }
                line += this.get(x, y).toFixed(3);
            }
            r += line + "}";
        }
        return r + "}";
    };
    Mat.prototype.solve = function (v) {
        if (this.height < this.width) {
            throw "Invalid size, too short: " + this.width + "x" + this.height;
        }
        if (v.length != this.height) {
            throw "Invalid size: " + this.width + "x" + this.height + " vs " + v.length;
        }
        var ans = numeric.solve(this.values, v.values);
        var vec = new Vector(v.length, ans);
        return vec;
    };
    Mat.prototype.LU = function () {
        return new MatLU(this.width, this.height, numeric.LU(this.values));
    };
    Mat.prototype.eig = function () {
        return numeric.eig(this.values);
    };
    return Mat;
})();
var EarchRunner = (function () {
    function EarchRunner() {
        this.earth = new Model.Earth();
        this.time = 0;
        this.stepCnt = 0;
        this.xranges = Array(Model.W);
        this.yranges = Array(Model.H);
        this.zranges = Array();
        this.width = Model.W * 20;
        this.height = Model.H * 30;
        this.x = d3.scale.linear().range([0, this.width]).domain([0, Model.W]);
        this.y = d3.scale.linear().range([this.height, 0]).domain([0, Model.H]);
        this.colours = d3.scale.linear().domain([-50, 0, 50]).range(["blue", "white", "red"]);
        this.budget = new Array();
        this.ranges = [];
        for (var x = 0; x < Model.W; x++) {
            for (var y = 0; y < Model.H; y++) {
                this.ranges.push({ x: x, y: y });
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
    EarchRunner.prototype.step = function () {
        var stepsBy10Day = ((24 * 3600 * 10 / Model.dt) | 0);
        if (this.stepCnt >= ((24 * 3600 * 200 / Model.dt) | 0)) {
            var last = this.budget[this.budget.length - 1];
            last.addeq(this.earth.calcEnergyBudget());
            if (this.stepCnt % stepsBy10Day == 0) {
                this.budget[this.budget.length - 1] = last.average();
                console.log(this.budget[this.budget.length - 1]);
                this.budget.push(new Model.EnergyBudget());
            }
        }
        var step = (24 * 3600 * 130 / Model.dt) | 0;
        if (this.stepCnt == step) {
            console.log(this.earth.calcEnergyBudget());
            this.earth.step(true);
        }
        else {
            this.earth.step();
        }
        this.stepCnt++;
        this.time = this.stepCnt * Model.dt;
    };
    EarchRunner.prototype.inspectU1 = function () {
        var elem = document.getElementById("inspect_avg_u1");
        elem.innerHTML = '';
        for (var i = this.earth.xspeed1Avg.length - 1; i >= 0; i--) {
            var l = document.createElement("li");
            l.innerText = this.earth.xspeed1Avg[i].toString();
            elem.appendChild(l);
        }
    };
    EarchRunner.prototype.inspectV1 = function () {
        var elem = document.getElementById("inspect_avg_v1");
        elem.innerHTML = '';
        for (var i = this.earth.yspeedAvg.length - 1; i >= 0; i--) {
            var l = document.createElement("li");
            var v = this.earth.yspeedAvg[i] * 1000;
            l.innerText = v.toString();
            elem.appendChild(l);
        }
    };
    EarchRunner.prototype.inspectU4 = function () {
        var elem = document.getElementById("inspect_avg_u4");
        elem.innerHTML = '';
        for (var i = this.earth.xspeed1Avg.length - 1; i >= 0; i--) {
            var l = document.createElement("li");
            var u1 = this.earth.xspeed1Avg[i];
            var u3 = this.earth.xspeed3Avg[i];
            var u4 = u3 * 3 / 2 - u1 / 2;
            l.innerText = u4.toString();
            elem.appendChild(l);
        }
    };
    EarchRunner.prototype.inspectT2 = function () {
        var elem = document.getElementById("inspect_avg_t2");
        elem.innerHTML = '';
        for (var i = this.earth.tempAvg.length - 1; i >= 0; i--) {
            var l = document.createElement("li");
            l.innerText = this.earth.tempAvg[i].toString();
            elem.appendChild(l);
        }
    };
    EarchRunner.prototype.inspectBudget = function () {
        var days = this.time / (24 * 3600);
        if (days >= 3200 && this.budget != null) {
            var avg = new Model.EnergyBudget();
            for (var i = 0; i < this.budget.length; i++) {
                avg.addeq(this.budget[i]);
            }
            console.log(avg.average());
            this.budget = null;
        }
    };
    EarchRunner.prototype.anime = function () {
        this.earth.calcDisplay();
        this.inspectU1();
        this.inspectU4();
        this.inspectV1();
        this.inspectT2();
        this.inspectBudget();
        var time = document.getElementById("time");
        time.innerText = (this.time / (24 * 3600)).toFixed(3) + " Days";
        var svg = d3.select("#graph");
        var t = svg.selectAll("rect").data(this.ranges);
        t.enter().append("rect");
        t.exit().remove();
        var earth = this.earth;
        var x = this.x;
        var y = this.y;
        var colours = this.colours;
        t.style("fill", function (d) { return colours(earth.temp[d.y][d.x]); })
            .attr("x", function (d) { return x(d.x); })
            .attr("y", function (d) { return y(d.y + 1); })
            .attr("width", x(1))
            .attr("height", Math.abs(y(0) - y(1)));
        function makeRange(from, to, cnt) {
            var ranges = new Array(cnt - 1);
            for (var k = 1; k < cnt; k++) {
                ranges[k - 1] = (to - from) * k / cnt + from;
            }
            return ranges;
        }
        function minmax(rs) {
            var min = rs[0][0];
            var max = rs[0][0];
            for (var i = 0; i < rs.length; i++) {
                for (var j = 0; j < rs[i].length; j++) {
                    var v = rs[i][j];
                    if (v < min) {
                        min = v;
                    }
                    if (v > max) {
                        max = v;
                    }
                }
            }
            return { min: min, max: max };
        }
        try {
            var r = minmax(this.earth.height);
            var zranges = makeRange(r.min, r.max, 10);
            var conrec = new Conrec();
            conrec.contour(this.earth.height, 0, this.yranges.length - 1, 0, this.xranges.length - 1, this.yranges, this.xranges, zranges.length, zranges);
            var lst = conrec.contourList();
            var paths = svg.selectAll("path").data(lst);
            paths.enter().append("path");
            paths.exit().remove();
            var ccolors = d3.scale.linear().domain([r.min, (r.min + r.max) / 2, r.max]).range(["lime", "black", "orange"]);
            paths
                .style("stroke", function (d) { return ccolors(d.level); })
                .style("fill", "none")
                .attr("d", d3.svg.line()
                .x(function (d) { return x(d.y + 0.5); })
                .y(function (d) { return y(d.x + 0.5); }));
        }
        catch (e) {
            console.log(e);
        }
    };
    return EarchRunner;
})();
function main() {
    var id;
    var r;
    var step = function () {
        var day = (r.time / (24 * 3600)) | 0;
        var stepPerAnim = 12;
        if (day < 130) {
            stepPerAnim = 48;
        }
        else if (day > 200) {
        }
        for (var k = 0; k < stepPerAnim; k++) {
            r.step();
        }
        day = (r.time / (24 * 3600)) | 0;
        if (day == 130) {
            stop();
        }
        r.anime();
    };
    var stop = function () {
        clearInterval(id);
        id = null;
    };
    var start = function () {
        id = window.setInterval(step, 100);
    };
    window.onload = function (ev) {
        r = new EarchRunner();
        var gr = document.getElementById("graph");
        gr.onclick = function () {
            if (id) {
                stop();
            }
            else {
                start();
            }
        };
    };
}
;
var Model;
(function (Model) {
    Model.dx = 375 * 1000;
    Model.dy = 625 * 1000;
    Model.W = 16;
    Model.H = 15;
    var lambdaSq = 1.5 * (1e-12);
    Model.dt = 24 * 3600 / 24;
    var A = 1e5;
    var k = 4e-6;
    var H0 = 2 * (1e-3);
    var f0 = 1e-4;
    var R = 287;
    var Cp = 1004;
    var beta = 1.6 * (1e-11);
    var g = 9.8 / 1000;
    var NOISE = 2.8e6;
    function idx(x, y) {
        return y * Model.W + x;
    }
    Model.idx = idx;
    function setUpLaplaceMat1d(len, alpha, beta) {
        if (beta == null) {
            return Mat.laplace1d(len, true).muleq(alpha);
        }
        else {
            return Mat.laplace1d(len, false).muleq(alpha).addeq(Mat.ident(len, beta));
        }
    }
    function setUpLaplaceMat2d(w, h, alpha, beta) {
        var len = w * h;
        var m = new Mat(len, len);
        function idx(x, y) {
            return (y * w) + x;
        }
        for (var x = 0; x < w; x++) {
            for (var y = 0; y < h; y++) {
                m.add(idx((x - 1 + Model.W) % Model.W, y), idx(x, y), +1 / (Model.dx * Model.dx));
                m.add(idx(x, y), idx(x, y), -2 / (Model.dx * Model.dx));
                m.add(idx((x + 1 + Model.W) % Model.W, y), idx(x, y), +1 / (Model.dx * Model.dx));
                if (y <= 0) {
                    m.add(idx(x, y), idx(x, y), -1 / (Model.dy * Model.dy));
                    m.add(idx(x, y + 1), idx(x, y), +1 / (Model.dy * Model.dy));
                }
                else if (y >= (h - 1)) {
                    m.add(idx(x, y - 1), idx(x, y), +1 / (Model.dy * Model.dy));
                    m.add(idx(x, y), idx(x, y), -1 / (Model.dy * Model.dy));
                }
                else {
                    m.add(idx(x, y - 1), idx(x, y), +1 / (Model.dy * Model.dy));
                    m.add(idx(x, y), idx(x, y), -2 / (Model.dy * Model.dy));
                    m.add(idx(x, y + 1), idx(x, y), +1 / (Model.dy * Model.dy));
                }
            }
        }
        return m.muleq(alpha).addeq(Mat.ident(w * h, beta));
    }
    var matForPsiPlusAvg = setUpLaplaceMat1d(Model.H, 1 / (Model.dy * Model.dy));
    var matForPsiMinusAvg = setUpLaplaceMat1d(Model.H, 1 / (Model.dy * Model.dy), -2 * lambdaSq);
    var matForPsiPlusDeltaLU = setUpLaplaceMat2d(Model.W, Model.H, 1, 0).LU();
    var matForPsiMinusDeltaLU = setUpLaplaceMat2d(Model.W, Model.H, 1, -2 * lambdaSq).LU();
    var betaSurface = setUpBetaSurface();
    var sunEffect = setUpSunEffect();
    var matForChi1Avg = setUpLaplaceMat1d(Model.H, -(A * Model.dt) / (Model.dy * Model.dy), +1);
    var matForChi3Avg = setUpLaplaceMat1d(Model.H, -(A * Model.dt) / (Model.dy * Model.dy), +1 + (3 * k * Model.dt / 2));
    var matForChi1DeltaLU = setUpLaplaceMat2d(Model.W, Model.H, -(A * Model.dt), +1).LU();
    var matForChi3DeltaLU = setUpLaplaceMat2d(Model.W, Model.H, -(A * Model.dt), +1 + (3 * k * Model.dt / 2)).LU();
    function setUpBetaSurface() {
        var m = new Vector(Model.W * Model.H);
        var cy = (Model.H - 1) / 2;
        for (var y = 0; y < Model.H; y++) {
            var v = (y - cy) * Model.dy * beta;
            for (var x = 0; x < Model.W; x++) {
                var i = idx(x, y);
                m.values[i] = v;
            }
        }
        return m;
    }
    function setUpSunEffect() {
        var m = new Vector(Model.W * Model.H);
        var cy = (Model.H - 1) / 2;
        var alpha = 4 * R * H0 * lambdaSq * Model.dt / (f0 * Cp * (Model.H + 1) / 2);
        for (var y = 0; y < Model.H; y++) {
            var v = (y - cy) * alpha;
            for (var x = 0; x < Model.W; x++) {
                var i = idx(x, y);
                m.values[i] = v;
            }
        }
        return m;
    }
    var sunEffectForOmega2 = setUpSunEffectForOmega2();
    function setUpSunEffectForOmega2() {
        var m = new Vector(Model.W * Model.H);
        var cy = (Model.H - 1) / 2;
        var alpha = 2 * R * H0 / (f0 * Cp * (Model.H + 1) / 2);
        for (var y = 0; y < Model.H; y++) {
            var v = (y - cy) * alpha;
            for (var x = 0; x < Model.W; x++) {
                var i = idx(x, y);
                m.values[i] = v;
            }
        }
        return m;
    }
    function jacob(v, w, vavg, wavg) {
        var _j1 = j1(v, w, vavg, wavg);
        var _j2 = j2(v, w, vavg, wavg);
        var _j3 = j3(v, w, vavg, wavg);
        var tot = _j1.addeq(_j2).addeq(_j3);
        return tot.muleq(1 / 3);
    }
    function j1(v, w, vavg, wavg) {
        var ans = new Vector(v.length);
        for (var x = 0; x < Model.W; x++) {
            for (var y = 0; y < Model.H; y++) {
                var dvx, dvy, dwx, dwy;
                dvx = v.values[idx((x + 1) % Model.W, y)] - v.values[idx((x - 1 + Model.W) % Model.W, y)];
                dwx = w.values[idx((x + 1) % Model.W, y)] - w.values[idx((x - 1 + Model.W) % Model.W, y)];
                if ((y - 1) < 0) {
                    dvy = v.values[idx(x, y + 1)] - vavg.values[0];
                    dwy = w.values[idx(x, y + 1)] - wavg.values[0];
                }
                else if ((y + 1) >= Model.H) {
                    dvy = vavg.values[Model.H - 1] - v.values[idx(x, y - 1)];
                    dwy = wavg.values[Model.H - 1] - w.values[idx(x, y - 1)];
                }
                else {
                    dvy = v.values[idx(x, y + 1)] - v.values[idx(x, y - 1)];
                    dwy = w.values[idx(x, y + 1)] - w.values[idx(x, y - 1)];
                }
                var j = (dvx * dwy - dvy * dwx) / (4 * Model.dx * Model.dy);
                if (isNaN(j)) {
                    throw "";
                }
                ans.values[idx(x, y)] = j;
            }
        }
        return ans;
    }
    function j2(r, s, ravg, savg) {
        var ans = new Vector(r.length);
        for (var x = 0; x < Model.W; x++) {
            for (var y = 0; y < Model.H; y++) {
                var dsx1, dsx2, dsy1, dsy2;
                var drx1, drx2, dry1, dry2;
                dsx1 = s.values[idx((x + 1 + Model.W) % Model.W, y)];
                dsx2 = s.values[idx((x - 1 + Model.W) % Model.W, y)];
                if ((y - 1) < 0) {
                    dsy1 = s.values[idx(x, y + 1)];
                    dsy2 = savg.values[0];
                    drx1 = r.values[idx((x + 1 + Model.W) % Model.W, y + 1)] - r.values[idx((x - 1 + Model.W) % Model.W, y + 1)];
                    drx2 = ravg.values[0] - ravg.values[0];
                    dry1 = r.values[idx((x + 1 + Model.W) % Model.W, y + 1)] - ravg.values[0];
                    dry2 = r.values[idx((x - 1 + Model.W) % Model.W, y + 1)] - ravg.values[0];
                }
                else if ((y + 1) >= Model.H) {
                    dsy1 = savg.values[Model.H - 1];
                    dsy2 = s.values[idx(x, y - 1)];
                    drx1 = ravg.values[Model.H - 1] - ravg.values[Model.H - 1];
                    drx2 = r.values[idx((x + 1 + Model.W) % Model.W, y - 1)] - r.values[idx((x - 1 + Model.W) % Model.W, y - 1)];
                    dry1 = ravg.values[Model.H - 1] - r.values[idx((x + 1 + Model.W) % Model.W, y - 1)];
                    dry2 = ravg.values[Model.H - 1] - r.values[idx((x - 1 + Model.W) % Model.W, y - 1)];
                }
                else {
                    dsy1 = s.values[idx(x, y + 1)];
                    dsy2 = s.values[idx(x, y - 1)];
                    drx1 = r.values[idx((x + 1 + Model.W) % Model.W, y + 1)] - r.values[idx((x - 1 + Model.W) % Model.W, y + 1)];
                    drx2 = r.values[idx((x + 1 + Model.W) % Model.W, y - 1)] - r.values[idx((x - 1 + Model.W) % Model.W, y - 1)];
                    dry1 = r.values[idx((x + 1 + Model.W) % Model.W, y + 1)] - r.values[idx((x + 1 + Model.W) % Model.W, y - 1)];
                    dry2 = r.values[idx((x - 1 + Model.W) % Model.W, y + 1)] - r.values[idx((x - 1 + Model.W) % Model.W, y - 1)];
                }
                var j = ((dsy1 * drx1 - dsy2 * drx2) - (dsx1 * dry1 - dsx2 * dry2)) / (4 * Model.dx * Model.dy);
                if (isNaN(j)) {
                    throw "";
                }
                ans.values[idx(x, y)] = j;
            }
        }
        return ans;
    }
    function j3(r, s, ravg, savg) {
        var ans = new Vector(r.length);
        for (var x = 0; x < Model.W; x++) {
            for (var y = 0; y < Model.H; y++) {
                var dsx1, dsx2, dsy1, dsy2;
                var drx1, drx2, dry1, dry2;
                drx1 = r.values[idx((x + 1 + Model.W) % Model.W, y)];
                drx2 = r.values[idx((x - 1 + Model.W) % Model.W, y)];
                if ((y - 1) < 0) {
                    dry1 = r.values[idx(x, y + 1)];
                    dry2 = ravg.values[0];
                    dsy1 = s.values[idx((x + 1 + Model.W) % Model.W, y + 1)] - savg.values[0];
                    dsy2 = s.values[idx((x - 1 + Model.W) % Model.W, y + 1)] - savg.values[0];
                    dsx1 = s.values[idx((x + 1 + Model.W) % Model.W, y + 1)] - s.values[idx((x - 1 + Model.W) % Model.W, y + 1)];
                    dsx2 = savg.values[0] - savg.values[0];
                }
                else if ((y + 1) >= Model.H) {
                    dry1 = ravg.values[Model.H - 1];
                    dry2 = r.values[idx(x, y - 1)];
                    dsy1 = savg.values[Model.H - 1] - s.values[idx((x + 1 + Model.W) % Model.W, y - 1)];
                    dsy2 = savg.values[Model.H - 1] - s.values[idx((x - 1 + Model.W) % Model.W, y - 1)];
                    dsx1 = savg.values[Model.H - 1] - savg.values[Model.H - 1];
                    dsx2 = s.values[idx((x + 1 + Model.W) % Model.W, y - 1)] - s.values[idx((x - 1 + Model.W) % Model.W, y - 1)];
                }
                else {
                    dry1 = r.values[idx(x, y + 1)];
                    dry2 = r.values[idx(x, y - 1)];
                    dsy1 = s.values[idx((x + 1 + Model.W) % Model.W, y + 1)] - s.values[idx((x + 1 + Model.W) % Model.W, y - 1)];
                    dsy2 = s.values[idx((x - 1 + Model.W) % Model.W, y + 1)] - s.values[idx((x - 1 + Model.W) % Model.W, y - 1)];
                    dsx1 = s.values[idx((x + 1 + Model.W) % Model.W, y + 1)] - s.values[idx((x - 1 + Model.W) % Model.W, y + 1)];
                    dsx2 = s.values[idx((x + 1 + Model.W) % Model.W, y - 1)] - s.values[idx((x - 1 + Model.W) % Model.W, y - 1)];
                }
                var j = ((drx1 * dsy1 - drx2 * dsy2) - (dry1 * dsx1 - dry2 * dsx2)) / (4 * Model.dx * Model.dy);
                if (isNaN(j)) {
                    throw "";
                }
                ans.values[idx(x, y)] = j;
            }
        }
        return ans;
    }
    function laplace(v, avg) {
        var r = new Vector(v.length);
        for (var x = 0; x < Model.W; x++) {
            for (var y = 0; y < Model.H; y++) {
                var lap = 0;
                lap += (-2 * v.values[idx(x, y)]
                    + v.values[idx((x - 1 + Model.W) % Model.W, y)]
                    + v.values[idx((x + 1 + Model.W) % Model.W, y)]) / (Model.dx * Model.dx);
                if (y <= 0) {
                    lap += (-2 * v.values[idx(x, y)]
                        + avg.values[0]
                        + v.values[idx(x, y + 1)]) / (Model.dy * Model.dy);
                }
                else if (y >= (Model.H - 1)) {
                    lap += (-2 * v.values[idx(x, y)]
                        + avg.values[Model.H - 1]
                        + v.values[idx(x, y - 1)]) / (Model.dy * Model.dy);
                }
                else {
                    lap += (-2 * v.values[idx(x, y)]
                        + v.values[idx(x, y - 1)]
                        + v.values[idx(x, y + 1)]) / (Model.dy * Model.dy);
                }
                r.values[idx(x, y)] = lap;
            }
        }
        return r;
    }
    function average(v) {
        var avg = new Vector(Model.H);
        for (var y = 0; y < Model.H; y++) {
            var tot = 0;
            for (var x = 0; x < Model.W; x++) {
                tot += v.values[idx(x, y)];
            }
            avg.values[y] = tot / Model.W;
        }
        return avg;
    }
    function delta(v, avg) {
        var delta = new Vector(Model.H * Model.W);
        for (var y = 0; y < Model.H; y++) {
            var avgv = avg.values[y];
            for (var x = 0; x < Model.W; x++) {
                delta.values[idx(x, y)] = v.values[idx(x, y)] - avgv;
            }
        }
        return delta;
    }
    var Earth = (function () {
        function Earth() {
            this.q1last = new Vector(Model.H * Model.W);
            this.q3last = new Vector(Model.H * Model.W);
            this.q1 = new Vector(Model.H * Model.W);
            this.q3 = new Vector(Model.H * Model.W);
            this.q1avg = new Vector(Model.H);
            this.q3avg = new Vector(Model.H);
            this.q1delta = new Vector(Model.H * Model.W);
            this.q3delta = new Vector(Model.H * Model.W);
            this.psi1 = new Vector(Model.H * Model.W);
            this.psi3 = new Vector(Model.H * Model.W);
            this.psi1last = new Vector(Model.H * Model.W);
            this.psi3last = new Vector(Model.H * Model.W);
            this.psi1avg = new Vector(Model.H);
            this.psi3avg = new Vector(Model.H);
            this.psi1delta = new Vector(Model.H * Model.W);
            this.psi3delta = new Vector(Model.H * Model.W);
            this.height = new Array(Model.H);
            this.temp = new Array(Model.H);
            this.zeta1 = new Array(Model.H);
            this.zeta3 = new Array(Model.H);
            this.heightAvg = new Array(Model.H);
            this.tempAvg = new Array(Model.H);
            this.xspeed1Avg = new Array(Model.H);
            this.xspeed3Avg = new Array(Model.H);
            this.yspeedAvg = new Array(Model.H);
            this.omega2 = new Vector(Model.H * Model.W);
            this.q1.addeq(sunEffect).muleq(1 / 2);
            this.q3.subeq(sunEffect).muleq(1 / 2);
            this.q1avg.swap(average(this.q1));
            this.q3avg.swap(average(this.q3));
            for (var y = 0; y < Model.H; y++) {
                this.height[y] = new Array(Model.W);
                this.temp[y] = new Array(Model.W);
                this.zeta1[y] = new Array(Model.W);
                this.zeta3[y] = new Array(Model.W);
            }
        }
        Earth.prototype.step = function (noize) {
            this.calcPsi();
            if (noize) {
                this.addNoise();
            }
            this.calcQ();
        };
        Earth.prototype.calcDisplay = function () {
            var psiDelta = this.psi1.sub(this.psi3);
            var psiDeltaAvg = this.psi1avg.sub(this.psi3avg);
            var psiDeltaLast = this.psi1last.sub(this.psi3last);
            this.omega2.swap((psiDelta.sub(psiDeltaLast).diveq(Model.dt)
                .subeq(jacob(this.psi1, this.psi3, this.psi1avg, this.psi3avg))
                .addeq(sunEffectForOmega2)
                .subeq(laplace(psiDelta, psiDeltaAvg).muleq(A))
                .muleq(500 * lambdaSq / f0)));
            var om2 = average(this.omega2);
            var yspd = new Array(Model.H);
            for (var y = 0; y < Model.H; y++) {
                if (y > 0) {
                    yspd[y] = yspd[y - 1] - Model.dy * om2.values[y] / 500;
                }
                else {
                    yspd[y] = -Model.dy * om2.values[0] / 500;
                }
            }
            for (var y = 0; y < Model.H; y++) {
                if (y <= 0) {
                    this.yspeedAvg[y] = yspd[y] / 2;
                }
                else {
                    this.yspeedAvg[y] = (yspd[y] + yspd[y - 1]) / 2;
                }
            }
            var cy = (Model.H - 1) / 2;
            for (var y = 0; y < Model.H; y++) {
                var f = f0 + (y - cy) * Model.dy * beta;
                var tTot = 0;
                var hTot = 0;
                var xsp1Tot = 0;
                var ysp1Tot = 0;
                var xsp3Tot = 0;
                var ysp3Tot = 0;
                for (var x = 0; x < Model.W; x++) {
                    var i = idx(x, y);
                    var deltaPsi = this.psi1.values[i] - this.psi3.values[i];
                    var t = (deltaPsi) * f0 / R;
                    var h = (1.5 * this.psi3.values[i] - 0.5 * this.psi1.values[i]) * f / g;
                    hTot += h;
                    tTot += t;
                    this.temp[y][x] = t;
                    this.height[y][x] = h;
                    if (y > 0 && y < Model.H - 1) {
                        xsp1Tot += -(this.psi1avg.values[y + 1] - this.psi1avg.values[y - 1]) / (2 * Model.dy);
                        xsp3Tot += -(this.psi3avg.values[y + 1] - this.psi3avg.values[y - 1]) / (2 * Model.dy);
                    }
                    else if (y == 0) {
                        xsp1Tot += -(this.psi1avg.values[y + 1] - this.psi1avg.values[y]) / (2 * Model.dy);
                        xsp3Tot += -(this.psi3avg.values[y + 1] - this.psi3avg.values[y]) / (2 * Model.dy);
                    }
                    else {
                        xsp1Tot += -(this.psi1avg.values[y] - this.psi1avg.values[y - 1]) / (2 * Model.dy);
                        xsp3Tot += -(this.psi3avg.values[y] - this.psi3avg.values[y - 1]) / (2 * Model.dy);
                    }
                    this.zeta1[y][x] = this.q1.values[i] - lambdaSq * deltaPsi;
                    this.zeta3[y][x] = this.q3.values[i] + lambdaSq * deltaPsi;
                }
                this.tempAvg[y] = tTot / Model.W;
                this.heightAvg[y] = hTot / Model.W;
                this.xspeed1Avg[y] = xsp1Tot / Model.W;
                this.xspeed3Avg[y] = xsp3Tot / Model.W;
            }
        };
        Earth.prototype.addNoise = function () {
            for (var i = 0; i < Model.W * Model.H; i++) {
                var n1 = NOISE * (Math.random() - 0.5) * 2;
                var n3 = NOISE * (Math.random() - 0.5) * 2;
                this.psi1.values[i] += n1;
                this.psi3.values[i] += n3;
            }
            this.q1.swap(setUpLaplaceMat2d(Model.W, Model.H, 1, -lambdaSq).dotV(this.psi1).addeq(this.psi3.mul(lambdaSq)));
            this.q3.swap(setUpLaplaceMat2d(Model.W, Model.H, 1, -lambdaSq).dotV(this.psi3).addeq(this.psi1.mul(lambdaSq)));
        };
        Earth.prototype.calcChi1 = function () {
            var chi1 = new Vector(Model.W * Model.H);
            chi1.addeq(this.q1last);
            chi1.addeq(jacob(this.q1.add(betaSurface), this.psi1, this.q1avg, this.psi1avg).muleq(2 * Model.dt));
            chi1.addeq(laplace(this.q1last, average(this.q1last)).muleq(A * Model.dt));
            chi1.addeq(sunEffect);
            return chi1;
        };
        Earth.prototype.calcChi3 = function () {
            var chi3 = new Vector(Model.W * Model.H);
            chi3.addeq(this.q3last);
            chi3.addeq(jacob(this.q3.add(betaSurface), this.psi3, this.q3avg, this.psi3avg).muleq(2 * Model.dt));
            chi3.addeq(laplace(this.q3last, average(this.q3last)).muleq(A * Model.dt));
            chi3.subeq(sunEffect);
            chi3.subeq((this.q3last.mul(3 / 2).subeq(this.q1last).subeq(this.psi1last.sub(this.psi3last).muleq(4 * lambdaSq))).muleq(k * Model.dt));
            return chi3;
        };
        Earth.prototype.calcQ = function () {
            var chi1 = this.calcChi1();
            var chi3 = this.calcChi3();
            var chi1avg = average(chi1);
            var chi3avg = average(chi3);
            var chi1delta = delta(chi1, chi1avg);
            var chi3delta = delta(chi3, chi3avg);
            this.q1avg.swap(matForChi1Avg.solve(chi1avg));
            this.q3avg.swap(matForChi3Avg.solve(chi3avg));
            this.q1delta.swap(matForChi1DeltaLU.solve(chi1delta));
            this.q3delta.swap(matForChi3DeltaLU.solve(chi3delta));
            var q1muchOlder = new Vector(Model.W * Model.H);
            var q3muchOlder = new Vector(Model.W * Model.H);
            q1muchOlder.swap(this.q1last);
            q3muchOlder.swap(this.q3last);
            this.q1last.swap(this.q1);
            this.q3last.swap(this.q3);
            for (var y = 0; y < Model.H; y++) {
                var q1avg = this.q1avg.values[y];
                var q3avg = this.q3avg.values[y];
                for (var x = 0; x < Model.W; x++) {
                    var i = idx(x, y);
                    this.q1.values[i] = this.q1delta.values[i] + q1avg;
                    this.q3.values[i] = this.q3delta.values[i] + q3avg;
                }
            }
            var eps = 0.05;
            for (var y = 0; y < Model.H; y++) {
                for (var x = 0; x < Model.W; x++) {
                    var i = idx(x, y);
                    this.q1last.values[i] = this.q1last.values[i] * (1 - 2 * eps) + (q1muchOlder.values[i] + this.q1.values[i]) * eps;
                    this.q3last.values[i] = this.q3last.values[i] * (1 - 2 * eps) + (q3muchOlder.values[i] + this.q3.values[i]) * eps;
                }
            }
        };
        Earth.prototype.calcPsi = function () {
            this.calcPsiAvg();
            this.calcPsiDelta();
            this.psi1last.swap(this.psi1);
            this.psi3last.swap(this.psi3);
            for (var y = 0; y < Model.H; y++) {
                var p1avg = this.psi1avg.values[y];
                var p3avg = this.psi3avg.values[y];
                for (var x = 0; x < Model.W; x++) {
                    var i = idx(x, y);
                    this.psi1.values[i] = this.psi1delta.values[i] + p1avg;
                    this.psi3.values[i] = this.psi3delta.values[i] + p3avg;
                }
            }
        };
        Earth.prototype.calcPsiAvg = function () {
            var qTot = this.q1avg.add(this.q3avg);
            var qSub = this.q1avg.sub(this.q3avg);
            var psiPlus = matForPsiPlusAvg.solve(qTot);
            var psiMinus = matForPsiMinusAvg.solve(qSub);
            for (var y = 0; y < Model.H; y++) {
                this.psi1avg.values[y] = (psiPlus.values[y] + psiMinus.values[y]) / 2;
                this.psi3avg.values[y] = (psiPlus.values[y] - psiMinus.values[y]) / 2;
            }
        };
        Earth.prototype.calcPsiDelta = function () {
            var qTot = this.q1delta.add(this.q3delta);
            var qSub = this.q1delta.sub(this.q3delta);
            var psiPlus = matForPsiPlusDeltaLU.solve(qTot);
            var psiMinus = matForPsiMinusDeltaLU.solve(qSub);
            for (var k = 0; k < Model.H * Model.W; k++) {
                this.psi1delta.values[k] = (psiPlus.values[k] + psiMinus.values[k]) / 2;
                this.psi3delta.values[k] = (psiPlus.values[k] - psiMinus.values[k]) / 2;
            }
        };
        Earth.prototype.calcEnergyBudget = function () {
            var l = 24 * 3600;
            var budget = new EnergyBudget();
            budget.cnt = 1;
            {
                var kdelta = 0;
                for (var y = 0; y < Model.H; y++) {
                    for (var x = 0; x < Model.W; x++) {
                        var i = idx(x, y);
                        if (y < Model.H - 1) {
                            var j = idx(x, y + 1);
                            var a = this.psi1delta.values[j] - this.psi1delta.values[i];
                            var b = this.psi3delta.values[j] - this.psi3delta.values[i];
                            kdelta += (a * a + b * b) / (Model.dy * Model.dy);
                        }
                        else {
                            var a = -this.psi1delta.values[i];
                            var b = -this.psi3delta.values[i];
                            kdelta += (a * a + b * b) / (Model.dy * Model.dy);
                        }
                        {
                            var j = idx((x + 1 + Model.W) % Model.W, y);
                            var a = (this.psi1delta.values[j] - this.psi1delta.values[i]);
                            var b = (this.psi3delta.values[j] - this.psi3delta.values[i]);
                            kdelta += (a * a + b * b) / (Model.dx * Model.dx);
                        }
                    }
                }
                budget.kdelta = kdelta / (2 * Model.H * Model.W);
            }
            {
                var kavg = 0;
                for (var y = 0; y < Model.H - 1; y++) {
                    var t = (this.psi1avg.values[y + 1] - this.psi1avg.values[y]);
                    kavg += t * t;
                    t = (this.psi3avg.values[y + 1] - this.psi3avg.values[y]);
                    kavg += t * t;
                }
                budget.kavg = kavg / (2 * Model.H * Model.dy * Model.dy);
            }
            {
                var pavg = 0;
                for (var y = 0; y < Model.H; y++) {
                    var t = this.psi1avg.values[y] - this.psi3avg.values[y];
                    pavg += t * t;
                }
                budget.pavg = lambdaSq * pavg / (Model.H * 2);
            }
            {
                var pdelta = 0;
                for (var y = 0; y < Model.H; y++) {
                    for (var x = 0; x < Model.W; x++) {
                        var i = idx(x, y);
                        var t = this.psi1delta.values[i] - this.psi3delta.values[i];
                        pdelta += t * t;
                    }
                }
                budget.pdelta = lambdaSq * pdelta / (2 * Model.W * Model.H);
            }
            {
                var qavg2pavg = 0;
                for (var y = 0; y < Model.H; y++) {
                    qavg2pavg += (2 * y - Model.H / Model.H) * (this.psi1avg.values[y] - this.psi3avg.values[y]);
                }
                budget.qavg2pavg = qavg2pavg * (-2 * R * H0 * lambdaSq) / (f0 * Cp * Model.H) * l;
            }
            var omega2avg = average(this.omega2);
            var omega2delta = delta(this.omega2, omega2avg);
            var deltaJabob = jacob(this.psi1delta, this.psi3delta, this.psi1avg, this.psi3avg);
            var deltaJabobAvg = average(deltaJabob);
            {
                var pavg2pdelta = 0;
                for (var y = 0; y < Model.H; y++) {
                    pavg2pdelta += (this.psi1avg.values[y] - this.psi3avg.values[y]) * deltaJabobAvg.values[y];
                }
                budget.pavg2pdelta = pavg2pdelta * (-lambdaSq) / (Model.H) * l;
                var pdelta2kdelta = 0;
                for (var y = 0; y < Model.H; y++) {
                    for (var x = 0; x < Model.W; x++) {
                        var i = idx(x, y);
                        pdelta2kdelta += omega2delta.values[i] * (this.psi1delta.values[i] - this.psi3delta.values[i]);
                    }
                }
                budget.pdelta2kdelta = pdelta2kdelta * (-f0) / (500 * Model.W * Model.H) * l;
            }
            var zero = new Vector(Model.H * Model.W);
            var deltaLaplace1 = laplace(this.psi1delta, zero);
            var deltaLaplace3 = laplace(this.psi3delta, zero);
            {
                var kdelta2kavg = 0;
                for (var y = 0; y < Model.H; y++) {
                    var tot1 = 0;
                    var tot3 = 0;
                    for (var x = 0; x < Model.W; x++) {
                        var i = idx(x, y);
                        var i1 = idx((x + 1 + Model.W) % Model.W, y);
                        var i2 = idx((x - 1 + Model.W) % Model.W, y);
                        tot1 += (this.psi1delta.values[i1] - this.psi1delta.values[i2]) * deltaLaplace1.values[i];
                        tot3 += (this.psi3delta.values[i1] - this.psi3delta.values[i2]) * deltaLaplace3.values[i];
                    }
                    kdelta2kavg += (this.psi1avg.values[Math.max(0, y - 1)] - this.psi1avg.values[Math.min(Model.H - 1, y + 1)]) * tot1;
                    kdelta2kavg += (this.psi3avg.values[Math.max(0, y - 1)] - this.psi3avg.values[Math.min(Model.H - 1, y + 1)]) * tot3;
                }
                budget.kdelta2kavg = kdelta2kavg / (4 * Model.W * Model.H * Model.dx * Model.dy) * l;
            }
            {
                var pavg2kavg = 0;
                for (var y = 0; y < Model.H; y++) {
                    pavg2kavg += omega2avg.values[y] * (this.psi1avg.values[y] - this.psi3avg.values[y]);
                }
                budget.pavg2kavg = -(f0 / 500) * pavg2kavg / Model.H * l;
            }
            var zeta1 = laplace(this.psi1, this.psi1avg);
            var zeta3 = laplace(this.psi3, this.psi3avg);
            var zeta1avg = average(zeta1);
            var zeta3avg = average(zeta3);
            var zeta1delta = delta(zeta1, zeta1avg);
            var zeta3delta = delta(zeta3, zeta3avg);
            {
                var kavg2a = 0;
                for (var y = 0; y < Model.H; y++) {
                    kavg2a += (zeta1avg.values[y] * zeta1avg.values[y]) + (zeta3avg.values[y] * zeta3avg.values[y]);
                }
                budget.kavg2a = A * kavg2a / Model.H * l;
            }
            {
                var kdelta2a = 0;
                for (var y = 0; y < Model.H; y++) {
                    for (var x = 0; x < Model.W; x++) {
                        var i = idx(x, y);
                        kdelta2a += (zeta1.values[i] * zeta1.values[i]) + (zeta3.values[i] * zeta3.values[i]);
                    }
                }
                budget.kdelta2a = A * kdelta2a / (Model.W * Model.H) * l;
            }
            {
                var pavg2a = 0;
                for (var y = 0; y < Model.H; y++) {
                    if (y < Model.H - 1) {
                        var t = (this.psi1avg.values[y + 1] - this.psi3avg.values[y + 1]) - (this.psi1avg.values[y] - this.psi3avg.values[y]);
                        pavg2a += t * t;
                    }
                    else {
                        var t = -(this.psi1avg.values[y] - this.psi3avg.values[y]);
                        pavg2a += t * t;
                    }
                }
                budget.pavg2a = lambdaSq * A * pavg2a / (Model.H * Model.dy * Model.dy) * l;
            }
            {
                var pdelta2a = 0;
                for (var y = 0; y < Model.H; y++) {
                    for (var x = 0; x < Model.W; x++) {
                        var i = idx(x, y);
                        var i1 = idx((x + 1 + Model.W) % Model.W, y);
                        var t = (this.psi1delta.values[i1] - this.psi3delta.values[i1]) - (this.psi1delta.values[i] - this.psi3delta.values[i]);
                        pdelta2a += t * t;
                        var i2 = idx(x, Math.min(Model.H - 1, 1 + y));
                        t = (this.psi1delta.values[i2] - this.psi3delta.values[i2]) - (this.psi1delta.values[i] - this.psi3delta.values[i]);
                        pdelta2a += t * t * ((Model.dx * Model.dx) / (Model.dy * Model.dy));
                    }
                }
                budget.pdelta2a = lambdaSq * A * pdelta2a / (Model.H * Model.dx * Model.dx) * l;
            }
            {
                var kavg2k = 0;
                for (var y = 0; y < Model.H; y++) {
                    kavg2k += (3 / 2 * zeta3avg.values[y] - zeta1avg.values[y] / 2) * this.psi3avg.values[y];
                }
                budget.kavg2k = -k * kavg2k / (Model.H) * l;
            }
            {
                var kdelta2k = 0;
                for (var y = 0; y < Model.H; y++) {
                    for (var x = 0; x < Model.W; x++) {
                        var i = idx(x, y);
                        kdelta2k += (3 / 2 * zeta3delta.values[i] - zeta1delta.values[i] / 2) * this.psi3delta.values[i];
                    }
                }
                budget.kdelta2k = -k * kdelta2k / (Model.H * Model.W) * l;
            }
            return budget;
        };
        return Earth;
    })();
    Model.Earth = Earth;
    var EnergyBudget = (function () {
        function EnergyBudget() {
            this.cnt = 0;
            this.kavg = 0;
            this.kdelta = 0;
            this.pavg = 0;
            this.pdelta = 0;
            this.qavg2pavg = 0;
            this.pavg2pdelta = 0;
            this.pdelta2kdelta = 0;
            this.kdelta2kavg = 0;
            this.pavg2kavg = 0;
            this.kavg2a = 0;
            this.kdelta2a = 0;
            this.pavg2a = 0;
            this.pdelta2a = 0;
            this.kdelta2k = 0;
            this.kavg2k = 0;
        }
        EnergyBudget.prototype.addeq = function (e) {
            this.cnt += e.cnt;
            this.kavg += e.kavg;
            this.kdelta += e.kdelta;
            this.pavg += e.pavg;
            this.pdelta += e.pdelta;
            this.qavg2pavg += e.qavg2pavg;
            this.pavg2pdelta += e.pavg2pdelta;
            this.pdelta2kdelta += e.pdelta2kdelta;
            this.kdelta2kavg += e.kdelta2kavg;
            this.pavg2kavg += e.pavg2kavg;
            this.kavg2a += e.kavg2a;
            this.kdelta2a += e.kdelta2a;
            this.pavg2a += e.pavg2a;
            this.pdelta2a += e.pdelta2a;
            this.kdelta2k += e.kdelta2k;
            this.kavg2k += e.kavg2k;
        };
        EnergyBudget.prototype.average = function () {
            var e = new EnergyBudget;
            var cnt = this.cnt;
            e.cnt = 1;
            e.kavg = this.kavg / cnt;
            e.kdelta = this.kdelta / cnt;
            e.pavg = this.pavg / cnt;
            e.pdelta = this.pdelta / cnt;
            e.qavg2pavg = this.qavg2pavg / cnt;
            e.pavg2pdelta = this.pavg2pdelta / cnt;
            e.pdelta2kdelta = this.pdelta2kdelta / cnt;
            e.kdelta2kavg = this.kdelta2kavg / cnt;
            e.pavg2kavg = this.pavg2kavg / cnt;
            e.kavg2a = this.kavg2a / cnt;
            e.kdelta2a = this.kdelta2a / cnt;
            e.pavg2a = this.pavg2a / cnt;
            e.pdelta2a = this.pdelta2a / cnt;
            e.kdelta2k = this.kdelta2k / cnt;
            e.kavg2k = this.kavg2k / cnt;
            return e;
        };
        return EnergyBudget;
    })();
    Model.EnergyBudget = EnergyBudget;
})(Model || (Model = {}));
