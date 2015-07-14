module Model {

export var dx = 375*1000;
export var dy = 625*1000;

export var W = 16;
export var H = 15;

var lambdaSq = 1.5*(1e-12);
export var dt = 24*3600/24;
var A = 1e5;
var k = 4e-6;

var H0 = 2*(1e-3);
var f0 = 1e-4;
var R = 287;
var Cp = 1004;
var beta = 1.6*(1e-11);
var g = 9.8/1000;

var NOISE=2.8e6;

export function idx(x,y):number{
  return y*W+x;
}

function setUpLaplaceMat1d(len: number, alpha: number, beta?: number):Mat{
  if(beta == null){
    return Mat.laplace1d(len, true).muleq(alpha);
  }else{
    return Mat.laplace1d(len, false).muleq(alpha).addeq(Mat.ident(len,beta));
  }
}
function setUpLaplaceMat2d(w: number, h: number, alpha: number, beta: number):Mat{
  var len = w*h;
  var m = new Mat(len,len);
  function idx(x,y) {
    return (y*w)+x;
  }
  for(var x = 0;x < w;x++){
    for(var y = 0;y < h;y++){
      m.add(idx((x-1+W)%W,y),idx(x,y),+1 / (dx*dx));
      m.add(idx( x       ,y),idx(x,y),-2 / (dx*dx));
      m.add(idx((x+1+W)%W,y),idx(x,y),+1 / (dx*dx));
      if (y <= 0){
        m.add(idx(x,y  ),idx(x,y),-1 / (dy*dy));
        m.add(idx(x,y+1),idx(x,y),+1 / (dy*dy));
      }else if(y >= (h-1)){
        m.add(idx(x,y-1),idx(x,y),+1 / (dy*dy));
        m.add(idx(x,y  ),idx(x,y),-1 / (dy*dy));
      }else{
        m.add(idx(x,y-1),idx(x,y),+1 / (dy*dy));
        m.add(idx(x,y  ),idx(x,y),-2 / (dy*dy));
        m.add(idx(x,y+1),idx(x,y),+1 / (dy*dy));
      }
    }
  }
  return m.muleq(alpha).addeq(Mat.ident(w*h, beta));
}

var matForPsiPlusAvg  = setUpLaplaceMat1d(H,1/(dy*dy));
var matForPsiMinusAvg = setUpLaplaceMat1d(H,1/(dy*dy),-2*lambdaSq);

var matForPsiPlusDeltaLU  = setUpLaplaceMat2d(W,H,1,0).LU();
var matForPsiMinusDeltaLU = setUpLaplaceMat2d(W,H,1,-2*lambdaSq).LU();

var betaSurface = setUpBetaSurface();
var sunEffect   = setUpSunEffect();

var matForChi1Avg = setUpLaplaceMat1d(H,-(A*dt)/(dy*dy),+1);
var matForChi3Avg = setUpLaplaceMat1d(H,-(A*dt)/(dy*dy),+1+(3*k*dt/2));

var matForChi1DeltaLU = setUpLaplaceMat2d(W,H,-(A*dt),+1).LU();
var matForChi3DeltaLU = setUpLaplaceMat2d(W,H,-(A*dt),+1+(3*k*dt/2)).LU();

function setUpBetaSurface():Vector{
  var m = new Vector(W*H);
  var cy = (H-1)/2;
  for(var y = 0;y < H;y++){
    var v = (y-cy)*dy*beta;
    for(var x = 0;x < W;x++){
      var i = idx(x,y);
      m.values[i] = v;
    }
  }
  return m;
}
function setUpSunEffect():Vector{

  var m = new Vector(W*H);
  var alpha = 4 * R * H0 * lambdaSq * dt / (f0 * Cp * ((H+1)/2));
  var cy = (H-1)/2;
  for(var y = 0;y < H;y++){
    var v = (y-cy)*alpha;
    for(var x = 0;x < W;x++){
      var i = idx(x,y);
      m.values[i] = v;
    }
  }

  return m;
}

function jacob(v:Vector, w: Vector, vavg: Vector, wavg: Vector):Vector{
  var _j1 = j1(v,w,vavg,wavg);
  var _j2 = j2(v,w,vavg,wavg);
  var _j3 = j3(v,w,vavg,wavg);
  var tot = _j1.addeq(_j2).addeq(_j3);
  return tot.muleq(1/3);
}
function j1(v:Vector, w: Vector, vavg: Vector, wavg:Vector):Vector{
  var ans = new Vector(v.length);
  for(var x = 0;x < W; x++){
    for(var y = 0;y < H; y++){
      var dvx, dvy, dwx, dwy;
      dvx = v.values[idx((x+1)%W,y)] - v.values[idx((x-1+W)%W,y)];
      dwx = w.values[idx((x+1)%W,y)] - w.values[idx((x-1+W)%W,y)];
      if ((y-1) < 0){
        dvy = v.values[idx(x,y+1)] - vavg.values[0];
        dwy = w.values[idx(x,y+1)] - wavg.values[0];
      }else if((y+1) >= H){
        dvy = vavg.values[H-1] - v.values[idx(x,y-1)];
        dwy = wavg.values[H-1] - w.values[idx(x,y-1)];
      }else{
        dvy = v.values[idx(x,y+1)] - v.values[idx(x,y-1)];
        dwy = w.values[idx(x,y+1)] - w.values[idx(x,y-1)];
      }
      var j = (dvx*dwy - dvy*dwx)/(4*dx*dy);
      if (isNaN(j)){
        throw "";
      }
      ans.values[idx(x,y)] = j;
    }
  }
  return ans;
}
function j2(r:Vector, s: Vector, ravg: Vector, savg:Vector):Vector{
  var ans = new Vector(r.length);
  for(var x = 0;x < W; x++){
    for(var y = 0;y < H; y++){
      var dsx1, dsx2, dsy1, dsy2;
      var drx1, drx2, dry1, dry2;
      dsx1 = s.values[idx((x+1+W)%W,y)];
      dsx2 = s.values[idx((x-1+W)%W,y)];
      if ((y-1) < 0){
        dsy1 = s.values[idx( x,       y+1)];
        dsy2 = savg.values[0];
        drx1 = r.values[idx((x+1+W)%W,y+1)] - r.values[idx((x-1+W)%W,y+1)];
        drx2 = ravg.values[0]               - ravg.values[0];
        dry1 = r.values[idx((x+1+W)%W,y+1)] - ravg.values[0];
        dry2 = r.values[idx((x-1+W)%W,y+1)] - ravg.values[0];
      }else if((y+1) >= H){
        dsy1 = savg.values[H-1];
        dsy2 = s.values[idx( x,       y-1)];
        drx1 = ravg.values[H-1]             - ravg.values[H-1]            ;
        drx2 = r.values[idx((x+1+W)%W,y-1)] - r.values[idx((x-1+W)%W,y-1)];
        dry1 = ravg.values[H-1]             - r.values[idx((x+1+W)%W,y-1)];
        dry2 = ravg.values[H-1]             - r.values[idx((x-1+W)%W,y-1)];
      }else{
        dsy1 = s.values[idx( x,       y+1)];
        dsy2 = s.values[idx( x,       y-1)];
        drx1 = r.values[idx((x+1+W)%W,y+1)] - r.values[idx((x-1+W)%W,y+1)];
        drx2 = r.values[idx((x+1+W)%W,y-1)] - r.values[idx((x-1+W)%W,y-1)];
        dry1 = r.values[idx((x+1+W)%W,y+1)] - r.values[idx((x+1+W)%W,y-1)];
        dry2 = r.values[idx((x-1+W)%W,y+1)] - r.values[idx((x-1+W)%W,y-1)];
      }
      var j = ((dsy1*drx1 - dsy2*drx2)-(dsx1*dry1 - dsx2*dry2))/(4*dx*dy);
      if (isNaN(j)){
        throw "";
      }
      ans.values[idx(x,y)] = j;
    }
  }
  return ans;
}
function j3(r:Vector, s: Vector, ravg: Vector, savg:Vector):Vector{
  var ans = new Vector(r.length);
  for(var x = 0;x < W; x++){
    for(var y = 0;y < H; y++){
      var dsx1, dsx2, dsy1, dsy2;
      var drx1, drx2, dry1, dry2;
      drx1 = r.values[idx((x+1+W)%W,y)];
      drx2 = r.values[idx((x-1+W)%W,y)];
      if ((y-1) < 0){
        dry1 = r.values[idx( x,       y+1)];
        dry2 = ravg.values[0]              ;
        dsy1 = s.values[idx((x+1+W)%W,y+1)] - savg.values[0]              ;
        dsy2 = s.values[idx((x-1+W)%W,y+1)] - savg.values[0]              ;
        dsx1 = s.values[idx((x+1+W)%W,y+1)] - s.values[idx((x-1+W)%W,y+1)];
        dsx2 = savg.values[0]               - savg.values[0]              ;
      }else if((y+1) >= H){
        dry1 = ravg.values[H-1]            ;
        dry2 = r.values[idx( x,       y-1)];
        dsy1 = savg.values[H-1]             - s.values[idx((x+1+W)%W,y-1)];
        dsy2 = savg.values[H-1]             - s.values[idx((x-1+W)%W,y-1)];
        dsx1 = savg.values[H-1]             - savg.values[H-1]            ;
        dsx2 = s.values[idx((x+1+W)%W,y-1)] - s.values[idx((x-1+W)%W,y-1)];
      }else{
        dry1 = r.values[idx( x,       y+1)];
        dry2 = r.values[idx( x,       y-1)];
        dsy1 = s.values[idx((x+1+W)%W,y+1)] - s.values[idx((x+1+W)%W,y-1)];
        dsy2 = s.values[idx((x-1+W)%W,y+1)] - s.values[idx((x-1+W)%W,y-1)];
        dsx1 = s.values[idx((x+1+W)%W,y+1)] - s.values[idx((x-1+W)%W,y+1)];
        dsx2 = s.values[idx((x+1+W)%W,y-1)] - s.values[idx((x-1+W)%W,y-1)];
      }
      var j = ((drx1*dsy1 - drx2*dsy2)-(dry1*dsx1 - dry2*dsx2))/(4*dx*dy);
      if (isNaN(j)){
        throw "";
      }
      ans.values[idx(x,y)] = j;
    }
  }
  return ans;
}
function laplace(v:Vector, avg: Vector):Vector{
  var r = new Vector(v.length);
  for(var x = 0;x < W; x++){
    for(var y = 0;y < H; y++){
      var lap = 0;
      lap += (
         -2 * v.values[idx(x,y)]
            + v.values[idx((x-1+W)%W,y)]
            + v.values[idx((x+1+W)%W,y)]) / (dx*dx);
      if (y <= 0){
        lap += (
           -2 * v.values[idx(x,y)]
              + avg.values[0]
              + v.values[idx(x,y+1)] ) / (dy*dy);
      }else if(y >= (H-1)){
        lap += (
           -2 * v.values[idx(x,y)]
              + avg.values[H-1]
              + v.values[idx(x,y-1)]) / (dy*dy);
      }else{
        lap += (
           -2 * v.values[idx(x,y)]
              + v.values[idx(x,y-1)]
              + v.values[idx(x,y+1)]) / (dy*dy);
      }
      r.values[idx(x,y)] = lap;
    }
  }
  return r;
}
function average(v:Vector):Vector{
  var avg = new Vector(H);
  for(var y = 0;y < H; y++){
    var tot = 0;
    for(var x = 0;x < W; x++){
      tot += v.values[idx(x,y)];
    }
    avg.values[y] = tot/W;
  }
  return avg;
}
function delta(v:Vector, avg:Vector):Vector{
  var delta = new Vector(H*W);
  for(var y = 0;y < H; y++){
    var avgv = avg.values[y];
    for(var x = 0;x < W; x++){
      delta.values[idx(x,y)] = v.values[idx(x,y)]-avgv;
    }
  }
  return delta;
}

export class Earth{
  private q1last  = new Vector(H*W);
  private q3last  = new Vector(H*W);
  private q1      = new Vector(H*W);
  private q3      = new Vector(H*W);
  private q1avg   = new Vector(H);
  private q3avg   = new Vector(H);
  private q1delta = new Vector(H*W);
  private q3delta = new Vector(H*W);

  private psi1      = new Vector(H*W);
  private psi3      = new Vector(H*W);
  private psi1last  = new Vector(H*W);
  private psi3last  = new Vector(H*W);
  private psi1avg   = new Vector(H);
  private psi3avg   = new Vector(H);
  private psi1delta = new Vector(H*W);
  private psi3delta = new Vector(H*W);

  height = new Array<Array<number>>(H);
  temp = new Array<Array<number>>(H);
  xspeed = new Array<Array<number>>(H);
  yspeed = new Array<Array<number>>(H);
  heightAvg = new Array<number>(H);
  tempAvg = new Array<number>(H);
  xspeedAvg = new Array<number>(H);
  yspeedAvg = new Array<number>(H);

  constructor(){
    this.q1.addeq(sunEffect).muleq(1/2);
    this.q3.subeq(sunEffect).muleq(1/2);
    this.q1avg.swap(average(this.q1));
    this.q3avg.swap(average(this.q3));

    for(var y=0;y<H;y++){
      this.height[y] = new Array<number>(W);
      this.temp[y] = new Array<number>(W);
      this.xspeed[y] = new Array<number>(W);
      this.yspeed[y] = new Array<number>(W);
    }

  }

  step(noize?: boolean){
    this.calcPsi();
    if(noize){
      this.addNoise();
    }
    this.calcQ();
    this.calcDisplay();
  }

  private calcDisplay(){
    //var u1 = new Vector(H);
    //var z1 = new Vector(H);
    var cy = (H-1)/2;
    for(var y=0;y<H;y++){
      var f = f0+(y-cy)*dy*beta;
      var tTot = 0;
      var hTot = 0;
      var xspTot = 0;
      var yspTot = 0;
      for(var x=0;x < W;x++){
        var i = idx(x,y);
        var t = (this.psi1.values[i] - this.psi3.values[i]) * f0 / R
        var h = (this.psi3.values[i] - ((this.psi1.values[i] - this.psi3.values[i]) / 2)) * f / g;
        hTot += h;
        tTot += t;
        this.temp[y][x] = t;
        this.height[y][x] = h;
        var u = -(this.psi1avg.values[k+1] - this.psi1avg.values[k-1]) / (2*dy);
        var v =  (this.psi1avg.values[k+1] - this.psi1avg.values[k-1]) / (2*dy);
        this.xspeed[y][x] = u;
        this.yspeed[y][x] = v;
        xspTot += u;
        yspTot += v;
      }
      this.tempAvg[y] = tTot / W;
      this.heightAvg[y] = hTot / W;
      this.xspeedAvg[y] = xspTot / W;
      this.yspeedAvg[y] = yspTot / W;
      //u1.values[k] = -(this.psi1avg.values[k+1] - this.psi1avg.values[k-1]) / (2*dy);
      //z1.values[k] = this.q1avg.values[k] + lambdaSq * (this.psi1avg.values[k] - this.psi3avg.values[k]);
    }
  }

  private addNoise(){
    for(var i = 0; i < W*H; i++){
      var n1 = NOISE * (Math.random()-0.5) * 2;
      var n3 = NOISE * (Math.random()-0.5) * 2;
      this.psi1.values[i] += n1;
      this.psi3.values[i] += n3;
    }
    this.q1.swap(setUpLaplaceMat2d(W,H,1,-lambdaSq).dotV(this.psi1).addeq(this.psi3.mul(lambdaSq)));
    this.q3.swap(setUpLaplaceMat2d(W,H,1,-lambdaSq).dotV(this.psi3).addeq(this.psi1.mul(lambdaSq)));
  }

  calcChi1():Vector{
    var chi1 = new Vector(W*H);
    chi1.addeq(this.q1last);
    chi1.addeq(jacob(this.q1.add(betaSurface),this.psi1, this.q1avg, this.psi1avg).muleq(2*dt));
    chi1.addeq(laplace(this.q1last, average(this.q1last)).muleq(A*dt));
    chi1.addeq(sunEffect);
    return chi1;
  }
  calcChi3():Vector{
    var chi3 = new Vector(W*H);
    chi3.addeq(this.q3last);
    chi3.addeq(jacob(this.q3.add(betaSurface),this.psi3,this.q3avg, this.psi3avg).muleq(2*dt));
    chi3.addeq(laplace(this.q3last, average(this.q3last)).muleq(A*dt));
    chi3.subeq(sunEffect);
    chi3.subeq((this.q3last.mul(3/2).subeq(this.q1last).subeq(this.psi1last.sub(this.psi3last).muleq(4*lambdaSq))).muleq(k*dt));
    return chi3;
  }
  calcQ(){
    var chi1 = this.calcChi1();
    var chi3 = this.calcChi3();

    var chi1avg = average(chi1);
    var chi3avg = average(chi3);
    var chi1delta = delta(chi1,chi1avg);
    var chi3delta = delta(chi3,chi3avg);
    this.q1avg.swap(matForChi1Avg.solve(chi1avg));
    this.q3avg.swap(matForChi3Avg.solve(chi3avg));
    this.q1delta.swap(matForChi1DeltaLU.solve(chi1delta));
    this.q3delta.swap(matForChi3DeltaLU.solve(chi3delta));

    var q1muchOlder = new Vector(W*H);
    var q3muchOlder = new Vector(W*H);
    q1muchOlder.swap(this.q1last);
    q3muchOlder.swap(this.q3last);
    this.q1last.swap(this.q1);
    this.q3last.swap(this.q3);

    for(var y=0;y<H;y++){
      var q1avg = this.q1avg.values[y];
      var q3avg = this.q3avg.values[y];
      for(var x=0;x<W;x++){
        var i = idx(x,y);
        this.q1.values[i]=this.q1delta.values[i]+q1avg;
        this.q3.values[i]=this.q3delta.values[i]+q3avg;
      }
    }
    // merge
    var eps = 0.05;
    for(var y=0;y<H;y++){
      for(var x=0;x<W;x++){
        var i = idx(x,y);
        this.q1last.values[i]= this.q1last.values[i]*(1-2*eps) + (q1muchOlder.values[i] + this.q1.values[i]) * eps;
        this.q3last.values[i]= this.q3last.values[i]*(1-2*eps) + (q3muchOlder.values[i] + this.q3.values[i]) * eps;
      }
    }
  }
  calcPsi(){
    this.calcPsiAvg();
    this.calcPsiDelta();
    this.psi1last.swap(this.psi1);
    this.psi3last.swap(this.psi3);
    for(var y=0;y<H;y++){
      var p1avg = this.psi1avg.values[y];
      var p3avg = this.psi3avg.values[y];
      for(var x=0;x<W;x++){
        var i = idx(x,y);
        this.psi1.values[i]=this.psi1delta.values[i]+p1avg;
        this.psi3.values[i]=this.psi3delta.values[i]+p3avg;
      }
    }
  }
  calcPsiAvg(){
    var qTot = this.q1avg.add(this.q3avg);
    var qSub = this.q1avg.sub(this.q3avg);
    var psiPlus = matForPsiPlusAvg.solve(qTot);
    var psiMinus = matForPsiMinusAvg.solve(qSub);
    for(var y=0;y<H;y++){
      this.psi1avg.values[y] = (psiPlus.values[y]+psiMinus.values[y])/2;
      this.psi3avg.values[y] = (psiPlus.values[y]-psiMinus.values[y])/2;
    }
  }
  calcPsiDelta(){
    var qTot = this.q1delta.add(this.q3delta);
    var qSub = this.q1delta.sub(this.q3delta);
    var psiPlus = matForPsiPlusDeltaLU.solve(qTot);
    var psiMinus = matForPsiMinusDeltaLU.solve(qSub);
    for(var k=0;k<H*W;k++){
      this.psi1delta.values[k] = (psiPlus.values[k]+psiMinus.values[k])/2;
      this.psi3delta.values[k] = (psiPlus.values[k]-psiMinus.values[k])/2;
    }
  }

}

}
