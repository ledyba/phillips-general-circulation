module Model {

export var dx = 375*1000;
export var dy = 625*1000;

export var W = 16;
export var H = 15;

export var dt = 24*3600/24;
var A = 1e5;

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

function jacob(v:Vector, w: Vector, vavg: Vector, wavg: Vector):Vector{
  //return j1(v, w, vavg, wavg);
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

export var OrigLambdaSq = 1.5*(1e-12);
export var OrigH = 2*(1e-3);
export var OrigF = 1e-4;
export var OrigK = 4e-6;

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
  zeta1 = new Array<Array<number>>(H);
  zeta3 = new Array<Array<number>>(H);
  heightAvg = new Array<number>(H);
  tempAvg = new Array<number>(H);
  xspeed1Avg = new Array<number>(H);
  xspeed3Avg = new Array<number>(H);
  yspeedAvg = new Array<number>(H);
  omega2 = new Vector(H*W);
  omega2avg = new Vector(H);
  omega2delta = new Vector(H*W);

  lambdaSq = OrigLambdaSq;
  H = OrigH;
  f = OrigF;
  k = OrigK;

  // constants
  matForPsiPlusAvg:Mat;
  matForPsiMinusAvg: Mat;

  matForPsiPlusDeltaLU: MatLU;
  matForPsiMinusDeltaLU: MatLU;

  betaSurface: Vector;
  sunEffect  : Vector;

  matForChi1Avg: Mat;
  matForChi3Avg: Mat;

  matForChi1DeltaLU: MatLU;
  matForChi3DeltaLU: MatLU;

  calcMatForPsiDelta(){
    this.matForPsiMinusDeltaLU = setUpLaplaceMat2d(W,H,1,-2*this.lambdaSq).LU();
  }
  calcMatForPsiAvg(){
    this.matForPsiMinusAvg = setUpLaplaceMat1d(H,1/(dy*dy),-2*this.lambdaSq);
  }
  calcMatForChiAvg(){
    this.matForChi3Avg = setUpLaplaceMat1d(H,-(A*dt)/(dy*dy),+1+(3*this.k*dt/2));
  }
  calcMatForChiDelta(){
    this.matForChi3DeltaLU = setUpLaplaceMat2d(W,H,-(A*dt),+1+(3*this.k*dt/2)).LU();
  }
  calcBetaSurface(){
   this.sunEffect = this.setUpSunEffect()
   this.sunEffectForOmega2 = this.setUpSunEffectForOmega2();
  }

  setUpBetaSurface():Vector{
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
  setUpSunEffect():Vector{
    var m = new Vector(W*H);
    var cy = (H-1)/2;
    var alpha = 4 * R * this.H * this.lambdaSq * dt / (this.f * Cp * (H+1)/2);
    for(var y = 0;y < H;y++){
      var v = (y-cy)*alpha;
      for(var x = 0;x < W;x++){
        var i = idx(x,y);
        m.values[i] = v;
      }
    }
    return m;
  }

  sunEffectForOmega2:Vector;
  setUpSunEffectForOmega2(): Vector{
    var m = new Vector(W*H);
    var cy = (H-1)/2;
    var alpha = 2 * R * this.H / (this.f * Cp * (H+1)/2);
    for(var y = 0;y < H;y++){
      var v = (y-cy)*alpha;
      for(var x = 0;x < W;x++){
        var i = idx(x,y);
        m.values[i] = v;
      }
    }
    return m;
  }

  constructor(){
    this.betaSurface = this.setUpBetaSurface();
    this.matForPsiPlusDeltaLU = setUpLaplaceMat2d(W,H,1,0).LU();
    this.matForPsiPlusAvg  = setUpLaplaceMat1d(H,1/(dy*dy));
    this.matForChi1Avg = setUpLaplaceMat1d(H,-(A*dt)/(dy*dy),+1);
    this.matForChi1DeltaLU = setUpLaplaceMat2d(W,H,-(A*dt),+1).LU();
    this.calcMatForPsiDelta();
    this.calcMatForPsiAvg();
    this.calcMatForChiAvg();
    this.calcMatForChiDelta();
    this.calcBetaSurface();
    this.q1.addeq(this.sunEffect).muleq(1/2);
    this.q3.subeq(this.sunEffect).muleq(1/2);
    this.q1avg.swap(average(this.q1));
    this.q3avg.swap(average(this.q3));

    for(var y=0;y<H;y++){
      this.height[y] = new Array<number>(W);
      this.temp[y] = new Array<number>(W);
      this.zeta1[y] = new Array<number>(W);
      this.zeta3[y] = new Array<number>(W);
    }
  }
  changeLambdaSq(lambdaSq: number){
    this.lambdaSq = lambdaSq;
    this.calcMatForPsiDelta();
    this.calcMatForPsiAvg();
    this.calcBetaSurface();
  }
  changeH(h: number){
    this.H = h;
    this.calcBetaSurface();
  }
  changeF(f: number){
    this.f = f;
    this.calcBetaSurface();
  }
  changeK(k: number){
    this.k = k;
    this.calcMatForChiAvg();
    this.calcMatForChiDelta();
  }

  step(noize?: boolean){
    this.calcPsi();
    if(noize){
      this.addNoise();
    }
    this.calcQ();
  }

  calcDisplay(){
    var psiDelta = this.psi1.sub(this.psi3);
    var psiDeltaAvg = this.psi1avg.sub(this.psi3avg);
    var psiDeltaLast = this.psi1last.sub(this.psi3last);
    this.omega2.swap(
      (psiDelta.sub(psiDeltaLast).diveq(dt)
      .subeq(jacob(this.psi1,this.psi3, this.psi1avg,this.psi3avg))
      .addeq(this.sunEffectForOmega2)
      .subeq(laplace(psiDelta, psiDeltaAvg).muleq(A))
      .muleq(500*this.lambdaSq/this.f)
    ));
    this.omega2avg = average(this.omega2);
    this.omega2delta = delta(this.omega2, this.omega2avg);
    var yspd = new Array<number>(H);
    for(var y=0;y<H;y++){
      if(y > 0){
        yspd[y] = yspd[y-1] - dy * this.omega2avg.values[y]/500;
      }else{
        yspd[y] = -dy * this.omega2avg.values[0]/500;
      }
    }
    for(var y=0;y<H;y++){
      if(y <= 0){
        this.yspeedAvg[y] = yspd[y] / 2;
      }else{
        this.yspeedAvg[y] = (yspd[y] + yspd[y-1]) / 2;
      }
    }

    var cy = (H-1)/2;
    for(var y=0;y<H;y++){
      var f = this.f+(y-cy)*dy*beta;
      var tTot = 0;
      var hTot = 0;
      var xsp1Tot = 0;
      var ysp1Tot = 0;
      var xsp3Tot = 0;
      var ysp3Tot = 0;
      for(var x=0;x < W;x++){
        var i = idx(x,y);
        var deltaPsi = this.psi1.values[i] - this.psi3.values[i];
        var t = (deltaPsi) * this.f / R
        var h = (1.5*this.psi3.values[i] - 0.5 * this.psi1.values[i]) * f / g;
        hTot += h;
        tTot += t;
        this.temp[y][x] = t;
        this.height[y][x] = h;
        if(y > 0 && y < H-1){
          xsp1Tot += -(this.psi1avg.values[y+1] - this.psi1avg.values[y-1]) / (2*dy);
          xsp3Tot += -(this.psi3avg.values[y+1] - this.psi3avg.values[y-1]) / (2*dy);
        }else if(y == 0) {
          xsp1Tot += -(this.psi1avg.values[y+1] - this.psi1avg.values[y]) / (2*dy);
          xsp3Tot += -(this.psi3avg.values[y+1] - this.psi3avg.values[y]) / (2*dy);
        }else{
          xsp1Tot += -(this.psi1avg.values[y] - this.psi1avg.values[y-1]) / (2*dy);
          xsp3Tot += -(this.psi3avg.values[y] - this.psi3avg.values[y-1]) / (2*dy);
        }
        this.zeta1[y][x] = this.q1.values[i] - this.lambdaSq * deltaPsi;
        this.zeta3[y][x] = this.q3.values[i] + this.lambdaSq * deltaPsi;
      }
      this.tempAvg[y]    = tTot / W;
      this.heightAvg[y]  = hTot / W;
      this.xspeed1Avg[y] = xsp1Tot / W;
      this.xspeed3Avg[y] = xsp3Tot / W;
    }
  }

  private addNoise(){
    for(var i = 0; i < W*H; i++){
      var n1 = NOISE * (Math.random()-0.5) * 2;
      var n3 = NOISE * (Math.random()-0.5) * 2;
      this.psi1.values[i] += n1;
      this.psi3.values[i] += n3;
    }
    this.q1.swap(setUpLaplaceMat2d(W,H,1,-this.lambdaSq).dotV(this.psi1).addeq(this.psi3.mul(this.lambdaSq)));
    this.q3.swap(setUpLaplaceMat2d(W,H,1,-this.lambdaSq).dotV(this.psi3).addeq(this.psi1.mul(this.lambdaSq)));
  }

  calcChi1():Vector{
    var chi1 = new Vector(W*H);
    chi1.addeq(this.q1last);
    chi1.addeq(jacob(this.q1.add(this.betaSurface),this.psi1, this.q1avg, this.psi1avg).muleq(2*dt));
    chi1.addeq(laplace(this.q1last, average(this.q1last)).muleq(A*dt));
    chi1.addeq(this.sunEffect);
    return chi1;
  }
  calcChi3():Vector{
    var chi3 = new Vector(W*H);
    chi3.addeq(this.q3last);
    chi3.addeq(jacob(this.q3.add(this.betaSurface),this.psi3,this.q3avg, this.psi3avg).muleq(2*dt));
    chi3.addeq(laplace(this.q3last, average(this.q3last)).muleq(A*dt));
    chi3.subeq(this.sunEffect);
    chi3.subeq((this.q3last.mul(3/2).subeq(this.q1last).subeq(this.psi1last.sub(this.psi3last).muleq(4*this.lambdaSq))).muleq(this.k*dt));
    return chi3;
  }
  calcQ(){
    var chi1 = this.calcChi1();
    var chi3 = this.calcChi3();

    var chi1avg = average(chi1);
    var chi3avg = average(chi3);
    var chi1delta = delta(chi1,chi1avg);
    var chi3delta = delta(chi3,chi3avg);
    this.q1avg.swap(this.matForChi1Avg.solve(chi1avg));
    this.q3avg.swap(this.matForChi3Avg.solve(chi3avg));
    this.q1delta.swap(this.matForChi1DeltaLU.solve(chi1delta));
    this.q3delta.swap(this.matForChi3DeltaLU.solve(chi3delta));

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
    var psiPlus = this.matForPsiPlusAvg.solve(qTot);
    var psiMinus = this.matForPsiMinusAvg.solve(qSub);
    for(var y=0;y<H;y++){
      this.psi1avg.values[y] = (psiPlus.values[y]+psiMinus.values[y])/2;
      this.psi3avg.values[y] = (psiPlus.values[y]-psiMinus.values[y])/2;
    }
  }
  calcPsiDelta(){
    var qTot = this.q1delta.add(this.q3delta);
    var qSub = this.q1delta.sub(this.q3delta);
    var psiPlus = this.matForPsiPlusDeltaLU.solve(qTot);
    var psiMinus = this.matForPsiMinusDeltaLU.solve(qSub);
    for(var k=0;k<H*W;k++){
      this.psi1delta.values[k] = (psiPlus.values[k]+psiMinus.values[k])/2;
      this.psi3delta.values[k] = (psiPlus.values[k]-psiMinus.values[k])/2;
    }
  }

  calcEnergyBudget(): EnergyBudget{
    var flowScale = 3600*24;
    var stockScale = 1;
    var budget = new EnergyBudget();
    budget.cnt = 1;
    //
    {
      var kdelta = 0;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          var i = idx(x,y);
          if(y < H-1){
            var j = idx(x,y+1);
            var a = (this.psi1delta.values[j] - this.psi1delta.values[i]) / dy;
            var b = (this.psi3delta.values[j] - this.psi3delta.values[i]) / dy;
            kdelta += a*a + b*b;
          }else{
            var a =  - this.psi1delta.values[i] / dy;
            var b =  - this.psi3delta.values[i] / dy;
            kdelta += a*a + b*b;
          }
          {
            var j = idx((x+1+W)%W,y);
            var a = (this.psi1delta.values[j] - this.psi1delta.values[i]) / dx;
            var b = (this.psi3delta.values[j] - this.psi3delta.values[i]) / dx;
            kdelta += a*a + b*b;
          }
        }
      }
      budget.kdelta = kdelta / (2*H*W) * stockScale;
    }
    //
    {
      var kavg = 0;
      for (let y = 0; y < H-1; y++) {
        var a = (this.psi1avg.values[y+1]-this.psi1avg.values[y]);
        var b = (this.psi3avg.values[y+1]-this.psi3avg.values[y]);
        kavg += a*a + b*b;
      }
      budget.kavg = kavg/(2*H*dy*dy) * stockScale;
    }
    //
    {
      var pavg = 0;
      for (let y = 0; y < H; y++) {
        var t = this.psi1avg.values[y] - this.psi3avg.values[y];
        pavg += t*t;
      }
      budget.pavg = this.lambdaSq*pavg/(H*2) * stockScale;
    }
    //
    {
      var pdelta = 0;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          var i = idx(x,y);
          var t = this.psi1delta.values[i] - this.psi3delta.values[i];
          pdelta += t*t;
        }
      }
      budget.pdelta = this.lambdaSq*pdelta/(2*W*H) * stockScale;
    }
    //
    var cy = (H - 1) / 2;
    {
      var qavg2pavg = 0;
      for (let y = 0; y < H; y++) {
        qavg2pavg += (y-cy) / ((H+1)/2) * (this.psi1avg.values[y] - this.psi3avg.values[y]);
      }
      budget.qavg2pavg = qavg2pavg * (-2*R*this.H*this.lambdaSq) / (this.f * Cp * H) * flowScale;
    }
    var deltaJabob = jacob(this.psi1delta, this.psi3delta, this.psi1avg, this.psi3avg);
    var deltaJabobAvg = average(deltaJabob);
    {
      var pavg2pdelta = 0;
      for (let y = 0; y < H; y++) {
        pavg2pdelta += (this.psi1avg.values[y]-this.psi3avg.values[y]) * deltaJabobAvg.values[y];
      }
      budget.pavg2pdelta = pavg2pdelta * (-this.lambdaSq) / (H) * flowScale;
      //
      var pdelta2kdelta = 0;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          var i = idx(x,y);
          pdelta2kdelta += this.omega2delta.values[i]*(this.psi1delta.values[i] - this.psi3delta.values[i]);
        }
      }
      budget.pdelta2kdelta = pdelta2kdelta * (-this.f) / (500 * W * H) * flowScale;
    }
    var zero = new Vector(H*W);
    var deltaLaplace1= laplace(this.psi1delta, zero);
    var deltaLaplace3= laplace(this.psi3delta, zero);
    {
      var kdelta2kavg = 0;
      for (let y = 0; y < H; y++) {
        var tot1 = 0;
        var tot3 = 0;
        for (let x = 0; x < W; x++) {
          var i = idx(x,y);
          var i1 = idx((x+1+W)%W,y);
          var i2 = idx((x-1+W)%W,y);
          tot1 += (this.psi1delta.values[i1] - this.psi1delta.values[i2]) * deltaLaplace1.values[i];
          tot3 += (this.psi3delta.values[i1] - this.psi3delta.values[i2]) * deltaLaplace3.values[i];
        }
        kdelta2kavg += (this.psi1avg.values[Math.max(0, y-1)] - this.psi1avg.values[Math.min(H-1, y+1)]) * tot1;
        kdelta2kavg += (this.psi3avg.values[Math.max(0, y-1)] - this.psi3avg.values[Math.min(H-1, y+1)]) * tot3;
      }
      budget.kdelta2kavg = kdelta2kavg/(4*W*H*dx*dy) * flowScale;
    }
    //
    {
      var pavg2kavg = 0;
      for (let y = 0; y < H; y++) {
        pavg2kavg += this.omega2avg.values[y]*(this.psi1avg.values[y] - this.psi3avg.values[y]);
      }
      budget.pavg2kavg = -(this.f/500) * pavg2kavg / H * flowScale;
    }
    //
    var zeta1 = laplace(this.psi1, this.psi1avg);
    var zeta3 = laplace(this.psi3, this.psi3avg);
    var zeta1avg = average(zeta1);
    var zeta3avg = average(zeta3);
    var zeta1delta = delta(zeta1,zeta1avg);
    var zeta3delta = delta(zeta3,zeta3avg);
    {
      var kavg2a = 0;
      for (let y = 0; y < H; y++) {
        kavg2a += (zeta1avg.values[y] * zeta1avg.values[y]) + (zeta3avg.values[y] * zeta3avg.values[y]);
      }
      budget.kavg2a = A * kavg2a / H * flowScale;
    }
    {
      var kdelta2a = 0;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          var i = idx(x,y);
          var a = zeta1delta.values[i];
          var b = zeta3delta.values[i];
          kdelta2a += (a * a) + (b * b);
        }
      }
      budget.kdelta2a = A * kdelta2a / (W*H) * flowScale;
    }
    {
      var pavg2a = 0;
      for (let y = 0; y < H; y++) {
        if( y < H-1){
          var t = (this.psi1avg.values[y+1]-this.psi3avg.values[y+1]) - (this.psi1avg.values[y]-this.psi3avg.values[y]);
          pavg2a += t*t;
        }else{
          var t = -(this.psi1avg.values[y]-this.psi3avg.values[y]);
          pavg2a += t*t;
        }
      }
      budget.pavg2a = this.lambdaSq * A * pavg2a /  (H*dy*dy) * flowScale;
    }
    {
      var pdelta2a = 0;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          var i = idx(x,y);
          var i1 = idx((x+1+W)%W,y);
          var i2 = idx(x,Math.min(H-1, 1+y));
          var a = (this.psi1delta.values[i1] - this.psi3delta.values[i1]) - (this.psi1delta.values[i] - this.psi3delta.values[i]);
          var b = (this.psi1delta.values[i2] - this.psi3delta.values[i2]) - (this.psi1delta.values[i] - this.psi3delta.values[i])
          pdelta2a += (a*a / (dx*dx)) + (b*b / (dy*dy));
        }
      }
      budget.pdelta2a = this.lambdaSq * A * pdelta2a /  (H*W) * flowScale;
    }
    {
      var kavg2k = 0;
      for (let y = 0; y < H; y++) {
        kavg2k += (3/2*zeta3avg.values[y]-zeta1avg.values[y]/2) * this.psi3avg.values[y];
      }
      budget.kavg2k = -this.k * kavg2k / (H) * flowScale;
    }
  {
    var kdelta2k = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        var i = idx(x,y);
        kdelta2k += ((3/2*zeta3delta.values[i])-(zeta1delta.values[i]/2)) * this.psi3delta.values[i];
      }
    }
    budget.kdelta2k = -this.k * kdelta2k / (H*W) * flowScale;
  }
  return budget;
  }
}

