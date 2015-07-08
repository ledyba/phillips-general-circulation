function main(){
  window.onload=function(ev:Event){
    var earth = new Model.Earth();
    var time = Model.TRY;
    for(var k = 0;k<10;k++){
      earth.step();
    }
    earth.step(true);
    for(var k = 0;k<200;k++){
      earth.step();
    }
    earth.step();
    window.document.body.innerHTML = earth.q1avg.toString();
  };
};
