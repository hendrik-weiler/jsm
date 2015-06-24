# JavaScript Module Compiler

This tool lets you create basic javascript only applications.<br>
<br>
Additionaly you will be able to use namespaces and templates rather easy.<br>
<br>
At the end on every save you get a full build of your latest changes. <b>Production-Ready</b>.
<br>
Example:
```
// Set your template
template "start.html" as start;

// You start with a namespace
namespace test.a.b.c;

// And then you define a class
Test = function() {
	// set the template content to the body
	document.body.innerHTML = start;
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
start=document.getElementById("templates/start.html").innerHTML;
test.a.b.c.Test=function(){document.body.innerHTML = start;}
test.a.b.c.Test.prototype.hallo=function(){}
test.a.b.c.Help=function(){}
```

## Install via npm

```
npm install -g jsm-compiler
```

## Usage:<br>
<br>
Create Project:<br>
```
jsmc create projectname
```
<br>
Watch while in project folder:<br>
```
jsmc watch
```
<br>
Get version:<br>
```
jsmc version
```
<br><br>
## How to compile?

You have to be in a jsm project:
```
jsmc build
```