export class EnergyBudget{
  cnt: number;
  //
  kavg: number;
  kdelta: number;
  pavg: number;
  pdelta: number;
  //
  qavg2pavg: number;
  pavg2pdelta: number;
  pdelta2kdelta: number;
  kdelta2kavg: number;
  pavg2kavg: number;
  //
  kavg2a: number;
  kdelta2a: number;
  pavg2a: number;
  pdelta2a: number;
  kdelta2k: number;
  kavg2k: number;
  constructor(){
    this.cnt = 0;
    this.kavg = 0;
    this.kdelta = 0;
    this.pavg = 0;
    this.pdelta = 0;
    //
    this.qavg2pavg = 0;
    this.pavg2pdelta = 0;
    this.pdelta2kdelta = 0;
    this.kdelta2kavg = 0;
    this.pavg2kavg = 0;
    //
    this.kavg2a = 0;
    this.kdelta2a = 0;
    this.pavg2a = 0;
    this.pdelta2a = 0;
    this.kdelta2k = 0;
    this.kavg2k = 0;
  }
  addeq(e: EnergyBudget){
    this.cnt += e.cnt;
    this.kavg += e.kavg;
    this.kdelta += e.kdelta;
    this.pavg += e.pavg;
    this.pdelta += e.pdelta;
    //
    this.qavg2pavg += e.qavg2pavg;
    this.pavg2pdelta += e.pavg2pdelta;
    this.pdelta2kdelta += e.pdelta2kdelta;
    this.kdelta2kavg += e.kdelta2kavg;
    this.pavg2kavg += e.pavg2kavg;
    //
    this.kavg2a += e.kavg2a;
    this.kdelta2a += e.kdelta2a;
    this.pavg2a += e.pavg2a;
    this.pdelta2a += e.pdelta2a;
    this.kdelta2k += e.kdelta2k;
    this.kavg2k += e.kavg2k;
  }
  average():EnergyBudget{
    var e = new EnergyBudget;
    var cnt = this.cnt;
    e.cnt = 1;
    e.kavg = this.kavg/cnt;
    e.kdelta = this.kdelta/cnt;
    e.pavg = this.pavg/cnt;
    e.pdelta = this.pdelta/cnt;
    //
    e.qavg2pavg = this.qavg2pavg/cnt;
    e.pavg2pdelta = this.pavg2pdelta/cnt;
    e.pdelta2kdelta = this.pdelta2kdelta/cnt;
    e.kdelta2kavg = this.kdelta2kavg/cnt;
    e.pavg2kavg = this.pavg2kavg/cnt;
    //
    e.kavg2a = this.kavg2a/cnt;
    e.kdelta2a = this.kdelta2a/cnt;
    e.pavg2a = this.pavg2a/cnt;
    e.pdelta2a = this.pdelta2a/cnt;
    e.kdelta2k = this.kdelta2k/cnt;
    e.kavg2k = this.kavg2k/cnt;
    return e;
  }
}

}
