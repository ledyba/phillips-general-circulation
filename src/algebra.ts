class Vector {
  values: Array<number>;
  length: number;
  constructor(len: number,value?:Array<number>) {
    this.length = len;
    if(value){
      this.values = value.slice(0);
    }else{
      this.values = new Array(len);
      for(var k=0;k<len;k++){
        this.values[k] = 0;
      }
    }
  }
  add(other: Vector): Vector{
    if(other.length != this.length){
      throw "Invalid op: "+other.length + "!=" + this.length;
    }
    for(var i=0;i<this.length;i++){
      this.values[i]+=other.values[i];
    }
    return this;
  }
  sub(other: Vector): Vector{
    if(other.length != this.length){
      throw "Invalid op: "+other.length + "!=" + this.length;
    }
    for(var i=0;i<this.length;i++){
      this.values[i]-=other.values[i];
    }
    return this;
  }
  mul(f: number): Vector{
    for(var i=0;i<this.length;i++){
      this.values[i]*=f;
    }
    return this;
  }
  clone(): Vector{
    var n = new Vector(this.length);
    for(var i=0;i<this.length;i++){
      n.values[i]=this.values[i];
    }
    return n;
  }
  copy(other: Vector): Vector{
    if(other.length != this.length){
      throw "Invalid op: "+other.length + "!=" + this.length;
    }
    for(var i=0;i<this.length;i++){
      this.values[i]=other.values[i];
    }
    return this;
  }
  dot(other: Vector): number{
    if(other.length != this.length){
      throw "Invalid op: "+other.length + "!=" + this.length;
    }
    var tot = 0;
    for(var i=0;i<this.length;i++){
      tot += this.values[i]*other.values[i];
    }
    return tot;
  }
  toString(sepat?: number):string{
    if (!sepat){
      sepat = 0;
    }
    var line = "{{";
    for(var i=0;i<this.length;i++){
      if(i > 0){
        if(sepat > 0 && i%sepat == 0){
          line+="},\n{";
        }else{
          line+="},{";
        }
      }
      line += this.values[i].toFixed(3);
    }
    return line+"}}";
  }
  norm(): number{
    var l = 0;
    for(var i=0;i<this.length;i++){
      l += (this.values[i]*this.values[i]);
    }
    return Math.sqrt(l);
  }
}


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
  static ident(len: number, alpha?: number){
    var m = new Mat(len,len);
    if(!alpha){
      alpha = 1.0;
    }
    for (var i=0;i<len;i++){
      m.set(i,i,alpha);
    }
    return m;
  }
  static laplace1d(len: number, neumann?: boolean){
    var m = new Mat(len,len);
    m.set(0,0,-1);
    m.set(1,0,-1);
    for (var i=1;i<len-1;i++){
      m.set(i-1,i,1);
      m.set(i+1,i,1);
      m.set(i  ,i,-2);
    }
    if(neumann){
      m.set(len-1,len-1,1);
      m.set(len-2,len-1,1);
    }
    return m;
  }
  static laplace2d(w: number, h:number, neumann?: boolean){
    var len = w*h;
    var m = new Mat(len,len);
    function idx(x,y) {
      return (y*w)+x;
    }
    for(var x = 0;x < w;x++){
      for(var y = 0;y < h;y++){
        if (x <= 0){
          m.add(idx(0,y),idx(x,y),-1);
          m.add(idx(1,y),idx(x,y),+1);
        }else if(x >= w-1){
          m.add(idx(w-2,y),idx(x,y),-1);
          m.add(idx(w-1,y),idx(x,y),+1);
        }else{
          m.add(idx(x-1,y),idx(x,y),-1);
          m.add(idx(x  ,y),idx(x,y),+2);
          m.add(idx(x+1,y),idx(x,y),-1);
        }
        if (y <= 0){
          m.add(idx(x,0),idx(x,y),-1);
          m.add(idx(x,1),idx(x,y),+1);
        }else if(y >= h-1){
          m.add(idx(x,h-2),idx(x,y),-1);
          m.add(idx(x,h-1),idx(x,y),+1);
        }else{
          m.add(idx(x,y-1),idx(x,y),-1);
          m.add(idx(x,y  ),idx(x,y),+2);
          m.add(idx(x,y+1),idx(x,y),-1);
        }
      }
    }
    if(neumann){
      x = w-1;
      y = h-1;
      m.set(idx(x,y  ),idx(x,y),1);
      m.set(idx(x,y-1),idx(x,y),0);
      m.set(idx(x-1,y),idx(x,y),0);
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
  add(x:number, y:number, v:number):number{
    this.values[y*this.height + x] += v;
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
      nv.values[y]=t;
    }
    return nv;
  }
  mul(f: number): Mat{
    for(var i=0;i<this.values.length;i++){
      this.values[i] *= f;
    }
    return this;
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
  toString():string{
    var r = "{";
    for(var y=0;y<this.height;y++){
      if(y > 0){
        r += ",\n";
      }
      var line = "{"
      for(var x=0;x<this.width;x++){
        if(x > 0){
          line += ",";
        }
        line += this.get(x,y).toFixed(3);
      }
      r += line + "}";
    }
    return r+"}";
  }
  solveByGaussElimination(v:Vector):Vector{
    function assertEq(a:number, b:number){
      if(a != b){
        throw "Assertion failed";
      }
    }
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
    for(var x=0;x<nm.height-1;x++) {
      var maxL = x;
      var max = Math.abs(nm.get(x,alias[x]));
      for(var y=x+1;k<nm.height;y++){
        var t = Math.abs(nm.get(x,alias[y]));
        if(t > max){
          max = t;
          maxL = y;
        }
      }
      swap(x,maxL);
      if(max < 1e-4){
        throw "Oops. Matrix might not be full ranked: "+(x+1)+"/"+this.height;
      }
      assertEq(Math.abs(nm.get(x,alias[x])), max);
      var base = nm.get(x,alias[x]);
      for(var target=x+1;target<nm.height;target++){
        var f = nm.get(x,alias[target])/base;
        nm.set(x,alias[target],0);
        for(var k=x+1;k<nm.width;k++){
          var val = nm.get(k,alias[target]);
          nm.set(k,alias[target],val-f*nm.get(k,alias[x]));
        }
        nv.values[alias[target]] -= nv.values[alias[x]]*f;
      }
    }
    var ans = new Vector(nv.length);
    for(var y = nm.height-1;y>=0;y--){
      var tot = 0;
      for(var k = nm.height-1;k>y;k--){
        tot += nm.get(k,alias[y])*ans.values[k];
      }
      ans.values[y] = (nv.values[alias[y]]-tot)/nm.get(y,alias[y]);
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
