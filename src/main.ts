var f = (function(){
  window.onload=function(ev:Event){
    function main0() {
      var mat = new Mat(4,4,[-1,1,0,0,1,-2,1,0,0,1,-2,1,0,0,0,1]);
      var v = new Vector(4,[3,2,1,0]);
      var ans = mat.solveByGaussErasion(v);
      var y = mat.mulV(ans);
      return y.values.join("<br>\n")+"<br>diff:"+(y.sub(v)).norm();
    }
    function main2() {
      var mat = new Mat(4,4,[-2,0,0,0, /**/ -1,1,0,0, /**/ -1,0,1,0, /**/ -1,0,0,1]);
      /*
      for(var x=0;x<4;x++) {
        for(var y=0;y<4;y++) {
          mat.set(x,y,Math.random());
        }
      }*/
      var v = new Vector(4,[-6,-1,-2,0]);
      var ans = mat.solveByGaussErasion(v);
      var r = mat.mulV(ans);
      var d = r.sub(v);
      return mat.toString()+"<br><br>\n"+ans.toString()+"<br>diff:"+(d).norm();
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
      var ans = a.solveByGaussErasion(b);
      var r = a.mulV(ans);
      var d = r.sub(b);
      var norm = d.norm();
      if(norm > 0.1){
        return a.toString()+"<br>"+b.toString()+"<br>\n"+ans.toString()+"<br>diff:"+(d).norm();
      }
    }
    return "ok";
  }

  document.body.innerHTML = main1();
}
});

f();
