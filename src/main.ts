window.onload=function(ev:Event){
  function main() {
    var mat = new Mat(
      4,4,[
        -1,1,0,0,
        1,-2,1,0,
        0,1,-2,1,
        0,0,0,1
      ]
    );
    var v = new Vector(4,[3,2,1,0]);
    var ans = mat.solveByGauss(v);
    return ans.toString();
  }

  document.body.innerHTML = main();
};
