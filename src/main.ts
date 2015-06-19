function main(){
  window.onload=function(ev:Event){
    var earth = new Model.Earth();
    earth.step();
  };
};
