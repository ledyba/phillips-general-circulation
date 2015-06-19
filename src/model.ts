module Model {

var W = 10;
var H = 10;
var lambdaSq = 0;
var dt = 1;
var A = 0;
var k = 0;

function idx(x,y):number{
  return y*W+x;
}

function setUpLaplaceMat1d(len: number, alpha: number, beta: number):Mat{
  return Mat.laplace1d(len, true).mul(alpha).addM(Mat.ident(len,beta));
}
function setUpLaplaceMat2d(w: number, h: number, alpha: number, beta: number):Mat{
  return Mat.laplace2d(w,h,false).mul(alpha).addM(Mat.ident(w*h, beta))
}

var matForPsiPlusAvg  = setUpLaplaceMat1d(H,1,0);
var matForPsiMinusAvg = setUpLaplaceMat1d(H,1,-2*lambdaSq);

var matForPsiPlusDelta  = setUpLaplaceMat2d(W,H,1,0);
var matForPsiMinusDelta = setUpLaplaceMat2d(W,H,1,-2*lambdaSq);

var betaSurface = setUpBetaSurface();
var sunEffect   = setUpSunEffect();

var matForChi1Avg = setUpLaplaceMat1d(H,(A*dt),-1);
var matForChi3Avg = setUpLaplaceMat1d(H,(A*dt),-(1+3*k*dt/2));

var matForChi1Delta = setUpLaplaceMat2d(W,H,(A*dt),-1);
var matForChi3Delta = setUpLaplaceMat2d(W,H,(A*dt),-(1+3*k*dt/2));

function setUpBetaSurface():Vector{
  var m = new Vector(W*H);
  return m;
}
function setUpSunEffect():Vector{
  var m = new Vector(W*H);
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
      var dvx, dxy, dwx, dwy;
      if (x <= 0){
        dvx = (v.values[idx(x+1,y)] - v.values[idx(x,y)]) * 2;
        dwy = (w.values[idx(x+1,y)] - w.values[idx(x,y)]) * 2;
      }else if(x >= W-1){
        dvx = (v.values[idx(x,y)] - v.values[idx(x-1,y)]) * 2;
        dwy = (w.values[idx(x,y)] - w.values[idx(x-1,y)]) * 2;
      }else{
        dvx = (v.values[idx(x+1,y)] - v.values[idx(x-1,y)]);
        dwy = (w.values[idx(x+1,y)] - w.values[idx(x-1,y)]);
      }
      if (y <= 0){
        dvx = (v.values[idx(x,y+1)] - v.values[idx(x,y)]) * 2;
        dwy = (w.values[idx(x,y+1)] - w.values[idx(x,y)]) * 2;
      }else if(y >= H-1){
        dvx = (v.values[idx(x,y)] - v.values[idx(x,y-1)]) * 2;
        dwy = (w.values[idx(x,y)] - w.values[idx(x,y-1)]) * 2;
      }else{
        dvx = (v.values[idx(x,y+1)] - v.values[idx(x,y-1)]);
        dwy = (w.values[idx(x,y+1)] - w.values[idx(x,y-1)]);
      }
      r.values[idx(x,y)] - dxy*dwy - dxy*dwx;
    }
  }
  return r;
}
function laplace(v:Vector):Vector{
  var r = new Vector(v.length);
  for(var x = 0;x < W; x++){
    for(var y = 0;y < H; y++){
      if (x <= 0){
        r.values[idx(x,y)] +=
              - v.values[idx(x,y)] * 1
              + v.values[idx(x+1,y)];
      }else if(x >= W-1){
        r.values[idx(x,y)] +=
              + v.values[idx(x,y)] * 1
              - v.values[idx(x-1,y)];
      }else{
        r.values[idx(x,y)] +=
              + v.values[idx(x,y)] * 2
              - v.values[idx(x-1,y)]
              - v.values[idx(x+1,y)];
      }
      if (y <= 0){
        r.values[idx(x,y)] +=
              - v.values[idx(x,y)] * 1
              + v.values[idx(x,y+1)];
      }else if(y >= H-1){
        r.values[idx(x,y)] +=
              + v.values[idx(x,y)] * 1
              - v.values[idx(x,y-1)];
      }else{
        r.values[idx(x,y)] +=
              + v.values[idx(x,y)] * 2
              - v.values[idx(x,y-1)]
              - v.values[idx(x,y+1)];
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
    this.q1delta.copy(matForChi1Delta.solveByGaussElimination(delta(chi1,chi1avg)));
    this.q3delta.copy(matForChi3Delta.solveByGaussElimination(delta(chi3,chi3avg)));

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
  }
  calcPsiAvg(){
    var qTot = vectAdd(this.q1avg,this.q3avg);
    var qSub = vectAdd(this.q1avg,this.q3avg);
    var psiPlus = matForPsiPlusAvg.solveByGaussElimination(qTot);
    var psiMinus = matForPsiMinusAvg.solveByGaussElimination(qSub);
    for(var k=0;k<H;k++){
      this.psi1avg.values[k] = psiPlus.values[k]+psiMinus.values[k];
      this.psi3avg.values[k] = psiPlus.values[k]-psiMinus.values[k];
    }
  }
  calcPsiDelta(){
    var qTot = vectAdd(this.q1delta,this.q3delta);
    var qSub = vectAdd(this.q1delta,this.q3delta);
    var psiPlus = matForPsiPlusDelta.solveByGaussElimination(qTot);
    var psiMinus = matForPsiMinusDelta.solveByGaussElimination(qSub);
    for(var k=0;k<H*W;k++){
      this.psi1delta.values[k] = psiPlus.values[k]+psiMinus.values[k];
      this.psi3delta.values[k] = psiPlus.values[k]-psiMinus.values[k];
    }
  }

}

}
