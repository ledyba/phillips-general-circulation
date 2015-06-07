class Mat {
  width: number;
  height: number;
  private values: Array<number>;
  constructor(width: number,height: number,value?:Array<number>){
    this.width=width;
    this.height=height;
    if(value){
      this.values = value.slice(0);
    }else{
      this.values = new Array(width*height);
    }
  }
  get(x:number, y:number):number{
    return this.values[y*this.height + x];
  }
  set(x:number, y:number, v:number ):number{
    this.values[y*this.height + x]=v;
    return v;
  }
  mulV(v: Vector): Vector{
    if(v.length != this.width){
      throw "Invalid size: "+this.width+"x"+this.height+" vs "+v.length;
    }
    var nv = new Vector(this.height);
    for(var y=0;y<this.width;y++){
      var t = 0;
      for(var x=0;x<this.width;x++){
        t += this.get(x,y)*v.values[x];
      }
      nv[y]=t;
    }
    return nv;
  }
  mulM(m: Mat): Mat{
    if(this.width != m.height){
      throw "Invalid size: "+this.width+"x"+this.height+" vs "+m.width+"x"+m.height;
    }
    var nm = new Mat(m.width, this.height);
    for(var y=0;y<this.height;y++){
      for(var x=0;x<m.width;x++){
        var t = 0;
        for(var k=0;k<this.width;k++){
          t += this.get(k,y) * m.get(x,k);
        }
        nm.set(x,y,t);
      }
    }
    return nm;
  }
  clone():Mat{
    var nm = new Mat(this.width,this.height,this.values);
    return nm;
  }
  solveByGaussErasion(v:Vector):Vector{
    if(this.height < this.width){
      throw "Invalid size, too short: "+this.width+"x"+this.height;
    }
    if(v.length != this.height){
      throw "Invalid size: "+this.width+"x"+this.height+" vs "+v.length;
    }
    var nm = this.clone();
    var nv = v.clone();
    function sub(from: number, to: number, f: number){
      nv.values[from] -= nv.values[to]*f;
    }
    for(var y=0;y<nm.height-1;y++) {
      var base = nm.get(y,y);
      for(var yy=y+1;yy<nm.height;yy++){
        var f = nm.get(y,yy)/base;
        nm.set(y,yy,0);
        for(var k=y+1;k<nm.width;k++){
          var val = nm.get(k,yy);
          nm.set(k,yy,val-f*nm.get(k,y));
        }
        sub(yy,y,f);
      }
    }
    var ans = new Vector(nv.length);
    for(var y = nm.height-1;y>=0;y--){
      var tot = 0;
      for(var k = nm.height-1;k>y;k--){
        tot += nm.get(k,y)*ans.values[k];
      }
      ans.values[y] = (nv.values[y]-tot)/nm.get(y,y);
    }
    return ans;
  }
  solveByGaussSeidel(v:Vector):Vector{
    if(v.length != this.height || v.length != this.width){
      throw "Invalid size: "+this.width+"x"+this.height+" vs "+v.length;
    }
    var cv = new Vector(v.length);
    var diff = 100;
    while(diff > 0.001){
      diff = 0;
      for(var k=0;k<v.length;k++){
        var tot = v.values[k];
        for(var l=0;l<v.length;l++){
          if(k!=l){
            tot -= this.get(l,k) * cv.values[l];
          }
        }
        var nv = tot/this.get(k,k);
        diff += (cv.values[k]-nv)*(cv.values[k]-nv);
        cv.values[k] = nv;
      }
    }
    return cv;
  }
}
