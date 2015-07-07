declare var numeric: any;
class Vector {
  values: Array<number>;
  length: number;
  constructor(len: number,value?:Array<number>) {
    this.length = len;
    if(value != null){
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
    numeric.addeq(this.values, other.values);
    return this;
  }
  sub(other: Vector): Vector{
    if(other.length != this.length){
      throw "Invalid op: "+other.length + "!=" + this.length;
    }
    numeric.subeq(this.values, other.values);
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
    return numeric.dot(this.values, other.values);
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
    return numeric.norm2(this.values);
  }
}


class Mat {
  width: number;
  height: number;
  private values: Array<Array<number>>;
  constructor(width: number,height: number,value?:Array<number>, empty?: boolean){
    this.width=width;
    this.height=height;
    if (empty){
      return
    }
    if(value){
      this.values = new Array(height);
      for(var y=0;y<height;y++){
        this.values[y] = new Array<number>(width);
        for(var x=0;x<width;x++){
          this.values[y][x] = value[y*this.height + x];
        }
      }
    }else{
      this.values = new Array(height);
      for(var y=0;y<height;y++){
        this.values[y] = new Array<number>(width);
        for(var x=0;x<width;x++){
          this.values[y][x] = 0;
        }
      }
    }
  }
  static ident(len: number, alpha?: number){
    var m = new Mat(len,len, null, true);
    var vs = numeric.identity(len);
    if(alpha != null){
      vs = numeric.mul(alpha, vs);
    }
    m.values = vs;
    return m;
  }
  static laplace1d(len: number, neumann?: boolean){
    var m = new Mat(len,len, null, true);
    var vs = numeric.identity(len);
    vs[0][1] = 1;
    vs[0][0] = -1;
    for (var i=1;i<len-1;i++){
      vs[i][i-1] = 1;
      vs[i][i+1] = 1;
      vs[i][i] = -2;
    }
    if(neumann){
      vs[len-1][len-1] = 1;
    }else{
      vs[len-1][len-1] = -1;
      vs[len-1][len-2] = +1;
    }
    m.values = vs;
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
          m.add(idx(x-1,y),idx(x,y),+1);
          m.add(idx(x  ,y),idx(x,y),-2);
          m.add(idx(x+1,y),idx(x,y),+1);
        }
        if (y <= 0){
          m.add(idx(x,0),idx(x,y),-1);
          m.add(idx(x,1),idx(x,y),+1);
        }else if(y >= h-1){
          m.add(idx(x,h-2),idx(x,y),-1);
          m.add(idx(x,h-1),idx(x,y),+1);
        }else{
          m.add(idx(x,y-1),idx(x,y),+1);
          m.add(idx(x,y  ),idx(x,y),-2);
          m.add(idx(x,y+1),idx(x,y),+1);
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
    return this.values[y][x];
  }
  set(x:number, y:number, v:number ):number{
    this.values[y][x] = v;
    if(isNaN(v) || !isFinite(v)){
      throw "oops. result is nan or inf: "+v.toString();
    }
    return v;
  }
  add(x:number, y:number, v:number):number{
    this.values[y][x] += v;
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
    for(var x=0;x<this.width;x++){
      for(var y=0;y<this.height;y++){
        this.values[y][x] *= f;
      }
    }
    return this;
  }
  mulM(m: Mat): Mat{
    if(this.width != m.height){
      throw "Invalid size: "+this.width+"x"+this.height+" vs "+m.width+"x"+m.height;
    }
    var nm = new Mat(m.width, this.height, null, true);
    nm.values = numeric.dot(this.values, m.values);
    return nm;
  }
  addM(m: Mat): Mat{
    if(this.height != m.height || this.width != m.width){
      throw "Invalid size: "+this.width+"x"+this.height+" vs "+m.width+"x"+m.height;
    }
    this.values = numeric.add(this.values, m.values);
    return this;
  }
  clone():Mat{
    var nm = new Mat(this.width,this.height,null,true);
    nm.values = numeric.clone(this.values);
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
    if(this.height < this.width){
      throw "Invalid size, too short: "+this.width+"x"+this.height;
    }
    if(v.length != this.height){
      throw "Invalid size: "+this.width+"x"+this.height+" vs "+v.length;
    }
    var ans = numeric.solve(this.values, v.values);
    var vec = new Vector(v.length, ans);
    return vec;
  }
}
