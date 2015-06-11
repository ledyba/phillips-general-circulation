window.onload=function(ev:Event){
  function main0() {
    var mat = new Mat(4,4,[-1,1,0,0,1,-2,1,0,0,1,-2,1,0,0,0,1]);
    var v = new Vector(4,[3,2,1,0]);
    var ans = mat.solveByGaussSeidel(v);
    return ans.toString();
  }

  function main1() {
    var len = 15;
    var W = 5000;
    var dy = 625;
    var a = 1e-12;
    var mat = Mat.ident(1,len).addM(Mat.laplace1d(len));
    var yvec = new Vector(len);
    for (var i=0;i<len;i++){
      yvec.values[i] = Math.cos(Math.PI * ((i*dy-W)/W) );
    }
    var ans = mat.solveByGaussErasion(yvec);
    var y = mat.mulV(ans);

    return ans.values.join("<br>\n")+"<br>diff:"+y.norm();
  }

  document.body.innerHTML = main1();
};
