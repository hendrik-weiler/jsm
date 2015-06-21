# JavaScript Module Compiler

This little tool lets generates from javascript files
a namespaced based modular system.

Example:
```
// You start with a namespace
namespace test.a.b.c;

// And then you define a class
Test = function() {
	
}
Test.prototype.hallo = function() {
	
}
```

Then automaticly your namespace will generated
and the created classes will get the right namespace aswell.

Output:
```
if(typeof test.a=="undefined")test.a={};
if(typeof test.a.b=="undefined")test.a.b={};
if(typeof test.a.b.c=="undefined")test.a.b.c={};
test.a.b.c.Test=function(){}
test.a.b.c.Test.prototype.hallo=function(){}
test.a.b.c.Help=function(){}
```

## Install via npm

```
npm install -g jsm-compiler
```

Usage:<br>
```
jsmc folderToWatch fileToBuild
```

## How to compile?

```
node bin/jsmc test/app build.js
```

> The first parameter describes which folder will be read from.
> All javascript files will read and parsed and merged and minified.
> The second parameter describes which file the parsed content should be written in.