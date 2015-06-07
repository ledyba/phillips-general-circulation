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
  toString():string{
    return "["+this.values.join(",")+"]";
  }
}
