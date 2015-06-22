module Model {

var dx = 375*1000;
var dy = 625*1000;

var W = 15;
var H = 15;
var HEIGHT = 16 * dy;
var lambdaSq = 1.5*(1e-12);
var dt = 24*3600/10;
var A = 1e5;
var k = 4e-6;

var H0 = 2*(1e-3);
var f0 = 1e-4;
var R = 287;
var Cp = 1004;
var beta = 1.6*(1e-11);

function idx(x,y):number{
  return y*W+x;
}

function setUpLaplaceMat1d(len: number, alpha: number, beta?: number):Mat{
  if(beta == null){
    return Mat.laplace1d(len, true).mul(alpha);
  }else{
    return Mat.laplace1d(len, false).mul(alpha).addM(Mat.ident(len,beta));
  }
}
function setUpLaplaceMat2d(w: number, h: number, alpha: number, beta: number):Mat{
  var len = w*h;
  var m = new Mat(len,len);
  function idx(x,y) {
    return (y*w)+x;
  }
  //FIXME: DX/DY
  for(var x = 0;x < w;x++){
    for(var y = 0;y < h;y++){
      m.add(idx((x-1+W)%W,y),idx(x,y),+1);
      m.add(idx(x  ,y),idx(x,y),-2);
      m.add(idx((x+1+W)%W,y),idx(x,y),+1);
      if (y <= 0){
        m.add(idx(x,0),idx(x,y),-1);
        m.add(idx(x,1),idx(x,y),+1);
      }else if(y >= h-1){
        m.add(idx(x,h-2),idx(x,y),-1);
        m.add(idx(x,h-1),idx(x,y),+1);
      }else{
        m.add(idx(x,y-1),idx(x,y),+1);
        m.add(idx(x,y  ),idx(x,y),-2);
        m.add(idx(x,y+1),idx(x,y),+1);
      }
    }
  }
  return m.mul(alpha).addM(Mat.ident(w*h, beta))
}

var matForPsiPlusAvg  = setUpLaplaceMat1d(H,1/(dy*dy));
var matForPsiMinusAvg = setUpLaplaceMat1d(H,1/(dy*dy),-2*lambdaSq);

var matForPsiPlusDelta  = setUpLaplaceMat2d(W,H,1,0);
var matForPsiMinusDelta = setUpLaplaceMat2d(W,H,1,-2*lambdaSq);

var betaSurface = setUpBetaSurface();
var sunEffect   = setUpSunEffect();

var matForChi1Avg = setUpLaplaceMat1d(H,-(A*dt)/(dy*dy),1);
var matForChi3Avg = setUpLaplaceMat1d(H,-(A*dt)/(dy*dy),1+(3*k*dt/2));

var matForChi1Delta = setUpLaplaceMat2d(W,H,-(A*dt),+1);
var matForChi3Delta = setUpLaplaceMat2d(W,H,-(A*dt),+1+(3*k*dt/2));

function setUpBetaSurface():Vector{
  var m = new Vector(W*H);
  for(var y = 0;y < H;y++){
    var v = (y-7)*dy*beta;
    for(var x = 0;x < W;x++){
      var i = idx(x,y);
      m.values[i] = v;
    }
  }
  return m;
}
function setUpSunEffect():Vector{

  var m = new Vector(W*H);
  var alpha = 4 * R * H0 * lambdaSq * dt / (f0 * Cp * HEIGHT/2);
  for(var y = 0;y < H;y++){
    var v = (y-7)*dy*alpha;
    for(var x = 0;x < W;x++){
      var i = idx(x,y);
      m.values[i] = v;
    }
  }

  return m;
}

function vectAdd(v1: Vector, v2: Vector):Vector{
  if(v1.length != v2.length){
    throw "Please use same length vectors";
  }
  var v = new Vector(v1.length);
  for(var k=0;k<v.length;k++){
    v.values[k] = v1.values[k]+v2.values[k];
  }
  return v;
}
function vectSub(v1: Vector, v2: Vector):Vector{
  if(v1.length != v2.length){
    throw "Please use same length vectors";
  }
  var v = new Vector(v1.length);
  for(var k=0;k<v.length;k++){
    v.values[k] = v1.values[k]-v2.values[k];
  }
  return v;
}
function jacob(v:Vector, w: Vector):Vector{
  var r = new Vector(v.length);
  for(var x = 0;x < W; x++){
    for(var y = 0;y < H; y++){
      var dvx, dvy, dwx, dwy;
      dvx = (v.values[idx((x+1)%W,y)] - v.values[idx((x-1+W)%W,y)]) / dx;
      dwx = (w.values[idx((x+1)%W,y)] - w.values[idx((x-1+W)%W,y)]) / dx;
      if (y <= 0){
        dvy = v.values[idx(x,y+1)] / dy;
        dwy = w.values[idx(x,y+1)] / dy;
      }else if(y >= H-1){
        dvy = - v.values[idx(x,y-1)] / dy;
        dwy = - w.values[idx(x,y-1)] / dy;
      }else{
        dvy = (v.values[idx(x,y+1)] - v.values[idx(x,y-1)]) / dy;
        dwy = (w.values[idx(x,y+1)] - w.values[idx(x,y-1)]) / dy;
      }
      r.values[idx(x,y)] = dvx*dwy - dvy*dwx;
    }
  }
  return r;
}
function laplace(v:Vector):Vector{
  var r = new Vector(v.length);
  for(var x = 0;x < W; x++){
    for(var y = 0;y < H; y++){
      if (x <= 0){
        r.values[idx(x,y)] +=(
              + v.values[idx(x,y)] * -1
              + v.values[idx(x+1,y)]) / (dx*dx);
      }else if(x >= W-1){
        r.values[idx(x,y)] += (
              + v.values[idx(x,y)] * -1
              + v.values[idx(x-1,y)]) / (dx*dx);
      }else{
        r.values[idx(x,y)] += (
              + v.values[idx(x,y)] * -2
              + v.values[idx(x-1,y)]
              + v.values[idx(x+1,y)]) / (dx*dx);
      }
      if (y <= 0){
        r.values[idx(x,y)] += (
              + v.values[idx(x,y)] * -1
              + v.values[idx(x,y+1)] ) / (dy*dy);
      }else if(y >= H-1){
        r.values[idx(x,y)] += (
              + v.values[idx(x,y)] * -1
              + v.values[idx(x,y-1)]) / (dy*dy);
      }else{
        r.values[idx(x,y)] += (
              + v.values[idx(x,y)] * -2
              + v.values[idx(x,y-1)]
              + v.values[idx(x,y+1)]) / (dy*dy);
      }
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
    avg.values[y] = tot/H;
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
  q1last  = new Vector(H*W);
  q3last  = new Vector(H*W);
  q1      = new Vector(H*W);
  q3      = new Vector(H*W);
  q1avg   = new Vector(H);
  q3avg   = new Vector(H);
  q1delta = new Vector(H*W);
  q3delta = new Vector(H*W);

  psi1      = new Vector(H*W);
  psi3      = new Vector(H*W);
  psi1last  = new Vector(H*W);
  psi3last  = new Vector(H*W);
  psi1avg   = new Vector(H);
  psi3avg   = new Vector(H);
  psi1delta = new Vector(H*W);
  psi3delta = new Vector(H*W);

  constructor(){
    this.q1.add(sunEffect).mul(1/2);
    this.q3.sub(sunEffect).mul(1/2);
    this.q1avg.copy(average(this.q1));
    this.q3avg.copy(average(this.q3));
  }

  step(){
    this.calcPsi();
    this.calcQ();
  }

  calcChi1():Vector{
    var chi1 = new Vector(W*H);
    chi1.add(this.q1last);
    chi1.add(jacob(this.q1.clone().add(betaSurface),this.psi1).mul(2*dt));
    chi1.add(laplace(this.q1last).mul(A*dt));
    chi1.add(sunEffect);
    return chi1;
  }
  calcChi3():Vector{
    var chi3 = new Vector(W*H);
    chi3.add(this.q3last);
    chi3.add(jacob(this.q3.clone().add(betaSurface),this.psi3).mul(2*dt));
    chi3.add(laplace(this.q3last).mul(A*dt));
    chi3.sub(sunEffect);
    chi3.sub((this.q3last.clone().mul(3/2).sub(this.q1last).sub(this.psi1last.clone().sub(this.psi3last).mul(4*lambdaSq))).mul(k*dt));
    return chi3;
  }
  calcQ(){
    var chi1 = this.calcChi1();
    var chi3 = this.calcChi3();

    var chi1avg = average(chi1);
    var chi3avg = average(chi3);
    this.q1avg.copy(matForChi1Avg.solveByGaussElimination(chi1avg));
    this.q3avg.copy(matForChi3Avg.solveByGaussElimination(chi3avg));
    //this.q1delta.copy(matForChi1Delta.solveByGaussElimination(delta(chi1,chi1avg)));
    //this.q3delta.copy(matForChi3Delta.solveByGaussElimination(delta(chi3,chi3avg)));

    this.q1last.copy(this.q1);
    this.q3last.copy(this.q3);
    for(var y=0;y<H;y++){
      var q1avg = this.q1avg.values[y];
      var q3avg = this.q3avg.values[y];
      for(var x=0;x<W;x++){
        var i = idx(x,y);
        this.q1.values[i]=this.q1delta.values[i]+q1avg;
        this.q3.values[i]=this.q3delta.values[i]+q3avg;
      }
    }
  }
  calcPsi(){
    this.calcPsiAvg();
    this.calcPsiDelta();
    this.psi1last.copy(this.psi1);
    this.psi3last.copy(this.psi3);
    for(var y=0;y<H;y++){
      var p1avg = this.psi1avg.values[y];
      var p3avg = this.psi3avg.values[y];
      for(var x=0;x<W;x++){
        var i = idx(x,y);
        this.psi1.values[i]=this.psi1delta.values[i]+p1avg;
        this.psi3.values[i]=this.psi3delta.values[i]+p3avg;
      }
    }
    var t1 = new Vector(H);
    var u1 = new Vector(H);
    var z1 = new Vector(H);
    for(var k=0;k<H;k++){
      t1.values[k] = (this.psi1avg.values[k] - this.psi3avg.values[k]) * f0 / R;
      u1.values[k] = -(this.psi1avg.values[k+1] - this.psi1avg.values[k-1]) / (2*dy);
      z1.values[k] = this.q1avg.values[k] + lambdaSq * (this.psi1avg.values[k] - this.psi3avg.values[k]);
    }
    console.log("Hmm...");
  }
  calcPsiAvg(){
    var qTot = vectAdd(this.q1avg,this.q3avg);
    var qSub = vectSub(this.q1avg,this.q3avg);
    var psiPlus = matForPsiPlusAvg.solveByGaussElimination(qTot);
    var psiMinus = matForPsiMinusAvg.solveByGaussElimination(qSub);
    for(var k=0;k<H;k++){
      this.psi1avg.values[k] = (psiPlus.values[k]+psiMinus.values[k])/2;
      this.psi3avg.values[k] = (psiPlus.values[k]-psiMinus.values[k])/2;
    }
  }
  calcPsiDelta(){
    var qTot = vectAdd(this.q1delta,this.q3delta);
    var qSub = vectSub(this.q1delta,this.q3delta);
    var psiPlus = new Vector(qTot.length);//matForPsiPlusDelta.solveByGaussElimination(qTot);
    var psiMinus = new Vector(qTot.length);//matForPsiMinusDelta.solveByGaussElimination(qSub);
    for(var k=0;k<H*W;k++){
      this.psi1delta.values[k] = (psiPlus.values[k]+psiMinus.values[k])/2;
      this.psi3delta.values[k] = (psiPlus.values[k]-psiMinus.values[k])/2;
    }
  }

}

}
