const fs = require("fs");
const compiled = new WebAssembly.Module(fs.readFileSync(__dirname + "/build/untouched.wasm"));
const imports = {
  env: {
    abort(_msg, _file, line, column) {
       console.error("abort called at index.ts:" + line + ":" + column);
    }
  }
};
let exp=new WebAssembly.Instance(compiled, imports).exports
let mem=new Uint16Array(exp.memory.buffer,272,3)
let s=String.fromCharCode(...mem)
console.log("foo:",s)
