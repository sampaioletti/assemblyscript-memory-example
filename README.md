# AssemblyScript Memory Import/Export example

So given the quickstart application from the book https://docs.assemblyscript.org/quick-start and i'll use node.js for my host environment.

and append the following line to the file

```ts
const foo="bar";
```

if we then build the module with

```console
npm run asbuild:untouched
```

we get the following lines the the untouched.wat file (not in this order)

```wat
(memory $0 1) //tells host to create 1 page of memory and provide it to the module
(data (i32.const 256) "\06\00\00\00\01\00\00\00\01\00\00\00\06\00\00\00b\00a\00r\00")//the mem initializer with bar at 276
(global $assembly/index/foo i32 (i32.const 272)) //foo is located at index 272 in the mem
(export "memory" (memory $0)) //exports the memory instance back out to the host for use locally or another wasm module
```

So if we modify the index.js file to the following we can see the impact of that

```js
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
```

```console
> node index.js
> foo: bar
```

so that is how you would deal with an exported memory that you could then work with from the host and the wasm module

Importing memory

So now if we want to import memory we only have to do a couple of changes

rebuild with

```console
npm run asbuild:untouched -- --importMemory
```

now our untouched.wat is identical with one exception

```wat
(import "env" "memory" (memory $0 1)) //import rather than declare
```

Meaning we have to provide that upon instantiation. So we modify our index.js slightly to provide that (or in your case, perhaps the host already does this)

```js
const fs = require("fs");
const compiled = new WebAssembly.Module(fs.readFileSync(__dirname + "/build/untouched.wasm"));
const imports = {
  env: {
    abort(_msg, _file, line, column) {
       console.error("abort called at index.ts:" + line + ":" + column);
    },
    memory: new WebAssembly.Memory({initial:1})
  }
};
let exp=new WebAssembly.Instance(compiled, imports).exports
let mem=new Uint16Array(exp.memory.buffer,272,3)
let s=String.fromCharCode(...mem)
console.log("foo:",s)
```

results in the same
```console
> node index.js
> foo: bar
```

now if you are implementing the host, you are free to do whatever you want with that memory before/after and then you can access it from the wasm module by creating an array buffer at the memory you set from the host...or whatever you would like

as a small note from a host standpoint the env.memory I used is Naive, normally you would read the imports from the module...but i haven't done enough with the webassembly browser api to know how you get that. Most of my experience is from embedded systems.