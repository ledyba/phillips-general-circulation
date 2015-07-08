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
  addeq(other: Vector): Vector{
    if(other.length != this.length){
      throw "Invalid op: "+other.length + "!=" + this.length;
    }
    numeric.addeq(this.values, other.values);
    return this;
  }
  subeq(other: Vector): Vector{
    if(other.length != this.length){
      throw "Invalid op: "+other.length + "!=" + this.length;
    }
    numeric.subeq(this.values, other.values);
    return this;
  }
  add(other: Vector): Vector{
    if(other.length != this.length){
      throw "Invalid op: "+other.length + "!=" + this.length;
    }
    return new Vector(this.length, numeric.add(this.values, other.values));
  }
  sub(other: Vector): Vector{
    if(other.length != this.length){
      throw "Invalid op: "+other.length + "!=" + this.length;
    }
    return new Vector(this.length, numeric.sub(this.values, other.values));
  }
  muleq(f: number): Vector{
    for(var i=0;i<this.length;i++){
      this.values[i]*=f;
    }
    return this;
  }
  mul(f: number): Vector{
    return new Vector(this.length, numeric.mul(f, this.values));
  }
  swap(other: Vector): Vector{
    if(other.length != this.length){
      throw "Invalid op: "+other.length + "!=" + this.length;
    }
    var t = this.values;
    this.values = other.values;
    other.values = t;
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

class MatLU {
  width: number;
  height: number;
  private values: any;
  constructor(width: number,height: number,value: any){
    this.width = width;
    this.height = height;
    this.values = value;
  }
  solve(v:Vector):Vector{
    if(this.height < this.width){
      throw "Invalid size, too short: "+this.width+"x"+this.height;
    }else if(v.length != this.height){
      throw "Invalid size: "+this.width+"x"+this.height+" vs "+v.length;
    }
    return new Vector(v.length, numeric.LUsolve(this.values, v.values));
  }
}


class Mat {
  width: number;
  height: number;
  private values: Array<Array<number>>;
  constructor(width: number,height: number, empty?: boolean){
    this.width=width;
    this.height=height;
    if(!empty){
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
    var m = new Mat(len,len);
    var vs = numeric.identity(len);
    if(alpha != null){
      vs = numeric.mul(alpha, vs);
    }
    m.values = vs;
    return m;
  }
  static laplace1d(len: number, neumann?: boolean){
    var m = new Mat(len,len,true);
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
  muleq(f: number): Mat{
    this.values = numeric.mul(f,this.values);
    return this;
  }
  mul(f: number): Mat{
    var m = new Mat(this.width,this.height, true);
    m.values = numeric.mul(f,this.values);
    return m;
  }
  addeq(m: Mat): Mat{
    if(this.height != m.height || this.width != m.width){
      throw "Invalid size: "+this.width+"x"+this.height+" vs "+m.width+"x"+m.height;
    }
    numeric.addeq(this.values, m.values);
    return this;
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
  solve(v:Vector):Vector{
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
  LU():MatLU{
    return new MatLU(this.width, this.height, numeric.LU(this.values));
  }
  eig():any{
    return numeric.eig(this.values);
  }
}
