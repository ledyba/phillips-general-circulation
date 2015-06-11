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
      for(var k=0;k<width*height;k++){
        this.values[k] = 0;
      }
    }
  }
  static ident(alpha: number, len: number){
    var m = new Mat(len,len);
    for (var i=0;i<len;i++){
      m.set(i,i,alpha);
    }
    return m;
  }
  static laplace1d(len: number){
    var m = new Mat(len,len);
    m.set(0,0,-1);
    m.set(1,0,-1);
    for (var i=1;i<len-1;i++){
      m.set(i-1,i,1);
      m.set(i+1,i,1);
      m.set(i  ,i,-2);
    }
    m.set(len-1,len-1,1);
    m.set(len-2,len-1,1);
    return m;
  }
  static laplace2d(len: number){
    var l2 = len*len;
    var m = new Mat(l2,l2);
    m.set(0,0,-1);
    m.set(1,0,-1);
    for(var x = 0;x < len;x++){
      for(var y = 0;y < len;y++){

      }
    }
    return m;
  }
  get(x:number, y:number):number{
    return this.values[y*this.height + x];
  }
  set(x:number, y:number, v:number ):number{
    this.values[y*this.height + x]=v;
    if(isNaN(v) || !isFinite(v)){
      throw "oops. result is nan or inf: "+v.toString();
    }
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
  addM(m: Mat): Mat{
    if(this.height != m.height || this.width != m.width){
      throw "Invalid size: "+this.width+"x"+this.height+" vs "+m.width+"x"+m.height;
    }
    for(var y=0;y<this.height;y++){
      for(var x=0;x<this.width;x++){
        var i = y*this.height + x;
        this.values[i] += m.values[i];
      }
    }
    return this;
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
    var alias = new Array<number>(v.length);
    for(var i=0;i<v.length;i++){
      alias[i] = i;
    }
    function swap(i: number, j:number){
      var t = alias[i];
      alias[i] = alias[j];
      alias[j] = t;
    }
    function sub(from: number, to: number, f: number){
      nv.values[alias[from]] -= nv.values[alias[to]]*f;
    }
    for(var y=0;y<nm.height-1;y++) {
      var maxL = y;
      var max = Math.abs(nm.get(y,alias[y]));
      for(var k=y+1;k<nm.height;k++){
        var t = Math.abs(nm.get(y,alias[k]));
        if(t > max){
          max = t;
          maxL = k;
        }
      }
      swap(y,maxL);
      var base = nm.get(y,alias[y]);
      for(var yy=y+1;yy<nm.height;yy++){
        var f = nm.get(y,alias[yy])/base;
        nm.set(y,alias[yy],0);
        for(var k=y+1;k<nm.width;k++){
          var val = nm.get(k,alias[yy]);
          nm.set(k,alias[yy],val-f*nm.get(k,alias[y]));
        }
        sub(alias[yy],alias[y],f);
      }
    }
    var ans = new Vector(nv.length);
    for(var y = nm.height-1;y>=0;y--){
      var tot = 0;
      for(var k = nm.height-1;k>y;k--){
        tot += nm.get(k,y)*ans.values[alias[k]];
      }
      ans.values[alias[y]] = (nv.values[y]-tot)/nm.get(y,alias[y]);
    }
    return ans;
  }
  solveByGaussSeidel(v:Vector):Vector{
    if(v.length != this.height || v.length != this.width){
      throw "Invalid size: "+this.width+"x"+this.height+" vs "+v.length;
    }
    var cv = new Vector(v.length);
    var diff = 100;
    var cnt = 0;
    while(diff > 0.01 && cnt < 10){
      diff = 0;
      cnt++;
      for(var k=0;k<v.length;k++){
        var tot = v.values[k];
        for(var l=0;l<v.length;l++){
          if(k!=l){
            tot -= this.get(l,k) * cv.values[l];
          }
        }
        var nv = tot/this.get(k,k);
        if(isNaN(nv) || !isFinite(nv)){
          throw "oops. result is nan or inf: "+nv.toString();
        }
        diff += (cv.values[k]-nv)*(cv.values[k]-nv);
        cv.values[k] = nv;
      }
    }
    return cv;
  }
}
