module Test{

export function main(){
  window.onload=function(ev:Event){
    function main0() {
      var a = new Mat(4,4,[-1,1,0,0,1,-2,1,0,0,1,-2,1,0,0,0,1]);
      var b = new Vector(4,[3,2,1,0]);
      var ans = a.solveByGaussElimination(b);
      var r = a.mulV(ans);
      var d = r.sub(b);
      var norm = d.norm();
      return a.toString()+"\n"+b.toString()+"\n"+ans.toString()+"\ndiff:"+norm;
    }
    function main2() {
      var i = 0;
      var len = 5;
      var a = Mat.laplace2d(len,len, true);
      var b = new Vector(len*len);
      for(var i = 0;i<len*len;i++) {
        b.values[i] = 1;
      }
      var ans = a.solveByGaussElimination(b);
      var r = a.mulV(ans);
      var d = r.sub(b);
      var norm = d.norm();
      return a.toString()+"\n"+b.toString()+"\n"+ans.toString(len)+"\ndiff:"+norm;
    }

  function main1() {
    for(var z = 0;z < 1000;z++){
      var len = 7;
      var a = (Mat.ident(len));
      for(var x=0;x<len;x++) {
        for(var y=0;y<len;y++) {
          a.set(x,y,Math.random());
        }
      }
      var b = new Vector(len);
      for (var x=0;x<len;x++){
        b.values[x] = 1;
      }
      var ans = a.solveByGaussElimination(b);
      var r = a.mulV(ans);
      var d = r.sub(b);
      var norm = d.norm();
      if(norm > 0.1){
        return a.toString()+"\n"+b.toString()+"\n"+ans.toString()+"\ndiff:"+(d).norm();
      }
    }
    return "ok";
  }

  document.body.innerText = main2();
}

}

}
