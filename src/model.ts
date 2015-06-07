var W = 100;
var H = 100;
var lambdaSq = 0;

function setUpLaplaceMat1d(len: number, alpha: number):Mat{
  var m: Mat = new Mat(len,len);
  for(var k=0;k<len;k++){
    m.set(k,k,-2+alpha);
  }
  for(var k=0;k<len-1;k++){
    m.set(k+1,k,1);
    m.set(k,k+1,1);
  }
  m.set(0,0,-1+alpha);
  m.set(k-1,k-1,1+alpha);
  return m;
}

var matForPsiPlus  = setUpLaplaceMat1d(H,0);
var matForPsiMinus = setUpLaplaceMat1d(H,-2*lambdaSq);

function vectAdd(v1: Vector, v2: Vector):Vector{
  if(v1.length != v2.length){
    throw "Please use same length vectors";
  }
  var v = new Vector(v1.length);
  for(var k=0;k<v.length;k++){
    v.values[k] = v1.values[k]+v2.length[k];
  }
  return v;
}
function vectSub(v1: Vector, v2: Vector):Vector{
  if(v1.length != v2.length){
    throw "Please use same length vectors";
  }
  var v = new Vector(v1.length);
  for(var k=0;k<v.length;k++){
    v.values[k] = v1.values[k]-v2.length[k];
  }
  return v;
}

class Earth{
  q1avg  = new Vector(H);
  q2avg  = new Vector(H);
  q1delta = new Vector(H*W);
  q2delta = new Vector(H*W);
  psi1avg  = new Vector(H);
  psi2avg  = new Vector(H);
  psi1delta = new Vector(H*W);
  psi2delta = new Vector(H*W);
  constructor(){
  }
  step(){
    this.calcPsiAvg();
    this.calcPsiDelta();
  }
  calcPsiAvg(){
    var qTot = vectAdd(this.q1avg,this.q2avg);
    var qSub = vectAdd(this.q1avg,this.q2avg);
    var psiPlus = matForPsiPlus.solveByGaussErasion(qTot);
    var psiMinus = matForPsiMinus.solveByGaussErasion(qSub);
    for(var k=0;k<H;k++){
      this.psi1avg.values[k] = psiPlus.values[k]+psiMinus.values[k];
      this.psi2avg.values[k] = psiPlus.values[k]-psiMinus.values[k];
    }
  }
  calcPsiDelta(){
    var qTot = vectAdd(this.q1delta,this.q2delta);
    var qSub = vectAdd(this.q1delta,this.q2delta);
    var psiPlus = matForPsiPlus.solveByGaussSeidel(qTot);
    var psiMinus = matForPsiMinus.solveByGaussSeidel(qSub);
    for(var k=0;k<H*W;k++){
      this.psi1delta.values[k] = psiPlus.values[k]+psiMinus.values[k];
      this.psi2delta.values[k] = psiPlus.values[k]-psiMinus.values[k];
    }
  }

}
