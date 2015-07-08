module Model {

export var dx = 375*1000;
export var dy = 625*1000;

export var W = 16;
export var H = 15;

var lambdaSq = 1.5*(1e-12);
export var dt = 24*3600/10;
var A = 1e5;
var k = 4e-6;

var H0 = 2*(1e-3);
var f0 = 1e-4;
var R = 287;
var Cp = 1004;
var beta = 1.6*(1e-11);

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

function jacob(v:Vector, w: Vector):Vector{
  var r = new Vector(v.length);
  for(var x = 0;x < W; x++){
    for(var y = 0;y < H; y++){
      var dvx, dvy, dwx, dwy;
      dvx = (v.values[idx((x+1)%W,y)] - v.values[idx((x-1+W)%W,y)]) / (2*dx);
      dwx = (w.values[idx((x+1)%W,y)] - w.values[idx((x-1+W)%W,y)]) / (2*dx);
      if (y <= 0){
        dvy = v.values[idx(x,y+1)] / (2*dy);
        dwy = w.values[idx(x,y+1)] / (2*dy);
      }else if(y >= H-1){
        dvy = - v.values[idx(x,y-1)] / (2*dy);
        dwy = - w.values[idx(x,y-1)] / (2*dy);
      }else{
        dvy = (v.values[idx(x,y+1)] - v.values[idx(x,y-1)]) / (2*dy);
        dwy = (w.values[idx(x,y+1)] - w.values[idx(x,y-1)]) / (2*dy);
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

  constructor(){
    this.q1.addeq(sunEffect).muleq(1/2);
    this.q3.subeq(sunEffect).muleq(1/2);
    this.q1avg.swap(average(this.q1));
    this.q3avg.swap(average(this.q3));

    for(var y=0;y<H;y++){
      this.height[y] = new Array<number>(W);
      this.temp[y] = new Array<number>(W);
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
    for(var y=0;y<H;y++){
      for(var x=0;x < W;x++){
        var i = idx(x,y);
        this.temp[y][x] = (this.psi1.values[i] - this.psi3.values[i]) * f0 / R;
        this.height[y][x] = this.psi1.values[i] * 3 - this.psi3.values[i]*2;
      }
      //u1.values[k] = -(this.psi1avg.values[k+1] - this.psi1avg.values[k-1]) / (2*dy);
      //z1.values[k] = this.q1avg.values[k] + lambdaSq * (this.psi1avg.values[k] - this.psi3avg.values[k]);
    }
  }

  private addNoise(){
    for(var i = 0; i < W*H; i++){
      this.psi1.values[i] += NOISE * (Math.random()-0.5);
      this.psi3.values[i] += NOISE * (Math.random()-0.5);
    }
  }

  calcChi1():Vector{
    var chi1 = new Vector(W*H);
    chi1.addeq(this.q1last);
    chi1.addeq(jacob(this.q1.add(betaSurface),this.psi1).muleq(2*dt));
    chi1.addeq(laplace(this.q1last).muleq(A*dt));
    chi1.addeq(sunEffect);
    return chi1;
  }
  calcChi3():Vector{
    var chi3 = new Vector(W*H);
    chi3.addeq(this.q3last);
    chi3.addeq(jacob(this.q3.add(betaSurface),this.psi3).mul(2*dt));
    chi3.addeq(laplace(this.q3last).muleq(A*dt));
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
    for(var k=0;k<H;k++){
      this.psi1avg.values[k] = (psiPlus.values[k]+psiMinus.values[k])/2;
      this.psi3avg.values[k] = (psiPlus.values[k]-psiMinus.values[k])/2;
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
